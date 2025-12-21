import db from '../db/database';
import { sendTaskReminderEmail, TaskReminder } from './email';
import { v4 as uuidv4 } from 'uuid';

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
    // Récupérer tous les utilisateurs
    const users = db.prepare(`
      SELECT id, email, name
      FROM users
    `).all() as Array<{
      id: string;
      email: string;
      name: string;
    }>;

    for (const user of users) {
      // Récupérer les tâches non complétées de l'utilisateur
      const tasks = db.prepare(`
        SELECT id, title, description, due_date, client, link, reminder_days, reminder_datetime
        FROM tasks
        WHERE user_id = ? AND status != 'completed'
      `).all(user.id) as Array<{
        id: string;
        title: string;
        description: string | null;
        due_date: string;
        client: string | null;
        link: string | null;
        reminder_days: string | null;
        reminder_datetime: string | null;
      }>;

      for (const task of tasks) {
        const daysUntilDue = getDaysUntilDue(task.due_date);
        let reminderSent = false;

        // Vérifier les rappels "jours avant"
        if (task.reminder_days) {
          try {
            const reminderDays = JSON.parse(task.reminder_days) as number[];
            
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

                const emailSent = await sendTaskReminderEmail(
                  user.email,
                  user.name,
                  taskReminder
                );

                if (emailSent) {
                  recordReminderSent(task.id, 'days_before', daysBefore.toString());
                  reminderSent = true;
                  console.log(`Rappel "jours avant" envoyé pour la tâche "${task.title}" (${daysBefore} jours avant)`);
                }
              }
            }
          } catch (error) {
            console.error(`Erreur lors du parsing de reminder_days pour la tâche ${task.id}:`, error);
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

            const emailSent = await sendTaskReminderEmail(
              user.email,
              user.name,
              taskReminder
            );

            if (emailSent) {
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
