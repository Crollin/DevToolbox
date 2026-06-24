import { isEmailConfigured } from './email';
import { isTelegramConfigured } from './telegram';

export type NotificationChannel = 'ntfy' | 'email' | 'telegram';

export const NOTIFICATION_CHANNELS: NotificationChannel[] = ['ntfy', 'email', 'telegram'];

export function parseNotificationChannels(
  notificationType: string | null | undefined,
  notificationChannelsJson: string | null | undefined
): NotificationChannel[] {
  if (notificationChannelsJson) {
    try {
      const parsed = JSON.parse(notificationChannelsJson) as unknown;
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(
          (channel): channel is NotificationChannel =>
            channel === 'ntfy' || channel === 'email' || channel === 'telegram'
        );
        if (valid.length > 0) {
          return [...new Set(valid)];
        }
      }
    } catch {
      // Utiliser le type legacy
    }
  }

  return legacyTypeToChannels(notificationType);
}

export function legacyTypeToChannels(type: string | null | undefined): NotificationChannel[] {
  switch (type) {
    case 'both':
      return ['ntfy', 'email'];
    case 'email':
      return ['email'];
    case 'telegram':
      return ['telegram'];
    case 'ntfy':
    default:
      return ['ntfy'];
  }
}

export function channelsToLegacyType(channels: NotificationChannel[]): string {
  const normalized = [...new Set(channels)];
  if (normalized.length === 0) {
    return 'ntfy';
  }
  if (normalized.length === 1) {
    return normalized[0];
  }
  const hasNtfy = normalized.includes('ntfy');
  const hasEmail = normalized.includes('email');
  if (hasNtfy && hasEmail && normalized.length === 2) {
    return 'both';
  }
  return normalized[0];
}

export function serializeNotificationChannels(channels: NotificationChannel[]): string {
  return JSON.stringify([...new Set(channels)]);
}

export function hasChannel(channels: NotificationChannel[], channel: NotificationChannel): boolean {
  return channels.includes(channel);
}

export function normalizeNotificationChannels(
  notificationChannels: unknown,
  notificationType?: string | null
): NotificationChannel[] {
  if (Array.isArray(notificationChannels)) {
    const valid = notificationChannels.filter(
      (channel): channel is NotificationChannel =>
        channel === 'ntfy' || channel === 'email' || channel === 'telegram'
    );
    if (valid.length > 0) {
      return [...new Set(valid)];
    }
  }

  return legacyTypeToChannels(notificationType);
}

interface NtfyConfigRow {
  enabled: number;
  server_url: string;
  topic: string;
  token: string | null;
  notification_type: string | null;
  notification_channels?: string | null;
  telegram_chat_id?: string | null;
  auto_reminders_enabled: number | null;
  reminder_frequency: string | null;
  last_reminder_sent_at?: string | null;
}

export function formatNtfyConfigResponse(config: NtfyConfigRow) {
  const notificationChannels = parseNotificationChannels(
    config.notification_type,
    config.notification_channels ?? null
  );

  return {
    enabled: config.enabled === 1,
    serverUrl: config.server_url,
    topic: config.topic,
    token: config.token || undefined,
    notificationType: channelsToLegacyType(notificationChannels),
    notificationChannels,
    telegramChatId: config.telegram_chat_id || undefined,
    autoRemindersEnabled: config.auto_reminders_enabled === 1,
    reminderFrequency: config.reminder_frequency || 'daily',
    lastReminderSentAt: config.last_reminder_sent_at || undefined,
    emailConfigured: isEmailConfigured(),
    telegramConfigured: isTelegramConfigured(),
  };
}
