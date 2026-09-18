import { z } from 'zod';
import { randomUUID } from 'crypto';
import db from '../db/database';

export const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(30000).optional(),
  dueDate: z.string().refine(v => {
    if (Number.isNaN(Date.parse(v)) || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(v)) return false;
    const day = v.slice(0, 10);
    return new Date(day).toISOString().slice(0, 10) === day;
  }, 'Date invalide').nullable().optional(),
  client: z.string().max(200).optional(),
  link: z.string().max(2000).refine(v => !v || /^https?:\/\//i.test(v), 'Lien HTTP(S) requis').optional(),
  tags: z.array(z.string().trim().max(100)).max(20).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  notificationChannels: z.array(z.enum(['ntfy', 'email', 'telegram'])).optional(),
  reminderDays: z.array(z.number().int().min(0).max(365)).optional(),
  reminderDatetime: z.string().refine(v => !v || !Number.isNaN(Date.parse(v)), 'Rappel invalide').optional(),
});

export function createTask(userId: string, input: unknown): string {
  const value = taskInputSchema.parse(input);
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO tasks (id,user_id,title,description,due_date,client,link,tags,priority,notification_channels,status,reminder_days,reminder_datetime,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,'pending',?,?,?,?)`).run(
    id, userId, value.title, value.description || null, value.dueDate ?? null, value.client || null, value.link || null,
    JSON.stringify([...new Set(value.tags || [])]), value.priority,
    value.notificationChannels?.length ? JSON.stringify(value.notificationChannels) : null,
    value.dueDate && value.reminderDays ? JSON.stringify(value.reminderDays) : null,
    value.reminderDatetime || null, now, now,
  );
  return id;
}
