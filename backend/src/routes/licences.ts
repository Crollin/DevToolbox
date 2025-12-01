import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/licences - Récupérer toutes les licences
router.get('/', (req, res) => {
  try {
    const licences = db.prepare('SELECT * FROM licences ORDER BY created_at DESC').all();

    const formattedLicences = licences.map((l: {
      id: string;
      name: string;
      key: string;
      type: string;
      status: string;
      expires_at: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }) => ({
      id: l.id,
      name: l.name,
      key: l.key,
      type: l.type,
      status: l.status,
      expiresAt: l.expires_at,
      notes: l.notes,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    }));

    res.json({ licences: formattedLicences });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des licences' });
  }
});

// POST /api/licences - Créer une licence
router.post('/', (req, res) => {
  try {
    const { name, key, type, status, expiresAt, notes } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO licences (id, name, key, type, status, expires_at, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, key, type, status, expiresAt || null, notes || null, now, now
    );

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de la licence' });
  }
});

// PUT /api/licences/:id - Mettre à jour une licence
router.put('/:id', (req, res) => {
  try {
    const { name, key, type, status, expiresAt, notes } = req.body;
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE licences
      SET name = ?, key = ?, type = ?, status = ?, expires_at = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name, key, type, status, expiresAt || null, notes || null, now, req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Licence non trouvée' });
    }

    res.json({ updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la licence' });
  }
});

// DELETE /api/licences/:id - Supprimer une licence
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM licences WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Licence non trouvée' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la licence' });
  }
});

export default router;

