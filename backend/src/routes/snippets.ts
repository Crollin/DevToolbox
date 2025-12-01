import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

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
      active: number;
      run_once: number;
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
      tags: s.tags ? JSON.parse(s.tags) : [],
      folder: s.folder,
      active: Boolean(s.active),
      runOnce: Boolean(s.run_once),
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
      active: number;
      run_once: number;
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
      tags: snippet.tags ? JSON.parse(snippet.tags) : [],
      folder: snippet.folder,
      active: Boolean(snippet.active),
      runOnce: Boolean(snippet.run_once),
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
router.post('/', (req, res) => {
  try {
    const { title, description, code, language, scope, priority, tags, folder, active, runOnce, wpCodeBoxId, cloudId } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO code_snippets (id, title, description, code, language, scope, priority, tags, folder, active, run_once, wp_code_box_id, cloud_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, title, description || '', code, language, scope, priority || 10,
      JSON.stringify(tags || []), folder || null, active ? 1 : 0, runOnce ? 1 : 0,
      wpCodeBoxId || null, cloudId || null, now, now
    );

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du snippet' });
  }
});

// PUT /api/snippets/:id - Mettre à jour un snippet
router.put('/:id', (req, res) => {
  try {
    const { title, description, code, language, scope, priority, tags, folder, active, runOnce } = req.body;
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE code_snippets
      SET title = ?, description = ?, code = ?, language = ?, scope = ?, priority = ?, tags = ?, folder = ?, active = ?, run_once = ?, updated_at = ?
      WHERE id = ?
    `).run(
      title, description || '', code, language, scope, priority || 10,
      JSON.stringify(tags || []), folder || null, active ? 1 : 0, runOnce ? 1 : 0, now, req.params.id
    ) as { changes: number };

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Snippet non trouvé' });
    }

    res.json({ updatedAt: now });
  } catch (error) {
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

