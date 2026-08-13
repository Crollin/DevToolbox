#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  createClient,
  createTask,
  deleteTask,
  getTask,
  listClients,
  listTasks,
  setTaskStatus,
  taskSummary,
  updateTask,
  type TaskInput,
} from './api.js';

const statusSchema = z.enum(['pending', 'in_progress', 'completed']);
const prioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
const channelSchema = z.enum(['ntfy', 'email', 'telegram']);

const taskFields = {
  title: z.string().min(1).describe('Titre de la tâche'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Échéance YYYY-MM-DD'),
  description: z.string().optional().describe('Description / contexte'),
  client: z.string().optional().describe('Nom du client'),
  link: z.string().optional().describe('URL associée (optionnel)'),
  tags: z.array(z.string()).max(20).optional().describe('Tags'),
  priority: prioritySchema.optional().describe('Priorité (défaut: normal)'),
  notificationChannels: z.array(channelSchema).optional().describe('Canaux de notification'),
  reminderDays: z.array(z.number().int().min(0).max(30)).optional().describe('Rappels N jours avant'),
  reminderDatetime: z.string().optional().describe('Rappel précis ISO 8601'),
};

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function fail(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: 'text' as const, text: `Erreur : ${message}` }], isError: true };
}

function toTaskInput(args: z.infer<z.ZodObject<typeof taskFields>>): TaskInput {
  const link = args.link === '' ? undefined : args.link;
  return {
    title: args.title,
    dueDate: args.dueDate,
    description: args.description,
    client: args.client,
    link,
    tags: args.tags,
    priority: args.priority,
    notificationChannels: args.notificationChannels,
    reminderDays: args.reminderDays,
    reminderDatetime: args.reminderDatetime,
  };
}

const server = new McpServer({
  name: 'devtoolbox-task-reminder',
  version: '1.0.0',
});

server.tool(
  'list_tasks',
  'Liste les tâches Task Reminder. Filtre optionnel par statut ou client.',
  {
    status: statusSchema.optional().describe('Filtrer par statut'),
    client: z.string().optional().describe('Filtrer par nom de client'),
  },
  async ({ status, client }) => {
    try {
      const tasks = await listTasks({ status, client });
      if (tasks.length === 0) {
        return ok('Aucune tâche trouvée.');
      }
      return ok(`${tasks.length} tâche(s) :\n\n${tasks.map(taskSummary).join('\n\n')}`);
    } catch (error) {
      return fail(error);
    }
  }
);

server.tool(
  'get_task',
  'Récupère le détail d’une tâche par id.',
  {
    id: z.string().uuid().describe('Identifiant UUID de la tâche'),
  },
  async ({ id }) => {
    try {
      const task = await getTask(id);
      return ok(taskSummary(task));
    } catch (error) {
      return fail(error);
    }
  }
);

server.tool(
  'create_task',
  'Crée une tâche. title et dueDate (YYYY-MM-DD) sont obligatoires.',
  taskFields,
  async (args) => {
    try {
      const task = await createTask(toTaskInput(args));
      return ok(`Tâche créée.\n\n${taskSummary(task)}`);
    } catch (error) {
      return fail(error);
    }
  }
);

server.tool(
  'update_task',
  'Met à jour une tâche (PUT). title et dueDate restent obligatoires.',
  {
    id: z.string().uuid().describe('Identifiant UUID de la tâche'),
    ...taskFields,
  },
  async ({ id, ...fields }) => {
    try {
      const task = await updateTask(id, toTaskInput(fields));
      return ok(`Tâche mise à jour.\n\n${taskSummary(task)}`);
    } catch (error) {
      return fail(error);
    }
  }
);

server.tool(
  'set_task_status',
  'Change uniquement le statut d’une tâche (pending | in_progress | completed).',
  {
    id: z.string().uuid().describe('Identifiant UUID de la tâche'),
    status: statusSchema.describe('Nouveau statut'),
  },
  async ({ id, status }) => {
    try {
      const task = await setTaskStatus(id, status);
      return ok(`Statut mis à jour.\n\n${taskSummary(task)}`);
    } catch (error) {
      return fail(error);
    }
  }
);

server.tool(
  'delete_task',
  'Supprime une tâche de façon définitive.',
  {
    id: z.string().uuid().describe('Identifiant UUID de la tâche'),
  },
  async ({ id }) => {
    try {
      const message = await deleteTask(id);
      return ok(message);
    } catch (error) {
      return fail(error);
    }
  }
);

server.tool(
  'list_clients',
  'Liste les clients prédéfinis Task Reminder (à réutiliser pour le champ client).',
  {},
  async () => {
    try {
      const clients = await listClients();
      if (clients.length === 0) {
        return ok('Aucun client prédéfini.');
      }
      return ok(
        clients.map((c) => `• ${c.name} (id: ${c.id}${c.color ? `, couleur: ${c.color}` : ''})`).join('\n')
      );
    } catch (error) {
      return fail(error);
    }
  }
);

server.tool(
  'create_client',
  'Ajoute un client prédéfini Task Reminder.',
  {
    name: z.string().min(1).max(200).describe('Nom du client'),
  },
  async ({ name }) => {
    try {
      const client = await createClient(name);
      return ok(`Client créé : ${client.name} (id: ${client.id})`);
    } catch (error) {
      return fail(error);
    }
  }
);

async function main() {
  // Fail fast if config missing (message goes to stderr, not stdio MCP stream)
  if (!process.env.DEVTOOLBOX_PAT?.trim()) {
    console.error('DEVTOOLBOX_PAT manquant. Définissez-le dans la config MCP.');
    process.exit(1);
  }
  if (!process.env.DEVTOOLBOX_API_URL?.trim()) {
    console.error('DEVTOOLBOX_API_URL manquant. Ex. https://devtoolbox.creactiveweb.com/api');
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
