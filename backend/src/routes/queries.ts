import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/queries - Récupérer toutes les queries
router.get('/', (req, res) => {
  try {
    const queries = db.prepare('SELECT * FROM wp_queries ORDER BY created_at DESC').all() as {
      id: string;
      name: string;
      description: string | null;
      config: string;
      created_at: string;
      updated_at: string;
    }[];

    const formattedQueries = queries.map((q) => ({
      id: q.id,
      name: q.name,
      description: q.description,
      config: JSON.parse(q.config),
      createdAt: q.created_at,
      updatedAt: q.updated_at,
    }));

    res.json({ savedQueries: formattedQueries });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des queries' });
  }
});

// POST /api/queries - Créer une query
router.post('/', (req, res) => {
  try {
    const { name, description, config } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO wp_queries (id, name, description, config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, description || null, JSON.stringify(config), now, now);

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de la query' });
  }
});

// PUT /api/queries/:id - Mettre à jour une query
router.put('/:id', (req, res) => {
  try {
    const { name, description, config } = req.body;
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE wp_queries
      SET name = ?, description = ?, config = ?, updated_at = ?
      WHERE id = ?
    `).run(name, description || null, JSON.stringify(config), now, req.params.id) as { changes: number };

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Query non trouvée' });
    }

    res.json({ updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la query' });
  }
});

// DELETE /api/queries/:id - Supprimer une query
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM wp_queries WHERE id = ?').run(req.params.id) as { changes: number };
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Query non trouvée' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la query' });
  }
});

export default router;

