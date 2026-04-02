import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateBody, toolOrderSchema } from '../lib/validate';
import db from '../db/database';

const router = Router();

// GET /api/tools/order - Récupérer l'ordre personnalisé de l'utilisateur connecté
router.get('/order', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Récupérer l'ordre personnalisé
    const orderRows = db.prepare(`
      SELECT tool_id, position
      FROM tool_order
      WHERE user_id = ?
      ORDER BY position ASC
    `).all(userId) as Array<{ tool_id: string; position: number }>;

    // Convertir en tableau d'IDs dans l'ordre
    const toolIds = orderRows.map((row) => row.tool_id);

    res.json({ toolIds });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ordre des outils:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'ordre des outils' });
  }
});

// PUT /api/tools/order - Sauvegarder l'ordre personnalisé
router.put('/order', authenticateToken, validateBody(toolOrderSchema), (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { toolIds } = req.body;

    // Vérifier que la table existe
    try {
      const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tool_order'").get();
      if (!tableInfo) {
        return res.status(500).json({ error: 'La table tool_order n\'existe pas. Veuillez redémarrer le serveur.' });
      }
    } catch {
      return res.status(500).json({ error: 'Erreur lors de la vérification de la base de données' });
    }

    // Transaction pour garantir la cohérence
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM tool_order WHERE user_id = ?').run(userId);

      // Insérer le nouvel ordre
      const now = new Date().toISOString();
      const insertStmt = db.prepare(`
        INSERT INTO tool_order (user_id, tool_id, position, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      toolIds.forEach((toolId: string, index: number) => {
        insertStmt.run(userId, toolId, index, now, now);
      });
    });

    transaction();

    res.json({ success: true, message: 'Ordre des outils sauvegardé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'ordre des outils:', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde de l\'ordre des outils' });
  }
});

export default router;

