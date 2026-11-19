import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Tasks API', () => {
  let authToken: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `tasks-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Tasks Test User',
      });
    authToken = res.body.token;
  });

  it('GET /api/tasks requiert une authentification', async () => {
    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(401);
  });

  it('GET /api/tasks retourne les tâches avec un token valide', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.tasks).toBeDefined();
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  it('GET /api/tasks accepte le filtre status valide', async () => {
    const res = await request(app)
      .get('/api/tasks?status=pending')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.tasks).toBeDefined();
  });

  it('ignore le filtre status invalide', async () => {
    const res = await request(app)
      .get('/api/tasks?status=invalid_status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.tasks).toBeDefined();
  });

  it('GET /api/tasks/notification-defaults requiert une authentification', async () => {
    const res = await request(app).get('/api/tasks/notification-defaults');
    expect(res.status).toBe(401);
  });

  it('GET /api/tasks/notification-defaults retourne les canaux', async () => {
    const res = await request(app)
      .get('/api/tasks/notification-defaults')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notificationChannels)).toBe(true);
    for (const channel of res.body.notificationChannels) {
      expect(['ntfy', 'email', 'telegram']).toContain(channel);
    }
  });

  it('POST /api/tasks crée une tâche', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test task',
        dueDate: '2025-12-31',
        status: 'pending',
      });

    expect(res.status).toBe(201);
    expect(res.body.task).toBeDefined();
    expect(res.body.task.title).toBe('Test task');
  });

  it('PATCH /api/tasks/:id conserve les champs omis', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Titre initial',
        description: 'Contexte à conserver',
        dueDate: '2026-11-15',
        client: 'Client Exemple',
        link: 'https://example.com/tache',
        tags: ['urgent'],
        priority: 'high',
        notificationChannels: ['email'],
        reminderDays: [7, 1],
        reminderDatetime: '2026-11-14T09:00:00.000Z',
      });

    const res = await request(app)
      .patch(`/api/tasks/${created.body.task.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Nouveau titre' });

    expect(res.status).toBe(200);
    expect(res.body.task).toMatchObject({
      title: 'Nouveau titre',
      description: 'Contexte à conserver',
      dueDate: '2026-11-15',
      client: 'Client Exemple',
      link: 'https://example.com/tache',
      tags: ['urgent'],
      priority: 'high',
      notificationChannels: ['email'],
      reminderDays: [7, 1],
      reminderDatetime: '2026-11-14T09:00:00.000Z',
    });
  });

  it('PATCH /api/tasks/:id applique les suppressions explicites', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Tâche à nettoyer',
        description: 'Contexte',
        dueDate: '2026-11-15',
        client: 'Client Exemple',
        link: 'https://example.com/tache',
        tags: ['urgent'],
        notificationChannels: ['email'],
        reminderDays: [7, 1],
        reminderDatetime: '2026-11-14T09:00:00.000Z',
      });

    const res = await request(app)
      .patch(`/api/tasks/${created.body.task.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Tâche nettoyée',
        description: '',
        dueDate: null,
        client: '',
        link: '',
        tags: [],
        notificationChannels: [],
        reminderDays: [],
        reminderDatetime: '',
      });

    expect(res.status).toBe(200);
    expect(res.body.task).toMatchObject({
      title: 'Tâche nettoyée',
      dueDate: null,
      tags: [],
      notificationChannels: [],
    });
    expect(res.body.task.description).toBeUndefined();
    expect(res.body.task.client).toBeUndefined();
    expect(res.body.task.link).toBeUndefined();
    expect(res.body.task.reminderDays).toBeUndefined();
    expect(res.body.task.reminderDatetime).toBeUndefined();
  });
});
