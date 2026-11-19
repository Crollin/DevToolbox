import { z } from 'zod';
import type { TaskInput } from './api.js';

const prioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
const channelSchema = z.enum(['ntfy', 'email', 'telegram']);

export const taskFields = {
  title: z.string().min(1).describe('Titre de la tâche'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().describe('Échéance YYYY-MM-DD, null ou omise si inconnue'),
  description: z.string().optional().describe('Description / contexte'),
  client: z.string().optional().describe('Nom du client'),
  link: z.string().optional().describe('URL associée (optionnel)'),
  tags: z.array(z.string()).max(20).optional().describe('Tags'),
  priority: prioritySchema.optional().describe('Priorité (défaut: normal)'),
  notificationChannels: z.array(channelSchema).optional().describe('Canaux de notification'),
  reminderDays: z.array(z.number().int().min(0).max(30)).optional().describe('Rappels N jours avant'),
  reminderDatetime: z.string().optional().describe('Rappel précis ISO 8601'),
};

export function toTaskInput(
  args: z.infer<z.ZodObject<typeof taskFields>>
): TaskInput {
  return {
    title: args.title,
    dueDate: args.dueDate,
    description: args.description,
    client: args.client,
    link: args.link,
    tags: args.tags,
    priority: args.priority,
    notificationChannels: args.notificationChannels,
    reminderDays: args.reminderDays,
    reminderDatetime: args.reminderDatetime,
  };
}
