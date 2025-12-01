import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/scripts - Récupérer tous les scripts
router.get('/', (req, res) => {
  try {
    const scripts = db.prepare('SELECT * FROM wp_scripts ORDER BY created_at DESC').all();
    const categories = db.prepare('SELECT name FROM wp_script_categories ORDER BY name').all().map(c => c.name);
    const customTags = db.prepare('SELECT tag FROM wp_script_custom_tags ORDER BY tag').all().map(t => t.tag);

    const formattedScripts = scripts.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      code: s.code,
      language: s.language,
      category: s.category,
      tags: s.tags ? JSON.parse(s.tags) : [],
      wpVersionMin: s.wp_version_min,
      wpVersionMax: s.wp_version_max,
      author: s.author,
      difficulty: s.difficulty,
      instructions: s.instructions,
      dependencies: s.dependencies ? JSON.parse(s.dependencies) : [],
      warnings: s.warnings ? JSON.parse(s.warnings) : [],
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    res.json({ scripts: formattedScripts, categories, customTags });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des scripts' });
  }
});

// POST /api/scripts - Créer un script
router.post('/', (req, res) => {
  try {
    const { name, description, code, language, category, tags, wpVersionMin, wpVersionMax, author, difficulty, instructions, dependencies, warnings } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO wp_scripts (id, name, description, code, language, category, tags, wp_version_min, wp_version_max, author, difficulty, instructions, dependencies, warnings, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, description || '', code, language, category,
      JSON.stringify(tags || []), wpVersionMin || null, wpVersionMax || null,
      author, difficulty, instructions || null,
      JSON.stringify(dependencies || []), JSON.stringify(warnings || []),
      now, now
    );

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du script' });
  }
});

// PUT /api/scripts/:id - Mettre à jour un script
router.put('/:id', (req, res) => {
  try {
    const { name, description, code, language, category, tags, wpVersionMin, wpVersionMax, author, difficulty, instructions, dependencies, warnings } = req.body;
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE wp_scripts
      SET name = ?, description = ?, code = ?, language = ?, category = ?, tags = ?, wp_version_min = ?, wp_version_max = ?, author = ?, difficulty = ?, instructions = ?, dependencies = ?, warnings = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name, description || '', code, language, category, JSON.stringify(tags || []),
      wpVersionMin || null, wpVersionMax || null, author, difficulty,
      instructions || null, JSON.stringify(dependencies || []), JSON.stringify(warnings || []),
      now, req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Script non trouvé' });
    }

    res.json({ updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du script' });
  }
});

// DELETE /api/scripts/:id - Supprimer un script
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM wp_scripts WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Script non trouvé' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du script' });
  }
});

export default router;

