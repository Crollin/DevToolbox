import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/wpcli - Récupérer toutes les commandes
router.get('/', (req, res) => {
  try {
    const commands = db.prepare('SELECT * FROM wp_cli_commands ORDER BY created_at DESC').all() as {
      id: string;
      command: string;
      description: string | null;
      example: string | null;
      options: string | null;
      notes: string | null;
      category: string;
      difficulty: string;
      is_favorite: number;
      created_at: string;
      updated_at: string;
    }[];
    const categories = (db.prepare('SELECT name FROM wp_cli_categories ORDER BY name').all() as { name: string }[]).map((c) => c.name);

    const formattedCommands = commands.map((c) => ({
      id: c.id,
      command: c.command,
      description: c.description,
      example: c.example,
      options: c.options,
      notes: c.notes,
      category: c.category,
      difficulty: c.difficulty,
      isFavorite: Boolean(c.is_favorite),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    res.json({ commands: formattedCommands, categories });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
  }
});

// POST /api/wpcli - Créer une commande
router.post('/', (req, res) => {
  try {
    const { command, description, example, options, notes, category, difficulty, isFavorite } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO wp_cli_commands (id, command, description, example, options, notes, category, difficulty, is_favorite, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, command, description || '', example || '', options || '', notes || '',
      category, difficulty, isFavorite ? 1 : 0, now, now
    );

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  }
});

// PUT /api/wpcli/:id - Mettre à jour une commande
router.put('/:id', (req, res) => {
  try {
    const { command, description, example, options, notes, category, difficulty, isFavorite } = req.body;
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE wp_cli_commands
      SET command = ?, description = ?, example = ?, options = ?, notes = ?, category = ?, difficulty = ?, is_favorite = ?, updated_at = ?
      WHERE id = ?
    `).run(
      command, description || '', example || '', options || '', notes || '',
      category, difficulty, isFavorite ? 1 : 0, now, req.params.id
    ) as { changes: number };

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json({ updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la commande' });
  }
});

// DELETE /api/wpcli/:id - Supprimer une commande
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM wp_cli_commands WHERE id = ?').run(req.params.id) as { changes: number };
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la commande' });
  }
});

export default router;

