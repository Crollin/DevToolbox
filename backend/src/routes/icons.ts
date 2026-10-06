import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { safeJsonParse } from '../lib/json';
import { assertValidSvg, SvgValidationError } from '../lib/svgValidation';

const router = express.Router();

function assertValidName(name: unknown): string {
  if (typeof name !== 'string' || !name.trim()) {
    throw new SvgValidationError('Nom requis');
  }
  const trimmed = name.trim();
  if (trimmed.length > 200) {
    throw new SvgValidationError('Nom trop long (max 200 caractères)');
  }
  return trimmed;
}

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /api/icons - Récupérer toutes les icônes
router.get('/', (req, res) => {
  try {
    const icons = db.prepare('SELECT * FROM svg_icons ORDER BY created_at DESC').all() as {
      id: string;
      name: string;
      svg: string;
      tags: string | null;
      category: string | null;
      is_favorite: number;
      created_at: string;
      updated_at: string;
    }[];

    const formattedIcons = icons.map((i) => ({
      id: i.id,
      name: i.name,
      svg: i.svg,
      tags: safeJsonParse<string[]>(i.tags, []),
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
    const safeName = assertValidName(name);
    const safeSvg = assertValidSvg(svg);
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO svg_icons (id, name, svg, tags, category, is_favorite, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, safeName, safeSvg, JSON.stringify(tags || []), category || null,
      isFavorite ? 1 : 0, now, now
    );

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    if (error instanceof SvgValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors de la création de l\'icône' });
  }
});

// PUT /api/icons/:id - Mettre à jour une icône
router.put('/:id', (req, res) => {
  try {
    const { name, svg, tags, category, isFavorite } = req.body;
    const safeName = assertValidName(name);
    const safeSvg = assertValidSvg(svg);
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE svg_icons
      SET name = ?, svg = ?, tags = ?, category = ?, is_favorite = ?, updated_at = ?
      WHERE id = ?
    `).run(
      safeName, safeSvg, JSON.stringify(tags || []), category || null,
      isFavorite ? 1 : 0, now, req.params.id
    ) as { changes: number };

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Icône non trouvée' });
    }

    res.json({ updatedAt: now });
  } catch (error) {
    if (error instanceof SvgValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'icône' });
  }
});

// DELETE /api/icons/:id - Supprimer une icône
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM svg_icons WHERE id = ?').run(req.params.id) as { changes: number };
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Icône non trouvée' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'icône' });
  }
});

export default router;
