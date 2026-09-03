import { isEmailConfigured } from './email';
import { isTelegramConfigured } from './telegram';
import { safeJsonParse } from './json';

export type NotificationChannel = 'ntfy' | 'email' | 'telegram';

function isChannel(value: unknown): value is NotificationChannel {
  return value === 'ntfy' || value === 'email' || value === 'telegram';
}

function filterChannels(values: unknown[]): NotificationChannel[] {
  return [...new Set(values.filter(isChannel))];
}

/** Fallback for rows that still only have the old notification_type column. */
function legacyTypeToChannels(type: string | null | undefined): NotificationChannel[] {
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

/** Resolve channels from JSON (preferred) or legacy notification_type. */
export function parseNotificationChannels(
  notificationChannels: unknown,
  legacyType?: string | null
): NotificationChannel[] {
  if (typeof notificationChannels === 'string') {
    const parsed = safeJsonParse<unknown>(notificationChannels, null);
    if (Array.isArray(parsed)) {
      const valid = filterChannels(parsed);
      if (valid.length > 0) return valid;
    }
  } else if (Array.isArray(notificationChannels)) {
    const valid = filterChannels(notificationChannels);
    if (valid.length > 0) return valid;
  }

  return legacyTypeToChannels(legacyType);
}

export function serializeNotificationChannels(channels: NotificationChannel[]): string {
  return JSON.stringify([...new Set(channels)]);
}

/** Minimal value for the NOT NULL notification_type column (no longer used for routing). */
export function primaryChannelType(channels: NotificationChannel[]): string {
  return channels[0] || 'ntfy';
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
  task_auto_reminders_enabled?: number | null;
  reminder_frequency: string | null;
  last_reminder_sent_at?: string | null;
}

export function formatNtfyConfigResponse(config: NtfyConfigRow) {
  const notificationChannels = parseNotificationChannels(
    config.notification_channels ?? null,
    config.notification_type
  );

  return {
    enabled: config.enabled === 1,
    serverUrl: config.server_url,
    topic: config.topic,
    token: config.token || undefined,
    notificationChannels,
    telegramChatId: config.telegram_chat_id || undefined,
    autoRemindersEnabled: config.auto_reminders_enabled === 1,
    taskAutoRemindersEnabled: config.task_auto_reminders_enabled === 1,
    reminderFrequency: config.reminder_frequency || 'daily',
    lastReminderSentAt: config.last_reminder_sent_at || undefined,
    emailConfigured: isEmailConfigured(),
    telegramConfigured: isTelegramConfigured(),
  };
}
