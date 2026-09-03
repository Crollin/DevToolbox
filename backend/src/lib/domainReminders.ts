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
      if (user.last_reminder_sent_at) {
        const lastSent = new Date(user.last_reminder_sent_at);
        const hoursSinceLastSent = (new Date().getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        if (user.reminder_frequency === 'daily' && hoursSinceLastSent < 24) continue;
        if (user.reminder_frequency === 'weekly' && hoursSinceLastSent < 168) continue;
      }

      const domains = db.prepare(`
        SELECT name, client_name, client_email, payer, sell_yearly, currency, expires_at
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

      const toNotify = domains.flatMap((d) => {
        const days = getDaysUntilExpiry(d.expires_at);
        if (!shouldSendReminder(days)) return [];
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
      await sendDomainNotifications(
        config,
        { email: user.email, name: user.name },
        toNotify,
        emailPrefs,
        user.id
      );
    }
  } catch (error) {
    console.error('Erreur rappels domaines:', error);
  }
}
