import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { validateBody, kbCategorySchema, kbTagSchema, kbEntryCreateSchema, kbEntryUpdateSchema } from '../lib/validate';

const router = express.Router();

router.use(authenticateToken);

function hasKBFts(): boolean {
  try {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type IN ('table','view') AND name = 'kb_entries_fts'")
      .get() as { name?: string } | undefined;
    return Boolean(row?.name);
  } catch {
    return false;
  }
}

function normalizeTags(tags: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of tags) {
    const v = t.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function escapeLike(input: string): string {
  // Escape %, _ and backslash for LIKE ... ESCAPE '\\'
  return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function coerceBoolean(v: unknown): boolean | undefined {
  if (v === undefined) return undefined;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;
  }
  return undefined;
}

function coerceInt(v: unknown, fallback: number): number {
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

// -------------------------
// Categories
// -------------------------
router.get('/categories', (req, res) => {
  try {
    const userId = req.user!.id;
    const rows = db.prepare(`
      SELECT id, name, position, created_at, updated_at
      FROM kb_categories
      WHERE user_id = ?
      ORDER BY position ASC, name ASC
    `).all(userId) as Array<{ id: string; name: string; position: number; created_at: string; updated_at: string }>;

    res.json({
      categories: rows.map((r) => ({
        id: r.id,
        name: r.name,
        position: r.position,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (error) {
    console.error('Erreur KB categories (list):', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

router.post('/categories', validateBody(kbCategorySchema), (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, position } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO kb_categories (id, user_id, name, position, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, name, position ?? 0, now, now);

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    // UNIQUE(user_id, name)
    if (String(error).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Une catégorie avec ce nom existe déjà' });
    }
    console.error('Erreur KB categories (create):', error);
    res.status(500).json({ error: 'Erreur lors de la création de la catégorie' });
  }
});

router.put('/categories/:id', validateBody(kbCategorySchema.partial()), (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, position } = req.body as Partial<{ name: string; position: number }>;
    const now = new Date().toISOString();

    const current = db.prepare(`
      SELECT id, name, position
      FROM kb_categories
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, userId) as { id: string; name: string; position: number } | undefined;

    if (!current) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    const nextName = name !== undefined ? name : current.name;
    const nextPos = position !== undefined ? position : current.position;

    db.prepare(`
      UPDATE kb_categories
      SET name = ?, position = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(nextName, nextPos, now, req.params.id, userId);

    res.json({ updatedAt: now });
  } catch (error) {
    if (String(error).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Une catégorie avec ce nom existe déjà' });
    }
    console.error('Erreur KB categories (update):', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la catégorie' });
  }
});

router.delete('/categories/:id', (req, res) => {
  try {
    const userId = req.user!.id;
    const result = db.prepare('DELETE FROM kb_categories WHERE id = ? AND user_id = ?').run(req.params.id, userId) as {
      changes: number;
    };
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur KB categories (delete):', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la catégorie' });
  }
});

// -------------------------
// Tags
// -------------------------
router.get('/tags', (req, res) => {
  try {
    const userId = req.user!.id;
    const rows = db.prepare(`
      SELECT id, name, created_at, updated_at
      FROM kb_tags
      WHERE user_id = ?
      ORDER BY name ASC
    `).all(userId) as Array<{ id: string; name: string; created_at: string; updated_at: string }>;

    res.json({
      tags: rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at, updatedAt: r.updated_at })),
    });
  } catch (error) {
    console.error('Erreur KB tags (list):', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des tags' });
  }
});

router.post('/tags', validateBody(kbTagSchema), (req, res) => {
  try {
    const userId = req.user!.id;
    const { name } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO kb_tags (id, user_id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, name, now, now);

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    if (String(error).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Un tag avec ce nom existe déjà' });
    }
    console.error('Erreur KB tags (create):', error);
    res.status(500).json({ error: 'Erreur lors de la création du tag' });
  }
});

router.delete('/tags/:id', (req, res) => {
  try {
    const userId = req.user!.id;
    const result = db.prepare('DELETE FROM kb_tags WHERE id = ? AND user_id = ?').run(req.params.id, userId) as {
      changes: number;
    };
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tag non trouvé' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur KB tags (delete):', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du tag' });
  }
});

// -------------------------
// Entries
// -------------------------
router.get('/entries', (req, res) => {
  try {
    const userId = req.user!.id;

    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const favorite = coerceBoolean(req.query.favorite);
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'updated_desc';
    const page = Math.max(1, coerceInt(req.query.page, 1));
    const pageSize = Math.min(100, Math.max(1, coerceInt(req.query.pageSize, 30)));
    const offset = (page - 1) * pageSize;

    const tagIdsRaw = req.query.tagIds;
    const tagIds = Array.isArray(tagIdsRaw)
      ? tagIdsRaw.filter((t): t is string => typeof t === 'string' && t.length > 0)
      : typeof tagIdsRaw === 'string' && tagIdsRaw.length
        ? tagIdsRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

    const orderBy =
      sort === 'created_desc' ? 'e.created_at DESC' :
      sort === 'created_asc' ? 'e.created_at ASC' :
      sort === 'title_asc' ? 'e.title COLLATE NOCASE ASC' :
      sort === 'title_desc' ? 'e.title COLLATE NOCASE DESC' :
      'e.updated_at DESC';

    const filters: string[] = ['e.user_id = ?'];
    const params: unknown[] = [userId];

    if (status === 'active' || status === 'archived') {
      filters.push('e.status = ?');
      params.push(status);
    }

    if (categoryId) {
      filters.push('e.category_id = ?');
      params.push(categoryId);
    }

    if (favorite !== undefined) {
      filters.push('e.is_favorite = ?');
      params.push(favorite ? 1 : 0);
    }

    const useFts = Boolean(query) && hasKBFts();
    if (query) {
      const q = `%${escapeLike(query)}%`;
      const likeSql = `(
        e.title LIKE ? ESCAPE '\\' OR
        e.url LIKE ? ESCAPE '\\' OR
        e.summary LIKE ? ESCAPE '\\' OR
        e.content LIKE ? ESCAPE '\\'
      )`;

      if (useFts) {
        // FTS5 peut varier selon build SQLite; on garde un fallback LIKE dans la même requête.
        filters.push(`(
          e.id IN (SELECT entry_id FROM kb_entries_fts WHERE kb_entries_fts MATCH ?)
          OR ${likeSql}
        )`);
        params.push(query, q, q, q, q);
      } else {
        filters.push(likeSql);
        params.push(q, q, q, q);
      }
    }

    if (tagIds.length) {
      const placeholders = tagIds.map(() => '?').join(', ');
      filters.push(`
        e.id IN (
          SELECT et.entry_id
          FROM kb_entry_tags et
          WHERE et.tag_id IN (${placeholders})
          GROUP BY et.entry_id
          HAVING COUNT(DISTINCT et.tag_id) = ?
        )
      `);
      params.push(...tagIds, tagIds.length);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const totalRow = db.prepare(`
      SELECT COUNT(*) as total
      FROM kb_entries e
      ${whereSql}
    `).get(...params) as { total: number };

    const rows = db.prepare(`
      SELECT
        e.id,
        e.category_id,
        e.url,
        e.title,
        e.summary,
        e.content,
        e.is_favorite,
        e.status,
        e.created_at,
        e.updated_at,
        e.last_opened_at
      FROM kb_entries e
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as Array<{
      id: string;
      category_id: string | null;
      url: string | null;
      title: string;
      summary: string | null;
      content: string | null;
      is_favorite: number;
      status: string;
      created_at: string;
      updated_at: string;
      last_opened_at: string | null;
    }>;

    const ids = rows.map((r) => r.id);
    const tagMap = new Map<string, Array<{ id: string; name: string }>>();
    if (ids.length) {
      const placeholders = ids.map(() => '?').join(', ');
      const tagRows = db.prepare(`
        SELECT et.entry_id, t.id as tag_id, t.name as tag_name
        FROM kb_entry_tags et
        JOIN kb_tags t ON t.id = et.tag_id
        WHERE et.entry_id IN (${placeholders})
        ORDER BY t.name ASC
      `).all(...ids) as Array<{ entry_id: string; tag_id: string; tag_name: string }>;

      for (const tr of tagRows) {
        const arr = tagMap.get(tr.entry_id) ?? [];
        arr.push({ id: tr.tag_id, name: tr.tag_name });
        tagMap.set(tr.entry_id, arr);
      }
    }

    res.json({
      page,
      pageSize,
      total: totalRow.total,
      entries: rows.map((r) => ({
        id: r.id,
        categoryId: r.category_id,
        url: r.url,
        title: r.title,
        summary: r.summary,
        content: r.content,
        isFavorite: Boolean(r.is_favorite),
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        lastOpenedAt: r.last_opened_at,
        tags: tagMap.get(r.id) ?? [],
      })),
      searchMode: useFts ? 'fts' : (query ? 'like' : 'none'),
    });
  } catch (error) {
    console.error('Erreur KB entries (list):', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des entrées' });
  }
});

router.get('/entries/:id', (req, res) => {
  try {
    const userId = req.user!.id;
    const row = db.prepare(`
      SELECT
        id, category_id, url, title, summary, content, is_favorite, status, created_at, updated_at, last_opened_at
      FROM kb_entries
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, userId) as {
      id: string;
      category_id: string | null;
      url: string | null;
      title: string;
      summary: string | null;
      content: string | null;
      is_favorite: number;
      status: string;
      created_at: string;
      updated_at: string;
      last_opened_at: string | null;
    } | undefined;

    if (!row) return res.status(404).json({ error: 'Entrée non trouvée' });

    const tags = db.prepare(`
      SELECT t.id, t.name
      FROM kb_entry_tags et
      JOIN kb_tags t ON t.id = et.tag_id
      WHERE et.entry_id = ?
      ORDER BY t.name ASC
    `).all(row.id) as Array<{ id: string; name: string }>;

    res.json({
      id: row.id,
      categoryId: row.category_id,
      url: row.url,
      title: row.title,
      summary: row.summary,
      content: row.content,
      isFavorite: Boolean(row.is_favorite),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastOpenedAt: row.last_opened_at,
      tags,
    });
  } catch (error) {
    console.error('Erreur KB entries (get):', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l’entrée' });
  }
});

router.post('/entries', validateBody(kbEntryCreateSchema), (req, res) => {
  try {
    const userId = req.user!.id;
    const { title, url, summary, content, categoryId, tags, isFavorite, status } = req.body;

    const id = uuidv4();
    const now = new Date().toISOString();
    const normTags = normalizeTags(tags ?? []);

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO kb_entries (id, user_id, category_id, url, title, summary, content, is_favorite, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        userId,
        categoryId ?? null,
        url ?? null,
        title,
        summary ?? null,
        content ?? null,
        isFavorite ? 1 : 0,
        status ?? 'active',
        now,
        now
      );

      if (normTags.length) {
        const selectTag = db.prepare(`SELECT id FROM kb_tags WHERE user_id = ? AND name = ?`);
        const insertTag = db.prepare(`
          INSERT INTO kb_tags (id, user_id, name, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `);
        const insertLink = db.prepare(`
          INSERT OR IGNORE INTO kb_entry_tags (entry_id, tag_id, created_at)
          VALUES (?, ?, ?)
        `);

        for (const tagName of normTags) {
          const existing = selectTag.get(userId, tagName) as { id: string } | undefined;
          const tagId = existing?.id ?? uuidv4();
          if (!existing) insertTag.run(tagId, userId, tagName, now, now);
          insertLink.run(id, tagId, now);
        }
      }
    });

    tx();

    res.status(201).json({ id, createdAt: now, updatedAt: now });
  } catch (error) {
    console.error('Erreur KB entries (create):', error);
    res.status(500).json({ error: 'Erreur lors de la création de l’entrée' });
  }
});

router.put('/entries/:id', validateBody(kbEntryUpdateSchema), (req, res) => {
  try {
    const userId = req.user!.id;
    const entryId = req.params.id;
    const now = new Date().toISOString();

    const current = db.prepare(`
      SELECT id, category_id, url, title, summary, content, is_favorite, status
      FROM kb_entries
      WHERE id = ? AND user_id = ?
    `).get(entryId, userId) as {
      id: string;
      category_id: string | null;
      url: string | null;
      title: string;
      summary: string | null;
      content: string | null;
      is_favorite: number;
      status: string;
    } | undefined;

    if (!current) return res.status(404).json({ error: 'Entrée non trouvée' });

    const body = req.body as Partial<{
      title: string;
      url: string | null;
      summary: string | null;
      content: string | null;
      categoryId: string | null;
      tags: string[];
      isFavorite: boolean;
      status: 'active' | 'archived';
    }>;

    const nextTitle = body.title !== undefined ? body.title : current.title;
    const nextUrl = body.url !== undefined ? body.url : current.url;
    const nextSummary = body.summary !== undefined ? body.summary : current.summary;
    const nextContent = body.content !== undefined ? body.content : current.content;
    const nextCategoryId = body.categoryId !== undefined ? body.categoryId : current.category_id;
    const nextFavorite = body.isFavorite !== undefined ? (body.isFavorite ? 1 : 0) : current.is_favorite;
    const nextStatus = body.status !== undefined ? body.status : (current.status as 'active' | 'archived');
    const nextTags = body.tags !== undefined ? normalizeTags(body.tags) : undefined;

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE kb_entries
        SET category_id = ?, url = ?, title = ?, summary = ?, content = ?, is_favorite = ?, status = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(
        nextCategoryId ?? null,
        nextUrl ?? null,
        nextTitle,
        nextSummary ?? null,
        nextContent ?? null,
        nextFavorite,
        nextStatus,
        now,
        entryId,
        userId
      );

      if (nextTags !== undefined) {
        db.prepare(`DELETE FROM kb_entry_tags WHERE entry_id = ?`).run(entryId);

        if (nextTags.length) {
          const selectTag = db.prepare(`SELECT id FROM kb_tags WHERE user_id = ? AND name = ?`);
          const insertTag = db.prepare(`
            INSERT INTO kb_tags (id, user_id, name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
          `);
          const insertLink = db.prepare(`
            INSERT OR IGNORE INTO kb_entry_tags (entry_id, tag_id, created_at)
            VALUES (?, ?, ?)
          `);

          for (const tagName of nextTags) {
            const existing = selectTag.get(userId, tagName) as { id: string } | undefined;
            const tagId = existing?.id ?? uuidv4();
            if (!existing) insertTag.run(tagId, userId, tagName, now, now);
            insertLink.run(entryId, tagId, now);
          }
        }
      }
    });

    tx();

    res.json({ updatedAt: now });
  } catch (error) {
    console.error('Erreur KB entries (update):', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l’entrée' });
  }
});

router.delete('/entries/:id', (req, res) => {
  try {
    const userId = req.user!.id;
    const entryId = req.params.id;

    const result = db.prepare('DELETE FROM kb_entries WHERE id = ? AND user_id = ?').run(entryId, userId) as {
      changes: number;
    };
    if (result.changes === 0) return res.status(404).json({ error: 'Entrée non trouvée' });
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur KB entries (delete):', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l’entrée' });
  }
});

router.post('/entries/:id/opened', (req, res) => {
  try {
    const userId = req.user!.id;
    const entryId = req.params.id;
    const now = new Date().toISOString();
    const result = db.prepare(`
      UPDATE kb_entries
      SET last_opened_at = ?, updated_at = updated_at
      WHERE id = ? AND user_id = ?
    `).run(now, entryId, userId) as { changes: number };
    if (result.changes === 0) return res.status(404).json({ error: 'Entrée non trouvée' });
    res.json({ success: true, lastOpenedAt: now });
  } catch (error) {
    console.error('Erreur KB entries (opened):', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la dernière ouverture' });
  }
});

export default router;

