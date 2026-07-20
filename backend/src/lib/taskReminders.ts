import db from '../db/database';
import { sendTaskReminderEmail, TaskReminder, loadEmailPreferencesForUser } from './email';
import { sendTelegramMessage } from './telegram';
import { parseNotificationChannels, hasChannel } from './notificationChannels';
import { safeJsonParse } from './json';
import { v4 as uuidv4 } from 'uuid';

/**
 * Envoie une notification Ntfy pour une tâche
 */
async function sendNtfyTaskNotification(
  serverUrl: string,
  topic: string,
  token: string | null,
  task: TaskReminder
): Promise<boolean> {
  if (!topic) return false;

  let urgencyTag = 'calendar';
  if (task.daysUntilDue !== undefined) {
    if (task.daysUntilDue < 0) urgencyTag = 'warning';
    else if (task.daysUntilDue <= 1) urgencyTag = 'alarm';
  }

  const message = [
    `📋 ${task.title}`,
    task.daysUntilDue !== undefined && task.daysUntilDue < 0
      ? `⚠️ En retard depuis ${Math.abs(task.daysUntilDue)} jour(s)`
      : task.daysUntilDue === 0
      ? '🔴 Échéance aujourd\'hui !'
      : task.daysUntilDue === 1
      ? '⚠️ Échéance demain'
      : task.daysUntilDue !== undefined
      ? `📅 Échéance dans ${task.daysUntilDue} jour(s)`
      : '',
    task.dueDate ? `📅 ${new Date(task.dueDate).toLocaleDateString('fr-FR')}` : '',
    task.client ? `👤 ${task.client}` : '',
    task.link || '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'text/plain; charset=utf-8',
      Title: `📋 Rappel : ${task.title}`,
      Priority: task.daysUntilDue !== undefined && task.daysUntilDue <= 1 ? 'high' : 'default',
      Tags: urgencyTag,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${serverUrl}/${topic}`, {
      method: 'POST',
      headers,
      body: message,
    });
    return response.ok;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification Ntfy (tâche):', error);
    return false;
  }
}

function formatTaskMessage(task: TaskReminder): string {
  return [
    `📋 ${task.title}`,
    task.daysUntilDue !== undefined && task.daysUntilDue < 0
      ? `⚠️ En retard depuis ${Math.abs(task.daysUntilDue)} jour(s)`
      : task.daysUntilDue === 0
      ? '🔴 Échéance aujourd\'hui !'
      : task.daysUntilDue === 1
      ? '⚠️ Échéance demain'
      : task.daysUntilDue !== undefined
      ? `📅 Échéance dans ${task.daysUntilDue} jour(s)`
      : '',
    task.dueDate ? `📅 ${new Date(task.dueDate).toLocaleDateString('fr-FR')}` : '',
    task.client ? `👤 ${task.client}` : '',
    task.link || '',
  ]
    .filter(Boolean)
    .join('\n');
}

async function sendTaskNotifications(
  channels: ReturnType<typeof parseNotificationChannels>,
  ntfyConfig: {
    server_url: string;
    topic: string;
    token: string | null;
    telegram_chat_id: string | null;
  },
  user: { email: string; name: string },
  task: TaskReminder,
  emailPrefs: ReturnType<typeof loadEmailPreferencesForUser>
): Promise<boolean> {
  let notificationSent = false;

  if (hasChannel(channels, 'ntfy') && ntfyConfig.topic) {
    const ntfySent = await sendNtfyTaskNotification(
      ntfyConfig.server_url || 'https://ntfy.sh',
      ntfyConfig.topic,
      ntfyConfig.token,
      task
    );
    if (ntfySent) notificationSent = true;
  }

  if (hasChannel(channels, 'email')) {
    const emailSent = await sendTaskReminderEmail(user.email, user.name, task, emailPrefs);
    if (emailSent) notificationSent = true;
  }

  if (hasChannel(channels, 'telegram') && ntfyConfig.telegram_chat_id) {
    const telegramSent = await sendTelegramMessage(
      ntfyConfig.telegram_chat_id,
      formatTaskMessage(task)
    );
    if (telegramSent) notificationSent = true;
  }

  return notificationSent;
}

/**
 * Calcule le nombre de jours jusqu'à la date d'échéance d'une tâche
 */
function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Vérifie si un rappel "jours avant" doit être envoyé
 */
function shouldSendDaysBeforeReminder(
  daysUntilDue: number,
  reminderDays: number[],
  taskId: string,
  reminderValue: number
): boolean {
  // Vérifier si on est exactement à X jours avant
  if (reminderDays.includes(daysUntilDue)) {
    // Vérifier si ce rappel n'a pas déjà été envoyé
    const existingReminder = db.prepare(`
      SELECT id FROM task_reminders 
      WHERE task_id = ? AND reminder_type = 'days_before' AND reminder_value = ?
    `).get(taskId, reminderValue.toString()) as { id: string } | undefined;

    return !existingReminder;
  }
  return false;
}

/**
 * Vérifie si un rappel date/heure précise doit être envoyé
 */
function shouldSendDatetimeReminder(
  reminderDatetime: string,
  taskId: string
): boolean {
  const now = new Date();
  const reminderDate = new Date(reminderDatetime);

  // Vérifier si la date/heure du rappel est passée (dans les dernières 24h pour éviter les doublons)
  const hoursSinceReminder = (now.getTime() - reminderDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceReminder >= 0 && hoursSinceReminder < 24) {
    // Vérifier si ce rappel n'a pas déjà été envoyé
    const existingReminder = db.prepare(`
      SELECT id FROM task_reminders 
      WHERE task_id = ? AND reminder_type = 'datetime' AND reminder_value = ?
    `).get(taskId, reminderDatetime) as { id: string } | undefined;

    return !existingReminder;
  }
  return false;
}

/**
 * Enregistre qu'un rappel a été envoyé
 */
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

      const channels = parseNotificationChannels(
        ntfyConfig?.notification_type,
        ntfyConfig?.notification_channels ?? null
      );
      const emailPrefs = loadEmailPreferencesForUser(user.id);

      // Récupérer les tâches non complétées de l'utilisateur
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

        // Vérifier les rappels "jours avant"
        if (task.reminder_days) {
          const reminderDays = safeJsonParse<number[]>(task.reminder_days, []);

          for (const daysBefore of reminderDays) {
              if (shouldSendDaysBeforeReminder(daysUntilDue, reminderDays, task.id, daysBefore)) {
                const taskReminder: TaskReminder = {
                  title: task.title,
                  description: task.description || undefined,
                  dueDate: task.due_date,
                  client: task.client || undefined,
                  link: task.link || undefined,
                  daysUntilDue,
                };

                const taskChannels = task.notification_channels
                  ? parseNotificationChannels(null, task.notification_channels)
                  : channels;
                const notificationSent = ntfyConfig
                  ? await sendTaskNotifications(taskChannels, ntfyConfig, user, taskReminder, emailPrefs)
                  : hasChannel(taskChannels, 'email')
                  ? await sendTaskReminderEmail(user.email, user.name, taskReminder, emailPrefs)
                  : false;

                if (notificationSent) {
                  recordReminderSent(task.id, 'days_before', daysBefore.toString());
                  reminderSent = true;
                  console.log(`Rappel "jours avant" envoyé pour la tâche "${task.title}" (${daysBefore} jours avant)`);
                }
              }
            }
        }

        // Vérifier les rappels date/heure précise
        if (task.reminder_datetime && !reminderSent) {
          if (shouldSendDatetimeReminder(task.reminder_datetime, task.id)) {
            const taskReminder: TaskReminder = {
              title: task.title,
              description: task.description || undefined,
              dueDate: task.due_date,
              client: task.client || undefined,
              link: task.link || undefined,
              daysUntilDue,
            };

            const taskChannels = task.notification_channels
              ? parseNotificationChannels(null, task.notification_channels)
              : channels;
            const notificationSent = ntfyConfig
              ? await sendTaskNotifications(taskChannels, ntfyConfig, user, taskReminder, emailPrefs)
              : hasChannel(taskChannels, 'email')
              ? await sendTaskReminderEmail(user.email, user.name, taskReminder, emailPrefs)
              : false;

            if (notificationSent) {
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
