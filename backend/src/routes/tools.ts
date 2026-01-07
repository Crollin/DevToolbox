import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
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
router.put('/order', authenticateToken, (req: Request, res: Response) => {
  try {
    console.log('[PUT /tools/order] Requête reçue');
    console.log('[PUT /tools/order] Headers:', req.headers);
    console.log('[PUT /tools/order] Body:', req.body);
    console.log('[PUT /tools/order] User:', req.user);
    
    const userId = req.user!.id;
    const { toolIds } = req.body;

    console.log('[PUT /tools/order] Sauvegarde de l\'ordre des outils pour l\'utilisateur:', userId);
    console.log('[PUT /tools/order] toolIds reçus:', toolIds);
    console.log('[PUT /tools/order] Type de toolIds:', typeof toolIds, Array.isArray(toolIds));

    // Validation
    if (!Array.isArray(toolIds)) {
      console.error('toolIds n\'est pas un tableau:', typeof toolIds);
      return res.status(400).json({ error: 'toolIds doit être un tableau' });
    }

    if (toolIds.length === 0) {
      console.warn('Tableau toolIds vide');
      return res.status(400).json({ error: 'toolIds ne peut pas être vide' });
    }

    // Vérifier que la table existe
    try {
      const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tool_order'").get();
      if (!tableInfo) {
        console.error('La table tool_order n\'existe pas');
        return res.status(500).json({ error: 'La table tool_order n\'existe pas. Veuillez redémarrer le serveur.' });
      }
    } catch (tableError) {
      console.error('Erreur lors de la vérification de la table:', tableError);
      return res.status(500).json({ error: 'Erreur lors de la vérification de la base de données' });
    }

    // Transaction pour garantir la cohérence
    const transaction = db.transaction(() => {
      // Supprimer l'ancien ordre pour cet utilisateur
      const deleteResult = db.prepare('DELETE FROM tool_order WHERE user_id = ?').run(userId);
      console.log(`Ancien ordre supprimé: ${deleteResult.changes} entrées`);

      // Insérer le nouvel ordre
      const now = new Date().toISOString();
      const insertStmt = db.prepare(`
        INSERT INTO tool_order (user_id, tool_id, position, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      toolIds.forEach((toolId: string, index: number) => {
        try {
          insertStmt.run(userId, toolId, index, now, now);
        } catch (insertError) {
          console.error(`Erreur lors de l'insertion de l'outil ${toolId} à la position ${index}:`, insertError);
          throw insertError;
        }
      });
    });

    transaction();
    console.log('Ordre sauvegardé avec succès');

    res.json({ success: true, message: 'Ordre des outils sauvegardé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'ordre des outils:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    res.status(500).json({ 
      error: 'Erreur lors de la sauvegarde de l\'ordre des outils',
      details: errorMessage 
    });
  }
});

export default router;

