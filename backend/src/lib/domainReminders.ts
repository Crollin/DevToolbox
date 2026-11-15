import db from '../db/database';
import { parseNotificationChannels } from './notificationChannels';
import { sendDomainNotifications, NotificationDispatchConfig } from './notificationDispatch';
import { loadEmailPreferencesForUser } from './email';
import { getDaysUntilExpiry } from './domainBillingExport';

function shouldSendReminder(daysUntilExpiry: number | null): boolean {
  return daysUntilExpiry !== null && [60, 30, 7, 1, 0, -1].includes(daysUntilExpiry);
}

/**
 * Rappels domaines (J-60 / J-30 / J-7 / J-1 / J / J+1) via les canaux de notification existants.
 */
export async function checkAndSendDomainReminders(): Promise<void> {
  try {
    const users = db.prepare(`
      SELECT u.id, u.email, u.name, nc.notification_type, nc.notification_channels,
             nc.auto_reminders_enabled, nc.reminder_frequency, nc.last_reminder_sent_at,
             nc.server_url, nc.topic, nc.token, nc.telegram_chat_id
      FROM users u
      LEFT JOIN ntfy_configs nc ON u.id = nc.user_id
      WHERE nc.auto_reminders_enabled = 1
    `).all() as Array<{
      id: string;
      email: string;
      name: string;
      notification_type: string;
      notification_channels: string | null;
      auto_reminders_enabled: number;
      reminder_frequency: string;
      last_reminder_sent_at: string | null;
      server_url: string;
      topic: string;
      token: string | null;
      telegram_chat_id: string | null;
    }>;

    for (const user of users) {
      // L'anti-doublon est géré par domain_reminders_sent (par domaine et par seuil J-x).
      // last_reminder_sent_at est partagé avec les licences : on ne s'en sert pas ici.

      const domains = db.prepare(`
        SELECT id, name, client_name, client_email, payer, sell_yearly, currency, expires_at
        FROM domains
        WHERE user_id = ? AND (notifications_enabled IS NULL OR notifications_enabled = 1)
      `).all(user.id) as Array<{
        name: string;
        client_name: string | null;
        client_email: string | null;
        payer: string;
        sell_yearly: number | null;
        currency: string;
        expires_at: string | null;
      }>;

      const pending: Array<{ id: string; days: number; expiresAt: string }> = [];

      const toNotify = domains.flatMap((d) => {
        const days = getDaysUntilExpiry(d.expires_at);
        if (days === null || !d.expires_at || !shouldSendReminder(days)) return [];
        // Déjà notifié pour ce seuil et cette échéance → on ignore
        const already = db.prepare(`
          SELECT 1 FROM domain_reminders_sent
          WHERE domain_id = ? AND threshold_days = ? AND expires_at = ?
        `).get(d.id, days, d.expires_at);
        if (already) return [];
        pending.push({ id: d.id, days, expiresAt: d.expires_at });
        return [{
          name: d.name,
          clientName: d.client_name,
          clientEmail: d.client_email,
          payer: d.payer,
          sellYearly: d.sell_yearly,
          currency: d.currency || 'EUR',
          daysUntilExpiry: days ?? 0,
          isExpired: (days ?? 0) < 0,
        }];
      });

      if (toNotify.length === 0) continue;

      const channels = parseNotificationChannels(
        user.notification_channels,
        user.notification_type || 'ntfy'
      );

      const config: NotificationDispatchConfig = {
        channels,
        serverUrl: user.server_url || 'https://ntfy.sh',
        topic: user.topic || '',
        token: user.token,
        telegramChatId: user.telegram_chat_id,
      };

      const emailPrefs = loadEmailPreferencesForUser(user.id);
      const results = await sendDomainNotifications(
        config,
        { email: user.email, name: user.name },
        toNotify,
        emailPrefs,
        user.id
      );

      // Au moins un canal a abouti → on mémorise pour ne plus renvoyer ce seuil
      if (Object.values(results).some((v) => v === true)) {
        const now = new Date().toISOString();
        const insert = db.prepare(`
          INSERT OR IGNORE INTO domain_reminders_sent (domain_id, threshold_days, expires_at, sent_at)
          VALUES (?, ?, ?, ?)
        `);
        for (const p of pending) insert.run(p.id, p.days, p.expiresAt, now);
      }
    }
  } catch (error) {
    console.error('Erreur rappels domaines:', error);
  }
}
