import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import {
  formatNtfyConfigResponse,
  parseNotificationChannels,
  serializeNotificationChannels,
  primaryChannelType,
} from './notificationChannels';

export type NtfyConfigUpsertInput = {
  enabled?: boolean;
  serverUrl?: string;
  topic?: string;
  token?: string | null;
  notificationChannels?: unknown;
  notificationType?: string | null;
  telegramChatId?: string | null;
  autoRemindersEnabled?: boolean;
  taskAutoRemindersEnabled?: boolean;
  reminderFrequency?: string;
};

type NtfyRow = {
  enabled: number;
  server_url: string;
  topic: string;
  token: string | null;
  notification_type: string | null;
  notification_channels: string | null;
  telegram_chat_id: string | null;
  auto_reminders_enabled: number | null;
  task_auto_reminders_enabled: number | null;
  reminder_frequency: string | null;
  last_reminder_sent_at: string | null;
};

function defaultRow(): NtfyRow {
  return {
    enabled: 0,
    server_url: 'https://ntfy.sh',
    topic: '',
    token: null,
    notification_type: 'ntfy',
    notification_channels: '["ntfy"]',
    telegram_chat_id: null,
    auto_reminders_enabled: 0,
    task_auto_reminders_enabled: 0,
    reminder_frequency: 'daily',
    last_reminder_sent_at: null,
  };
}

export function getOrCreateNtfyConfig(userId: string) {
  const config = db.prepare('SELECT * FROM ntfy_configs WHERE user_id = ?').get(userId) as
    | NtfyRow
    | undefined;

  if (config) {
    return formatNtfyConfigResponse(config);
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  const defaults = defaultRow();
  db.prepare(`
    INSERT INTO ntfy_configs (
      id, user_id, enabled, server_url, topic, token, notification_type, notification_channels,
      telegram_chat_id, auto_reminders_enabled, task_auto_reminders_enabled, reminder_frequency,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    defaults.enabled,
    defaults.server_url,
    defaults.topic,
    defaults.token,
    defaults.notification_type,
    defaults.notification_channels,
    defaults.telegram_chat_id,
    defaults.auto_reminders_enabled,
    defaults.task_auto_reminders_enabled,
    defaults.reminder_frequency,
    now,
    now
  );

  return formatNtfyConfigResponse(defaults);
}

export function upsertNtfyConfig(userId: string, body: NtfyConfigUpsertInput) {
  const existing = db.prepare('SELECT * FROM ntfy_configs WHERE user_id = ?').get(userId) as
    | NtfyRow
    | undefined;
  const base = existing ?? defaultRow();

  const channels = parseNotificationChannels(
    body.notificationChannels !== undefined
      ? body.notificationChannels
      : base.notification_channels,
    body.notificationType !== undefined ? body.notificationType : base.notification_type
  );
  const channelsJson = serializeNotificationChannels(channels);
  const typeCol = primaryChannelType(channels);
  const now = new Date().toISOString();

  const enabled =
    body.enabled !== undefined ? (body.enabled ? 1 : 0) : base.enabled;
  const serverUrl = body.serverUrl ?? base.server_url ?? 'https://ntfy.sh';
  const topic = body.topic ?? base.topic ?? '';
  const token = body.token !== undefined ? body.token || null : base.token;
  const telegramChatId =
    body.telegramChatId !== undefined
      ? body.telegramChatId || null
      : base.telegram_chat_id;
  const autoRemindersEnabled =
    body.autoRemindersEnabled !== undefined
      ? body.autoRemindersEnabled
        ? 1
        : 0
      : base.auto_reminders_enabled ?? 0;
  const taskAutoRemindersEnabled =
    body.taskAutoRemindersEnabled !== undefined
      ? body.taskAutoRemindersEnabled
        ? 1
        : 0
      : base.task_auto_reminders_enabled ?? 0;
  const reminderFrequency =
    body.reminderFrequency ?? base.reminder_frequency ?? 'daily';

  if (existing) {
    db.prepare(`
      UPDATE ntfy_configs
      SET enabled = ?, server_url = ?, topic = ?, token = ?, notification_type = ?,
          notification_channels = ?, telegram_chat_id = ?, auto_reminders_enabled = ?,
          task_auto_reminders_enabled = ?, reminder_frequency = ?, updated_at = ?
      WHERE user_id = ?
    `).run(
      enabled,
      serverUrl,
      topic,
      token,
      typeCol,
      channelsJson,
      telegramChatId,
      autoRemindersEnabled,
      taskAutoRemindersEnabled,
      reminderFrequency,
      now,
      userId
    );
  } else {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO ntfy_configs (
        id, user_id, enabled, server_url, topic, token, notification_type, notification_channels,
        telegram_chat_id, auto_reminders_enabled, task_auto_reminders_enabled, reminder_frequency,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      enabled,
      serverUrl,
      topic,
      token,
      typeCol,
      channelsJson,
      telegramChatId,
      autoRemindersEnabled,
      taskAutoRemindersEnabled,
      reminderFrequency,
      now,
      now
    );
  }

  return formatNtfyConfigResponse({
    enabled,
    server_url: serverUrl,
    topic,
    token,
    notification_type: typeCol,
    notification_channels: channelsJson,
    telegram_chat_id: telegramChatId,
    auto_reminders_enabled: autoRemindersEnabled,
    task_auto_reminders_enabled: taskAutoRemindersEnabled,
    reminder_frequency: reminderFrequency,
    last_reminder_sent_at: existing?.last_reminder_sent_at ?? null,
  });
}
