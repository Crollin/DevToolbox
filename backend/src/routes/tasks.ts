import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { authenticateTokenOrPersonalAccessToken } from '../middleware/auth';
import { safeJsonParse } from '../lib/json';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateTokenOrPersonalAccessToken('tasks'));

const VALID_STATUS = ['pending', 'in_progress', 'completed'] as const;

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

    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      dueDate: task.due_date,
      client: task.client || undefined,
      link: task.link || undefined,
      status: task.status as 'pending' | 'in_progress' | 'completed',
      reminderDays: task.reminder_days ? safeJsonParse<number[]>(task.reminder_days, []) : undefined,
      reminderDatetime: task.reminder_datetime || undefined,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    }));

    res.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des tâches' });
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

    const formattedTask = {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      dueDate: task.due_date,
      client: task.client || undefined,
      link: task.link || undefined,
      status: task.status as 'pending' | 'in_progress' | 'completed',
      reminderDays: task.reminder_days ? safeJsonParse<number[]>(task.reminder_days, []) : undefined,
      reminderDatetime: task.reminder_datetime || undefined,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };

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
    const { title, description, dueDate, client, link, reminderDays, reminderDatetime } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Titre et date d\'accomplissement sont requis' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tasks (
        id, user_id, title, description, due_date, client, link, 
        status, reminder_days, reminder_datetime, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      title,
      description || null,
      dueDate,
      client || null,
      link || null,
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

    const formattedTask = {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      dueDate: task.due_date,
      client: task.client || undefined,
      link: task.link || undefined,
      status: task.status as 'pending' | 'in_progress' | 'completed',
      reminderDays: task.reminder_days ? safeJsonParse<number[]>(task.reminder_days, []) : undefined,
      reminderDatetime: task.reminder_datetime || undefined,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };

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
    const { title, description, dueDate, client, link, reminderDays, reminderDatetime } = req.body;

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
          reminder_days = ?, reminder_datetime = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      title,
      description || null,
      dueDate,
      client || null,
      link || null,
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

    const formattedTask = {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      dueDate: task.due_date,
      client: task.client || undefined,
      link: task.link || undefined,
      status: task.status as 'pending' | 'in_progress' | 'completed',
      reminderDays: task.reminder_days ? safeJsonParse<number[]>(task.reminder_days, []) : undefined,
      reminderDatetime: task.reminder_datetime || undefined,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };

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

    const formattedTask = {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      dueDate: task.due_date,
      client: task.client || undefined,
      link: task.link || undefined,
      status: task.status as 'pending' | 'in_progress' | 'completed',
      reminderDays: task.reminder_days ? safeJsonParse<number[]>(task.reminder_days, []) : undefined,
      reminderDatetime: task.reminder_datetime || undefined,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };

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
