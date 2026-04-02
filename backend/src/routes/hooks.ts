import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /api/hooks - Récupérer tous les hooks
router.get('/', (req, res) => {
  try {
    const hooks = db.prepare('SELECT * FROM wp_hooks ORDER BY created_at DESC').all() as {
      id: string;
      name: string;
      type: string;
      description: string | null;
      category: string;
      tags: string | null;
      example: string | null;
      parameters: string | null;
      since: string | null;
      deprecated: string | null;
      is_favorite: number;
      created_at: string;
      updated_at: string;
    }[];
    const categories = (db.prepare('SELECT name FROM wp_hook_categories ORDER BY name').all() as { name: string }[]).map((c) => c.name);

    const formattedHooks = hooks.map((h) => ({
      id: h.id,
      name: h.name,
      type: h.type,
      description: h.description,
      category: h.category,
      tags: h.tags ? JSON.parse(h.tags) : [],
      example: h.example,
      parameters: h.parameters,
      since: h.since,
      deprecated: h.deprecated,
      isFavorite: Boolean(h.is_favorite),
      createdAt: h.created_at,
      updatedAt: h.updated_at,
    }));

    res.json({ hooks: formattedHooks, categories });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des hooks' });
  }
});

// POST /api/hooks - Créer un hook
router.post('/', (req, res) => {
  try {
    const { name, type, description, category, tags, example, parameters, since, deprecated, isFavorite } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO wp_hooks (id, name, type, description, category, tags, example, parameters, since, deprecated, is_favorite, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, type, description || '', category, JSON.stringify(tags || []),
      example || '', parameters || '', since || '', deprecated || null,
      isFavorite ? 1 : 0, now, now
    );

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du hook' });
  }
});

// PUT /api/hooks/:id - Mettre à jour un hook
router.put('/:id', (req, res) => {
  try {
    const { name, type, description, category, tags, example, parameters, since, deprecated, isFavorite } = req.body;
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE wp_hooks
      SET name = ?, type = ?, description = ?, category = ?, tags = ?, example = ?, parameters = ?, since = ?, deprecated = ?, is_favorite = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name, type, description || '', category, JSON.stringify(tags || []),
      example || '', parameters || '', since || '', deprecated || null,
      isFavorite ? 1 : 0, now, req.params.id
    ) as { changes: number };

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Hook non trouvé' });
    }

    res.json({ updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du hook' });
  }
});

// DELETE /api/hooks/:id - Supprimer un hook
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM wp_hooks WHERE id = ?').run(req.params.id) as { changes: number };
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Hook non trouvé' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du hook' });
  }
});

// POST /api/hooks/categories - Ajouter une catégorie
router.post('/categories', (req, res) => {
  try {
    const { name } = req.body;
    const now = new Date().toISOString();

    db.prepare('INSERT OR IGNORE INTO wp_hook_categories (name, created_at) VALUES (?, ?)').run(name, now);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la catégorie' });
  }
});

export default router;

