import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { validateBody, commandSchema } from '../lib/validate';
import { safeJsonParse } from '../lib/json';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /api/docker - Récupérer toutes les commandes
router.get('/', (req, res) => {
  try {
    const commands = db.prepare('SELECT * FROM docker_commands ORDER BY created_at DESC').all() as {
      id: string;
      name: string;
      command: string;
      description: string | null;
      category: string;
      tags: string | null;
      is_favorite: number;
      created_at: string;
      updated_at: string;
    }[];
    const categories = (db.prepare('SELECT name FROM docker_categories ORDER BY name').all() as { name: string }[]).map((c) => c.name);

    const formattedCommands = commands.map((c) => ({
      id: c.id,
      name: c.name,
      command: c.command,
      description: c.description,
      category: c.category,
      tags: safeJsonParse<string[]>(c.tags, []),
      isFavorite: Boolean(c.is_favorite),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    res.json({ commands: formattedCommands, categories });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
  }
});

// POST /api/docker - Créer une commande
router.post('/', validateBody(commandSchema), (req, res) => {
  try {
    const { name, command, description, category, tags, isFavorite } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO docker_commands (id, name, command, description, category, tags, is_favorite, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, command, description || '', category, JSON.stringify(tags || []),
      isFavorite ? 1 : 0, now, now
    );

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  }
});

// PUT /api/docker/:id - Mettre à jour une commande
router.put('/:id', validateBody(commandSchema), (req, res) => {
  try {
    const { name, command, description, category, tags, isFavorite } = req.body;
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE docker_commands
      SET name = ?, command = ?, description = ?, category = ?, tags = ?, is_favorite = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name, command, description || '', category, JSON.stringify(tags || []),
      isFavorite ? 1 : 0, now, req.params.id
    ) as { changes: number };

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json({ updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la commande' });
  }
});

// DELETE /api/docker/:id - Supprimer une commande
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM docker_commands WHERE id = ?').run(req.params.id) as { changes: number };
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la commande' });
  }
});

export default router;

