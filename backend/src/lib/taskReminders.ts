import db from '../db/database';
import { TaskReminder, loadEmailPreferencesForUser } from './email';
import { parseNotificationChannels } from './notificationChannels';
import {
  sendTaskNotifications,
  NotificationDispatchConfig,
} from './notificationDispatch';
import { safeJsonParse } from './json';
import { v4 as uuidv4 } from 'uuid';

function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function shouldSendDaysBeforeReminder(
  daysUntilDue: number,
  reminderDays: number[],
  taskId: string,
  reminderValue: number
): boolean {
  if (!reminderDays.includes(daysUntilDue)) return false;

  const existingReminder = db.prepare(`
    SELECT id FROM task_reminders
    WHERE task_id = ? AND reminder_type = 'days_before' AND reminder_value = ?
  `).get(taskId, reminderValue.toString()) as { id: string } | undefined;

  return !existingReminder;
}

function shouldSendDatetimeReminder(reminderDatetime: string, taskId: string): boolean {
  const now = new Date();
  const reminderDate = new Date(reminderDatetime);
  const hoursSinceReminder = (now.getTime() - reminderDate.getTime()) / (1000 * 60 * 60);

  if (hoursSinceReminder < 0 || hoursSinceReminder >= 24) return false;

  const existingReminder = db.prepare(`
    SELECT id FROM task_reminders
    WHERE task_id = ? AND reminder_type = 'datetime' AND reminder_value = ?
  `).get(taskId, reminderDatetime) as { id: string } | undefined;

  return !existingReminder;
}

function recordReminderSent(
  taskId: string,
  reminderType: 'days_before' | 'datetime',
  reminderValue: string
): void {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO task_reminders (id, task_id, reminder_type, reminder_value, sent_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, taskId, reminderType, reminderValue, now, now);
}

function toDispatchConfig(
  channels: ReturnType<typeof parseNotificationChannels>,
  ntfyConfig: {
    server_url: string;
    topic: string;
    token: string | null;
    telegram_chat_id: string | null;
  } | undefined
): NotificationDispatchConfig {
  return {
    channels,
    serverUrl: ntfyConfig?.server_url || 'https://ntfy.sh',
    topic: ntfyConfig?.topic || '',
    token: ntfyConfig?.token ?? null,
    telegramChatId: ntfyConfig?.telegram_chat_id ?? null,
  };
}

/**
 * Vérifie et envoie les rappels automatiques pour toutes les tâches
 */
export async function checkAndSendTaskReminders(): Promise<void> {
  try {
    const users = db.prepare(`
      SELECT u.id, u.email, u.name, nc.task_auto_reminders_enabled
      FROM users u
      INNER JOIN ntfy_configs nc ON u.id = nc.user_id
      WHERE nc.task_auto_reminders_enabled = 1
    `).all() as Array<{
      id: string;
      email: string;
      name: string;
      task_auto_reminders_enabled: number;
    }>;

    for (const user of users) {
      const ntfyConfig = db.prepare(`
        SELECT notification_type, notification_channels, server_url, topic, token, telegram_chat_id
        FROM ntfy_configs WHERE user_id = ?
      `).get(user.id) as {
        notification_type: string;
        notification_channels: string | null;
        server_url: string;
        topic: string;
        token: string | null;
        telegram_chat_id: string | null;
      } | undefined;

      const accountChannels = parseNotificationChannels(
        ntfyConfig?.notification_channels ?? null,
        ntfyConfig?.notification_type
      );
      const emailPrefs = loadEmailPreferencesForUser(user.id);

      const tasks = db.prepare(`
        SELECT id, title, description, due_date, client, link, tags, notification_channels, reminder_days, reminder_datetime
        FROM tasks
        WHERE user_id = ? AND status != 'completed'
      `).all(user.id) as Array<{
        id: string;
        title: string;
        description: string | null;
        due_date: string;
        client: string | null;
        link: string | null;
        tags: string | null;
        notification_channels: string | null;
        reminder_days: string | null;
        reminder_datetime: string | null;
      }>;

      for (const task of tasks) {
        const daysUntilDue = getDaysUntilDue(task.due_date);
        let reminderSent = false;

        const taskReminder: TaskReminder = {
          title: task.title,
          description: task.description || undefined,
          dueDate: task.due_date,
          client: task.client || undefined,
          link: task.link || undefined,
          daysUntilDue,
        };

        const taskChannels = task.notification_channels
          ? parseNotificationChannels(task.notification_channels)
          : accountChannels;
        const dispatchConfig = toDispatchConfig(taskChannels, ntfyConfig);

        const send = () => sendTaskNotifications(dispatchConfig, user, taskReminder, emailPrefs);

        if (task.reminder_days) {
          const reminderDays = safeJsonParse<number[]>(task.reminder_days, []);

          for (const daysBefore of reminderDays) {
            if (shouldSendDaysBeforeReminder(daysUntilDue, reminderDays, task.id, daysBefore)) {
              if (await send()) {
                recordReminderSent(task.id, 'days_before', daysBefore.toString());
                reminderSent = true;
                console.log(
                  `Rappel "jours avant" envoyé pour la tâche "${task.title}" (${daysBefore} jours avant)`
                );
              }
            }
          }
        }

        if (task.reminder_datetime && !reminderSent) {
          if (shouldSendDatetimeReminder(task.reminder_datetime, task.id)) {
            if (await send()) {
              recordReminderSent(task.id, 'datetime', task.reminder_datetime);
              console.log(`Rappel date/heure envoyé pour la tâche "${task.title}"`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des rappels de tâches:', error);
  }
}
