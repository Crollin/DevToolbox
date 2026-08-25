import webpush from 'web-push';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';

export interface WebPushPayload {
  title: string;
  body: string;
  url?: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface StoredSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:admin@localhost';

  if (!publicKey || !privateKey) {
    vapidConfigured = false;
    return false;
  }

  if (!vapidConfigured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
  }
  return true;
}

export function isWebPushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim());
}

export function getVapidPublicKey(): string | null {
  if (!isWebPushConfigured()) {
    return null;
  }
  return process.env.VAPID_PUBLIC_KEY!.trim();
}

export function countPushSubscriptions(userId: string): number {
  const row = db
    .prepare('SELECT COUNT(*) as count FROM push_subscriptions WHERE user_id = ?')
    .get(userId) as { count: number };
  return row.count;
}

export function upsertPushSubscription(
  userId: string,
  subscription: PushSubscriptionInput,
  userAgent?: string | null
): void {
  const now = new Date().toISOString();
  const existing = db
    .prepare('SELECT id FROM push_subscriptions WHERE endpoint = ?')
    .get(subscription.endpoint) as { id: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE push_subscriptions
      SET user_id = ?, p256dh = ?, auth = ?, user_agent = ?, updated_at = ?
      WHERE id = ?
    `).run(
      userId,
      subscription.keys.p256dh,
      subscription.keys.auth,
      userAgent || null,
      now,
      existing.id
    );
    return;
  }

  db.prepare(`
    INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    userId,
    subscription.endpoint,
    subscription.keys.p256dh,
    subscription.keys.auth,
    userAgent || null,
    now,
    now
  );
}

export function deletePushSubscription(userId: string, endpoint: string): boolean {
  const result = db
    .prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?')
    .run(userId, endpoint);
  return result.changes > 0;
}

export function deleteAllPushSubscriptions(userId: string): number {
  const result = db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(userId);
  return result.changes;
}

function deleteByEndpoint(endpoint: string): void {
  db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
}

/**
 * Envoie une notification Web Push à tous les appareils abonnés de l'utilisateur.
 * Mode B : indépendant des canaux ntfy/email/telegram.
 * Retourne true si au moins un envoi a réussi.
 */
export async function sendWebPushToUser(
  userId: string,
  payload: WebPushPayload
): Promise<{ sent: boolean; count: number; error?: string }> {
  if (!ensureVapidConfigured()) {
    return { sent: false, count: 0 };
  }

  const subscriptions = db
    .prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?')
    .all(userId) as StoredSubscription[];

  if (subscriptions.length === 0) {
    return { sent: false, count: 0 };
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/',
  });

  let successCount = 0;
  let lastError: string | undefined;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        body
      );
      successCount += 1;
    } catch (error) {
      const statusCode =
        error && typeof error === 'object' && 'statusCode' in error
          ? Number((error as { statusCode: number }).statusCode)
          : undefined;

      if (statusCode === 404 || statusCode === 410) {
        deleteByEndpoint(sub.endpoint);
        continue;
      }

      lastError = error instanceof Error ? error.message : 'Erreur Web Push';
      console.error('Erreur Web Push:', error);
    }
  }

  return {
    sent: successCount > 0,
    count: successCount,
    error: successCount === 0 ? lastError || 'Aucun appareil joignable' : undefined,
  };
}
