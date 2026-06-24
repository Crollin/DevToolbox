import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { safeJsonParse } from '../lib/json';
import { validateBody, snippetCreateSchema, snippetUpdateSchema } from '../lib/validate';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// POST /api/snippets/init - Initialiser les snippets par défaut
router.post('/init', (req, res) => {
  try {
    const { snippets } = req.body;
    
    if (!Array.isArray(snippets) || snippets.length === 0) {
      return res.status(400).json({ error: 'Aucun snippet fourni' });
    }

    const now = new Date().toISOString();
    const insertSnippet = db.prepare(`
      INSERT OR IGNORE INTO code_snippets 
      (id, title, description, code, language, scope, priority, tags, folder, is_favorite, wp_code_box_id, cloud_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    for (const snippet of snippets) {
      try {
        insertSnippet.run(
          snippet.id,
          snippet.title,
          snippet.description || '',
          snippet.code,
          snippet.language,
          snippet.scope,
          snippet.priority || 10,
          JSON.stringify(snippet.tags || []),
          snippet.folder || null,
          snippet.isFavorite ? 1 : 0,
          snippet.wpCodeBoxId || null,
          snippet.cloudId || null,
          snippet.createdAt || now,
          snippet.updatedAt || now
        );
        inserted++;
      } catch (err) {
        // Ignorer les erreurs de duplication (INSERT OR IGNORE)
        console.warn(`Snippet ${snippet.id} déjà présent ou erreur:`, err);
      }
    }

    res.json({ success: true, inserted, total: snippets.length });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des snippets:', error);
    res.status(500).json({ error: 'Erreur lors de l\'initialisation des snippets' });
  }
});

// GET /api/snippets - Récupérer tous les snippets
router.get('/', (req, res) => {
  try {
    const snippets = db.prepare('SELECT * FROM code_snippets ORDER BY created_at DESC').all() as {
      id: string;
      title: string;
      description: string | null;
      code: string;
      language: string;
      scope: string;
      priority: number;
      tags: string | null;
      folder: string | null;
      is_favorite: number;
      wp_code_box_id: number | null;
      cloud_id: string | null;
      created_at: string;
      updated_at: string;
    }[];
    const folders = (db.prepare('SELECT name FROM snippet_folders ORDER BY name').all() as { name: string }[]).map((f) => f.name);
    const customTags = (db.prepare('SELECT tag FROM snippet_custom_tags ORDER BY tag').all() as { tag: string }[]).map((t) => t.tag);

    // Convertir les données
    const formattedSnippets = snippets.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      code: s.code,
      language: s.language,
      scope: s.scope,
      priority: s.priority,
      tags: safeJsonParse<string[]>(s.tags, []),
      folder: s.folder,
      isFavorite: Boolean(s.is_favorite),
      wpCodeBoxId: s.wp_code_box_id,
      cloudId: s.cloud_id,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    res.json({
      snippets: formattedSnippets,
      folders,
      customTags,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des snippets' });
  }
});

// GET /api/snippets/:id - Récupérer un snippet
router.get('/:id', (req, res) => {
  try {
    const snippet = db.prepare('SELECT * FROM code_snippets WHERE id = ?').get(req.params.id) as {
      id: string;
      title: string;
      description: string | null;
      code: string;
      language: string;
      scope: string;
      priority: number;
      tags: string | null;
      folder: string | null;
      is_favorite: number;
      wp_code_box_id: number | null;
      cloud_id: string | null;
      created_at: string;
      updated_at: string;
    } | undefined;
    if (!snippet) {
      return res.status(404).json({ error: 'Snippet non trouvé' });
    }

    res.json({
      id: snippet.id,
      title: snippet.title,
      description: snippet.description,
      code: snippet.code,
      language: snippet.language,
      scope: snippet.scope,
      priority: snippet.priority,
      tags: safeJsonParse<string[]>(snippet.tags, []),
      folder: snippet.folder,
      isFavorite: Boolean(snippet.is_favorite),
      wpCodeBoxId: snippet.wp_code_box_id,
      cloudId: snippet.cloud_id,
      createdAt: snippet.created_at,
      updatedAt: snippet.updated_at,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du snippet' });
  }
});

// POST /api/snippets - Créer un snippet
router.post('/', validateBody(snippetCreateSchema), (req, res) => {
  try {
    const { title, description, code, language, scope, priority, tags, folder, isFavorite, wpCodeBoxId, cloudId } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO code_snippets (id, title, description, code, language, scope, priority, tags, folder, is_favorite, wp_code_box_id, cloud_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, title, description || '', code, language, scope, priority || 10,
      JSON.stringify(tags || []), folder || null, isFavorite ? 1 : 0,
      wpCodeBoxId || null, cloudId || null, now, now
    );

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du snippet' });
  }
});

// PUT /api/snippets/:id - Mettre à jour un snippet
router.put('/:id', validateBody(snippetUpdateSchema), (req, res) => {
  try {
    const { title, description, code, language, scope, priority, tags, folder, isFavorite } = req.body;
    const now = new Date().toISOString();

    // Récupérer le snippet actuel
    const current = db.prepare('SELECT * FROM code_snippets WHERE id = ?').get(req.params.id) as {
      title: string;
      description: string | null;
      code: string;
      language: string;
      scope: string;
      priority: number;
      tags: string | null;
      folder: string | null;
      is_favorite: number;
    } | undefined;

    if (!current) {
      return res.status(404).json({ error: 'Snippet non trouvé' });
    }

    // Utiliser les valeurs fournies ou conserver les valeurs actuelles pour une mise à jour partielle
    const updateTitle = title !== undefined ? title : current.title;
    const updateDescription = description !== undefined ? description : (current.description || '');
    const updateCode = code !== undefined ? code : current.code;
    const updateLanguage = language !== undefined ? language : current.language;
    const updateScope = scope !== undefined ? scope : current.scope;
    const updatePriority = priority !== undefined ? (priority || 10) : current.priority;
    const updateTags = tags !== undefined ? JSON.stringify(tags || []) : (current.tags || '[]');
    const updateFolder = folder !== undefined ? (folder || null) : current.folder;
    const updateFavorite = isFavorite !== undefined ? (isFavorite ? 1 : 0) : current.is_favorite;

    const result = db.prepare(`
      UPDATE code_snippets
      SET title = ?, description = ?, code = ?, language = ?, scope = ?, priority = ?, tags = ?, folder = ?, is_favorite = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updateTitle, updateDescription, updateCode, updateLanguage, updateScope, updatePriority,
      updateTags, updateFolder, updateFavorite, now, req.params.id
    ) as { changes: number };

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Snippet non trouvé' });
    }

    res.json({ updatedAt: now });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du snippet:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du snippet' });
  }
});

// DELETE /api/snippets/:id - Supprimer un snippet
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM code_snippets WHERE id = ?').run(req.params.id) as { changes: number };
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Snippet non trouvé' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du snippet' });
  }
});

// POST /api/snippets/folders - Ajouter un dossier
router.post('/folders', (req, res) => {
  try {
    const { name } = req.body;
    const now = new Date().toISOString();

    db.prepare('INSERT OR IGNORE INTO snippet_folders (name, created_at) VALUES (?, ?)').run(name, now);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout du dossier' });
  }
});

// POST /api/snippets/tags - Ajouter un tag personnalisé
router.post('/tags', (req, res) => {
  try {
    const { tag } = req.body;
    const now = new Date().toISOString();

    db.prepare('INSERT OR IGNORE INTO snippet_custom_tags (tag, created_at) VALUES (?, ?)').run(tag, now);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout du tag' });
  }
});

export default router;

