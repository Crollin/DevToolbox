import express from 'express';
import db from '../db/database';

const router = express.Router();

// GET /api/electricalc/settings - Récupérer les paramètres
router.get('/settings', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM electricalc_settings ORDER BY updated_at DESC LIMIT 1').get();
    if (!row) {
      return res.json({ settings: null });
    }
    res.json({ settings: JSON.parse(row.settings) });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres' });
  }
});

// PUT /api/electricalc/settings - Mettre à jour les paramètres
router.put('/settings', (req, res) => {
  try {
    const { settings } = req.body;
    const now = new Date().toISOString();

    const existing = db.prepare('SELECT id FROM electricalc_settings LIMIT 1').get();
    
    if (existing) {
      db.prepare('UPDATE electricalc_settings SET settings = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify(settings), now, existing.id);
    } else {
      db.prepare('INSERT INTO electricalc_settings (settings, updated_at) VALUES (?, ?)')
        .run(JSON.stringify(settings), now);
    }

    res.json({ updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres' });
  }
});

// GET /api/electricalc/history - Récupérer l'historique
router.get('/history', (req, res) => {
  try {
    const history = db.prepare('SELECT * FROM electricalc_history ORDER BY created_at DESC LIMIT 50').all();
    const formattedHistory = history.map((h: {
      id: number;
      calculation: string;
      created_at: string;
    }) => ({
      id: h.id,
      calculation: JSON.parse(h.calculation),
      createdAt: h.created_at,
    }));
    res.json({ history: formattedHistory });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
});

// POST /api/electricalc/history - Ajouter un calcul à l'historique
router.post('/history', (req, res) => {
  try {
    const { calculation } = req.body;
    const now = new Date().toISOString();

    db.prepare('INSERT INTO electricalc_history (calculation, created_at) VALUES (?, ?)')
      .run(JSON.stringify(calculation), now);

    // Limiter à 50 entrées
    db.prepare(`
      DELETE FROM electricalc_history
      WHERE id NOT IN (
        SELECT id FROM electricalc_history ORDER BY created_at DESC LIMIT 50
      )
    `).run();

    res.status(201).json({ createdAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout du calcul' });
  }
});

export default router;

