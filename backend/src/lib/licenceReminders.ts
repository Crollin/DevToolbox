import db from '../db/database';
import { sendLicenceExpirationEmail, ExpiringLicence } from './email';

/**
 * Calcule le nombre de jours jusqu'à l'expiration d'une licence
 */
function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiresAt);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Détermine si une licence doit recevoir un rappel aujourd'hui
 * Rappels envoyés à 30 jours, 7 jours et 1 jour avant expiration
 */
function shouldSendReminder(daysUntilExpiry: number | null): boolean {
  if (daysUntilExpiry === null) return false;
  // Envoyer un rappel si la licence expire dans exactement 30, 7 ou 1 jour, ou si elle est déjà expirée
  return daysUntilExpiry <= 30 && (daysUntilExpiry === 30 || daysUntilExpiry === 7 || daysUntilExpiry === 1 || daysUntilExpiry < 0);
}

/**
 * Envoie une notification Ntfy
 */
async function sendNtfyNotification(
  serverUrl: string,
  topic: string,
  token: string | null,
  licences: ExpiringLicence[]
): Promise<boolean> {
  if (!topic) {
    return false;
  }

  const expiredCount = licences.filter((l) => l.isExpired).length;
  const message = licences
    .map((l) => {
      if (l.isExpired) {
        return `❌ ${l.name} - Expirée depuis ${Math.abs(l.daysUntilExpiry)} jours`;
      }
      return `⚠️ ${l.name} - ${l.daysUntilExpiry} jours restants`;
    })
    .join('\n');

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'text/plain',
      Title: `🔑 Licences à renouveler (${licences.length})`,
      Priority: expiredCount > 0 ? 'high' : 'default',
      Tags: expiredCount > 0 ? 'warning,key' : 'key',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${serverUrl}/${topic}`, {
      method: 'POST',
      headers,
      body: message,
    });

    return response.ok;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification Ntfy:', error);
    return false;
  }
}

/**
 * Vérifie et envoie les rappels automatiques pour toutes les licences expirantes
 */
export async function checkAndSendReminders(): Promise<void> {
  try {
    // Récupérer tous les utilisateurs avec leurs configurations de notifications
    const users = db.prepare(`
      SELECT u.id, u.email, u.name, nc.notification_type, nc.auto_reminders_enabled, 
             nc.reminder_frequency, nc.last_reminder_sent_at, nc.server_url, nc.topic, nc.token
      FROM users u
      LEFT JOIN ntfy_configs nc ON u.id = nc.user_id
      WHERE nc.auto_reminders_enabled = 1
    `).all() as Array<{
      id: string;
      email: string;
      name: string;
      notification_type: string;
      auto_reminders_enabled: number;
      reminder_frequency: string;
      last_reminder_sent_at: string | null;
      server_url: string;
      topic: string;
      token: string | null;
    }>;

    const now = new Date().toISOString();

    for (const user of users) {
      // Vérifier la fréquence des rappels
      if (user.last_reminder_sent_at) {
        const lastSent = new Date(user.last_reminder_sent_at);
        const hoursSinceLastSent = (new Date().getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        
        if (user.reminder_frequency === 'daily' && hoursSinceLastSent < 24) {
          continue; // Pas encore le moment d'envoyer un rappel quotidien
        }
        if (user.reminder_frequency === 'weekly' && hoursSinceLastSent < 168) {
          continue; // Pas encore le moment d'envoyer un rappel hebdomadaire
        }
      }

      // Récupérer les licences de l'utilisateur (uniquement celles avec notifications activées)
      const licences = db.prepare(`
        SELECT id, name, expires_at, status, notifications_enabled
        FROM licences
        WHERE user_id = ? AND status != 'lifetime' AND (notifications_enabled IS NULL OR notifications_enabled = 1)
      `).all(user.id) as Array<{
        id: string;
        name: string;
        expires_at: string | null;
        status: string;
        notifications_enabled: number | null;
      }>;

      // Filtrer les licences nécessitant un rappel
      const licencesToNotify: ExpiringLicence[] = [];
      
      for (const licence of licences) {
        const daysUntilExpiry = getDaysUntilExpiry(licence.expires_at);
        if (shouldSendReminder(daysUntilExpiry)) {
          licencesToNotify.push({
            name: licence.name,
            daysUntilExpiry: daysUntilExpiry || 0,
            isExpired: daysUntilExpiry !== null && daysUntilExpiry < 0,
          });
        }
      }

      if (licencesToNotify.length === 0) {
        continue; // Aucune licence à notifier pour cet utilisateur
      }

      // Envoyer les notifications selon le type configuré
      let notificationSent = false;

      if (user.notification_type === 'ntfy' || user.notification_type === 'both') {
        const ntfySent = await sendNtfyNotification(
          user.server_url || 'https://ntfy.sh',
          user.topic || '',
          user.token,
          licencesToNotify
        );
        if (ntfySent) {
          notificationSent = true;
        }
      }

      if (user.notification_type === 'email' || user.notification_type === 'both') {
        const emailSent = await sendLicenceExpirationEmail(
          user.email,
          user.name,
          licencesToNotify
        );
        if (emailSent) {
          notificationSent = true;
        }
      }

      // Mettre à jour la date du dernier rappel envoyé si au moins une notification a été envoyée
      if (notificationSent) {
        db.prepare(`
          UPDATE ntfy_configs
          SET last_reminder_sent_at = ?
          WHERE user_id = ?
        `).run(now, user.id);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des rappels de licences:', error);
  }
}

