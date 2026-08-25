import db from '../db/database';
import { ExpiringLicence, loadEmailPreferencesForUser } from './email';
import { parseNotificationChannels } from './notificationChannels';
import { sendLicenceNotifications, NotificationDispatchConfig } from './notificationDispatch';

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
 * Détermine si une licence doit recevoir un rappel aujourd'hui.
 * Seuils : J-30, J-7, J-1, jour J (0), et un seul rappel le lendemain d'expiration (J+1).
 */
function shouldSendReminder(daysUntilExpiry: number | null): boolean {
  if (daysUntilExpiry === null) return false;
  return (
    daysUntilExpiry === 30 ||
    daysUntilExpiry === 7 ||
    daysUntilExpiry === 1 ||
    daysUntilExpiry === 0 ||
    daysUntilExpiry === -1
  );
}

/**
 * Vérifie et envoie les rappels automatiques pour toutes les licences expirantes
 */
export async function checkAndSendReminders(): Promise<void> {
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

    const now = new Date().toISOString();

    for (const user of users) {
      if (user.last_reminder_sent_at) {
        const lastSent = new Date(user.last_reminder_sent_at);
        const hoursSinceLastSent = (new Date().getTime() - lastSent.getTime()) / (1000 * 60 * 60);

        if (user.reminder_frequency === 'daily' && hoursSinceLastSent < 24) {
          continue;
        }
        if (user.reminder_frequency === 'weekly' && hoursSinceLastSent < 168) {
          continue;
        }
      }

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
        continue;
      }

      const dispatchConfig: NotificationDispatchConfig = {
        channels: parseNotificationChannels(user.notification_type, user.notification_channels),
        serverUrl: user.server_url || 'https://ntfy.sh',
        topic: user.topic || '',
        token: user.token,
        telegramChatId: user.telegram_chat_id,
      };

      const emailPrefs = loadEmailPreferencesForUser(user.id);
      const results = await sendLicenceNotifications(
        dispatchConfig,
        { email: user.email, name: user.name },
        licencesToNotify,
        emailPrefs,
        user.id
      );

      const notificationSent = Object.values(results).some((value) => value === true);

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
