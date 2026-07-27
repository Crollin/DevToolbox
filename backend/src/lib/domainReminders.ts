import db from '../db/database';
import { parseNotificationChannels } from './notificationChannels';
import { sendLicenceNotifications, NotificationDispatchConfig } from './notificationDispatch';

function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiresAt);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function shouldSendReminder(daysUntilExpiry: number | null): boolean {
  if (daysUntilExpiry === null) return false;
  return (
    daysUntilExpiry === 60 ||
    daysUntilExpiry === 30 ||
    daysUntilExpiry === 7 ||
    daysUntilExpiry === 1 ||
    daysUntilExpiry === 0 ||
    daysUntilExpiry === -1
  );
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
      if (user.last_reminder_sent_at) {
        const lastSent = new Date(user.last_reminder_sent_at);
        const hoursSinceLastSent = (new Date().getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        if (user.reminder_frequency === 'daily' && hoursSinceLastSent < 24) continue;
        if (user.reminder_frequency === 'weekly' && hoursSinceLastSent < 168) continue;
      }

      const domains = db.prepare(`
        SELECT id, name, expires_at, payer, client_name, notifications_enabled
        FROM domains
        WHERE user_id = ? AND (notifications_enabled IS NULL OR notifications_enabled = 1)
      `).all(user.id) as Array<{
        id: string;
        name: string;
        expires_at: string | null;
        payer: string;
        client_name: string | null;
        notifications_enabled: number | null;
      }>;

      const toNotify = domains
        .map((d) => ({
          ...d,
          daysUntilExpiry: getDaysUntilExpiry(d.expires_at),
        }))
        .filter((d) => shouldSendReminder(d.daysUntilExpiry));

      if (toNotify.length === 0) continue;

      const channels = parseNotificationChannels(
        user.notification_type || 'ntfy',
        user.notification_channels
      );

      const config: NotificationDispatchConfig = {
        channels,
        serverUrl: user.server_url || 'https://ntfy.sh',
        topic: user.topic || '',
        token: user.token,
        telegramChatId: user.telegram_chat_id,
      };

      const fakeLicences = toNotify.map((d) => ({
        name: `Domaine ${d.name}${d.client_name ? ` (${d.client_name})` : ''} — payeur: ${d.payer}`,
        daysUntilExpiry: d.daysUntilExpiry || 0,
        isExpired: (d.daysUntilExpiry || 0) < 0,
      }));

      await sendLicenceNotifications(
        config,
        { email: user.email, name: user.name },
        fakeLicences,
        null
      );
    }
  } catch (error) {
    console.error('Erreur rappels domaines:', error);
  }
}
