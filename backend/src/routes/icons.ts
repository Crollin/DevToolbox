import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/icons - Récupérer toutes les icônes
router.get('/', (req, res) => {
  try {
    const icons = db.prepare('SELECT * FROM svg_icons ORDER BY created_at DESC').all();

    const formattedIcons = icons.map((i: {
      id: string;
      name: string;
      svg: string;
      tags: string | null;
      category: string | null;
      is_favorite: number;
      created_at: string;
      updated_at: string;
    }) => ({
      id: i.id,
      name: i.name,
      svg: i.svg,
      tags: i.tags ? JSON.parse(i.tags) : [],
      category: i.category,
      isFavorite: Boolean(i.is_favorite),
      createdAt: i.created_at,
      updatedAt: i.updated_at,
    }));

    res.json({ icons: formattedIcons });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des icônes' });
  }
});

// POST /api/icons - Créer une icône
router.post('/', (req, res) => {
  try {
    const { name, svg, tags, category, isFavorite } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO svg_icons (id, name, svg, tags, category, is_favorite, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, svg, JSON.stringify(tags || []), category || null,
      isFavorite ? 1 : 0, now, now
    );

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de l\'icône' });
  }
});

// PUT /api/icons/:id - Mettre à jour une icône
router.put('/:id', (req, res) => {
  try {
    const { name, svg, tags, category, isFavorite } = req.body;
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE svg_icons
      SET name = ?, svg = ?, tags = ?, category = ?, is_favorite = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name, svg, JSON.stringify(tags || []), category || null,
      isFavorite ? 1 : 0, now, req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Icône non trouvée' });
    }

    res.json({ updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'icône' });
  }
});

// DELETE /api/icons/:id - Supprimer une icône
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM svg_icons WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Icône non trouvée' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'icône' });
  }
});

export default router;

