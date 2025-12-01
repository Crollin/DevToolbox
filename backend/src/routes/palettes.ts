import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/palettes - Récupérer toutes les palettes
router.get('/', (req, res) => {
  try {
    const palettes = db.prepare('SELECT * FROM color_palettes ORDER BY created_at DESC').all() as {
      id: string;
      name: string;
      description: string | null;
      harmony: string;
      colors: string;
      created_at: string;
      updated_at: string;
    }[];

    const formattedPalettes = palettes.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      harmony: p.harmony,
      colors: JSON.parse(p.colors),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    res.json({ palettes: formattedPalettes });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des palettes' });
  }
});

// POST /api/palettes - Créer une palette
router.post('/', (req, res) => {
  try {
    const { name, description, harmony, colors } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO color_palettes (id, name, description, harmony, colors, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description || '', harmony, JSON.stringify(colors), now, now);

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de la palette' });
  }
});

// PUT /api/palettes/:id - Mettre à jour une palette
router.put('/:id', (req, res) => {
  try {
    const { name, description, harmony, colors } = req.body;
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE color_palettes
      SET name = ?, description = ?, harmony = ?, colors = ?, updated_at = ?
      WHERE id = ?
    `).run(name, description || '', harmony, JSON.stringify(colors), now, req.params.id) as { changes: number };

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Palette non trouvée' });
    }

    res.json({ updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la palette' });
  }
});

// DELETE /api/palettes/:id - Supprimer une palette
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM color_palettes WHERE id = ?').run(req.params.id) as { changes: number };
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Palette non trouvée' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la palette' });
  }
});

export default router;

