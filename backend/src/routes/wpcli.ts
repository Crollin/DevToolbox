import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { validateBody, wpcliCommandSchema } from '../lib/validate';

const router = express.Router();

router.use(authenticateToken);

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value == null || value === '') return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatCommand(c: {
  id: string;
  command: string;
  description: string | null;
  example: string | null;
  options: string | null;
  notes: string | null;
  category: string;
  difficulty: string;
  is_favorite: number;
  tags?: string | null;
  examples?: string | null;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: c.id,
    command: c.command,
    description: c.description,
    example: c.example,
    options: c.options,
    notes: c.notes,
    category: c.category,
    difficulty: c.difficulty,
    tags: parseJsonField<string[]>(c.tags, []),
    examples: parseJsonField<{ title: string; code: string }[]>(c.examples, []),
    isFavorite: Boolean(c.is_favorite),
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

// GET /api/wpcli
router.get('/', (req, res) => {
  try {
    const commands = db.prepare('SELECT * FROM wp_cli_commands ORDER BY created_at DESC').all() as Parameters<typeof formatCommand>[0][];
    const categories = (db.prepare('SELECT name FROM wp_cli_categories ORDER BY name').all() as { name: string }[]).map((c) => c.name);

    res.json({
      commands: commands.map(formatCommand),
      categories,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
  }
});

// POST /api/wpcli
router.post('/', validateBody(wpcliCommandSchema), (req, res) => {
  try {
    const { command, description, example, options, notes, category, difficulty, isFavorite, tags, examples } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    const tagsJson = JSON.stringify(tags || []);
    const examplesJson = JSON.stringify(examples || []);

    db.prepare(`
      INSERT INTO wp_cli_commands (id, command, description, example, options, notes, category, difficulty, is_favorite, tags, examples, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, command, description || '', example || '', options || '', notes || '',
      category, difficulty, isFavorite ? 1 : 0, tagsJson, examplesJson, now, now
    );

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  }
});

// PUT /api/wpcli/:id
router.put('/:id', validateBody(wpcliCommandSchema), (req, res) => {
  try {
    const { command, description, example, options, notes, category, difficulty, isFavorite, tags, examples } = req.body;
    const now = new Date().toISOString();
    const tagsJson = JSON.stringify(tags || []);
    const examplesJson = JSON.stringify(examples || []);

    const result = db.prepare(`
      UPDATE wp_cli_commands
      SET command = ?, description = ?, example = ?, options = ?, notes = ?, category = ?, difficulty = ?, is_favorite = ?, tags = ?, examples = ?, updated_at = ?
      WHERE id = ?
    `).run(
      command, description || '', example || '', options || '', notes || '',
      category, difficulty, isFavorite ? 1 : 0, tagsJson, examplesJson, now, req.params.id
    ) as { changes: number };

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json({ updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la commande' });
  }
});

// DELETE /api/wpcli/:id
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
