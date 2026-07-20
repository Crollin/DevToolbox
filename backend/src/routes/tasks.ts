import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { authenticateTokenOrPersonalAccessToken } from '../middleware/auth';
import { safeJsonParse } from '../lib/json';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateTokenOrPersonalAccessToken('tasks'));

const VALID_STATUS = ['pending', 'in_progress', 'completed'] as const;
const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
const VALID_CHANNELS = ['ntfy', 'email', 'telegram'] as const;
interface TaskRow {
  id: string; title: string; description: string | null; due_date: string; client: string | null; link: string | null;
  tags?: string | null; priority?: string; notification_channels?: string | null; status: string;
  reminder_days: string | null; reminder_datetime: string | null; created_at: string; updated_at: string;
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean))].slice(0, 20);
}

function normalizeChannels(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const channels = [...new Set(value.filter((channel): channel is string => VALID_CHANNELS.includes(channel as typeof VALID_CHANNELS[number])))];
  return channels.length ? channels : undefined;
}

function formatTask(task: TaskRow) {
  return {
    id: task.id, title: task.title, description: task.description || undefined,
    dueDate: task.due_date, client: task.client || undefined, link: task.link || undefined,
    tags: task.tags ? safeJsonParse<string[]>(task.tags, []) : [],
    priority: task.priority && VALID_PRIORITIES.includes(task.priority as typeof VALID_PRIORITIES[number]) ? task.priority : 'normal',
    notificationChannels: task.notification_channels ? safeJsonParse<string[]>(task.notification_channels, []) : [],
    status: task.status, reminderDays: task.reminder_days ? safeJsonParse<number[]>(task.reminder_days, []) : undefined,
    reminderDatetime: task.reminder_datetime || undefined, createdAt: task.created_at, updatedAt: task.updated_at,
  };
}

// GET /api/tasks - Récupérer toutes les tâches de l'utilisateur
router.get('/', (req, res) => {
  try {
    const userId = req.user!.id;
    const { status, client } = req.query;

    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    const params: (string | number)[] = [userId];

    const statusStr = typeof status === 'string' ? status : undefined;
    if (statusStr && (VALID_STATUS as readonly string[]).includes(statusStr)) {
      query += ' AND status = ?';
      params.push(statusStr);
    }

    const clientStr = typeof client === 'string' ? client : undefined;
    if (clientStr && clientStr.length <= 200) {
      query += ' AND client = ?';
      params.push(clientStr);
    }

    query += ' ORDER BY due_date ASC, created_at DESC';

    const tasks = db.prepare(query).all(...params) as Array<{
      id: string;
      user_id: string;
      title: string;
      description: string | null;
      due_date: string;
      client: string | null;
      link: string | null;
      status: string;
      reminder_days: string | null;
      reminder_datetime: string | null;
      created_at: string;
      updated_at: string;
    }>;

    const formattedTasks = tasks.map(formatTask);

    res.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des tâches' });
  }
});

// Clients prédéfinis, propres à chaque utilisateur.
router.get('/clients/list', (req, res) => {
  const clients = db.prepare('SELECT id, name FROM task_clients WHERE user_id = ? ORDER BY name COLLATE NOCASE').all(req.user!.id);
  res.json({ clients });
});

router.post('/clients', (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim().slice(0, 200) : '';
  if (!name) return res.status(400).json({ error: 'Le nom du client est requis' });
  const id = uuidv4();
  const now = new Date().toISOString();
  try {
    db.prepare('INSERT INTO task_clients (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(id, req.user!.id, name, now, now);
    res.status(201).json({ client: { id, name } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) return res.status(409).json({ error: 'Ce client existe déjà' });
    throw error;
  }
});

// GET /api/tasks/:id - Récupérer une tâche spécifique
router.get('/:id', (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, userId) as {
      id: string;
      user_id: string;
      title: string;
      description: string | null;
      due_date: string;
      client: string | null;
      link: string | null;
      status: string;
      reminder_days: string | null;
      reminder_datetime: string | null;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!task) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    const formattedTask = formatTask(task);

    res.json({ task: formattedTask });
  } catch (error) {
    console.error('Erreur lors de la récupération de la tâche:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la tâche' });
  }
});

// POST /api/tasks - Créer une tâche
router.post('/', (req, res) => {
  try {
    const userId = req.user!.id;
    const { title, description, dueDate, client, link, reminderDays, reminderDatetime, tags, priority, notificationChannels } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Titre et date d\'accomplissement sont requis' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tasks (
        id, user_id, title, description, due_date, client, link, 
        tags, priority, notification_channels, status, reminder_days, reminder_datetime, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      title,
      description || null,
      dueDate,
      client || null,
      link || null,
      JSON.stringify(normalizeTags(tags)),
      VALID_PRIORITIES.includes(priority) ? priority : 'normal',
      normalizeChannels(notificationChannels) ? JSON.stringify(normalizeChannels(notificationChannels)) : null,
      'pending',
      reminderDays ? JSON.stringify(reminderDays) : null,
      reminderDatetime || null,
      now,
      now
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as {
      id: string;
      user_id: string;
      title: string;
      description: string | null;
      due_date: string;
      client: string | null;
      link: string | null;
      status: string;
      reminder_days: string | null;
      reminder_datetime: string | null;
      created_at: string;
      updated_at: string;
    };

    const formattedTask = formatTask(task);

    res.status(201).json({ task: formattedTask });
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la tâche' });
  }
});

// PUT /api/tasks/:id - Modifier une tâche
router.put('/:id', (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, description, dueDate, client, link, reminderDays, reminderDatetime, tags, priority, notificationChannels } = req.body;

    // Vérifier que la tâche existe et appartient à l'utilisateur
    const existingTask = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Titre et date d\'accomplissement sont requis' });
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, due_date = ?, client = ?, link = ?,
          tags = ?, priority = ?, notification_channels = ?, reminder_days = ?, reminder_datetime = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      title,
      description || null,
      dueDate,
      client || null,
      link || null,
      JSON.stringify(normalizeTags(tags)),
      VALID_PRIORITIES.includes(priority) ? priority : 'normal',
      normalizeChannels(notificationChannels) ? JSON.stringify(normalizeChannels(notificationChannels)) : null,
      reminderDays ? JSON.stringify(reminderDays) : null,
      reminderDatetime || null,
      now,
      id,
      userId
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as {
      id: string;
      user_id: string;
      title: string;
      description: string | null;
      due_date: string;
      client: string | null;
      link: string | null;
      status: string;
      reminder_days: string | null;
      reminder_datetime: string | null;
      created_at: string;
      updated_at: string;
    };

    const formattedTask = formatTask(task);

    res.json({ task: formattedTask });
  } catch (error) {
    console.error('Erreur lors de la modification de la tâche:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la tâche' });
  }
});

// PATCH /api/tasks/:id/status - Changer le statut d'une tâche
router.patch('/:id/status', (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    // Vérifier que la tâche existe et appartient à l'utilisateur
    const existingTask = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    const now = new Date().toISOString();

    db.prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(
      status,
      now,
      id,
      userId
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as {
      id: string;
      user_id: string;
      title: string;
      description: string | null;
      due_date: string;
      client: string | null;
      link: string | null;
      status: string;
      reminder_days: string | null;
      reminder_datetime: string | null;
      created_at: string;
      updated_at: string;
    };

    const formattedTask = formatTask(task);

    res.json({ task: formattedTask });
  } catch (error) {
    console.error('Erreur lors de la modification du statut:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du statut' });
  }
});

// DELETE /api/tasks/:id - Supprimer une tâche
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Vérifier que la tâche existe et appartient à l'utilisateur
    const existingTask = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, userId);

    res.json({ message: 'Tâche supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la tâche' });
  }
});

export default router;
