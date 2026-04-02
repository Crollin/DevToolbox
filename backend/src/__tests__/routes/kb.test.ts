import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Knowledge Base API', () => {
  let authToken: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `kb-${Date.now()}-${Math.random()}@example.com`,
        password: 'password123',
        name: 'KB Test User',
      });
    authToken = res.body.token;
  });

  it('GET /api/kb/entries requiert une authentification', async () => {
    const res = await request(app).get('/api/kb/entries');
    expect(res.status).toBe(401);
  });

  it('CRUD basique: catégories, tags, entrée', async () => {
    // Créer une catégorie
    const catRes = await request(app)
      .post('/api/kb/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Inbox', position: 0 });
    expect(catRes.status).toBe(201);
    expect(catRes.body.id).toBeDefined();

    const categoryId = catRes.body.id as string;

    // Créer une entrée avec tags (créés à la volée côté API)
    const createRes = await request(app)
      .post('/api/kb/entries')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Ressource A',
        url: 'https://example.com/a',
        summary: 'Résumé',
        content: 'Contenu **markdown**',
        categoryId,
        tags: ['perf', 'dev'],
        isFavorite: true,
        status: 'active',
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBeDefined();
    const entryId = createRes.body.id as string;

    // Lister
    const listRes = await request(app)
      .get('/api/kb/entries')
      .set('Authorization', `Bearer ${authToken}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.entries)).toBe(true);
    expect(listRes.body.entries.length).toBeGreaterThanOrEqual(1);

    // Get by id
    const getRes = await request(app)
      .get(`/api/kb/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.title).toBe('Ressource A');
    expect(getRes.body.isFavorite).toBe(true);
    expect(Array.isArray(getRes.body.tags)).toBe(true);
    expect(getRes.body.tags.map((t: { name: string }) => t.name)).toEqual(expect.arrayContaining(['perf', 'dev']));

    // Recherche
    const searchRes = await request(app)
      .get('/api/kb/entries?query=Ressource')
      .set('Authorization', `Bearer ${authToken}`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.entries.length).toBeGreaterThanOrEqual(1);

    // Update
    const updRes = await request(app)
      .put(`/api/kb/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Ressource A+', tags: ['dev'] });
    expect(updRes.status).toBe(200);

    const getRes2 = await request(app)
      .get(`/api/kb/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(getRes2.status).toBe(200);
    expect(getRes2.body.title).toBe('Ressource A+');
    expect(getRes2.body.tags.map((t: { name: string }) => t.name)).toEqual(['dev']);

    // Delete
    const delRes = await request(app)
      .delete(`/api/kb/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(delRes.status).toBe(200);

    const getGone = await request(app)
      .get(`/api/kb/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(getGone.status).toBe(404);
  });
});

