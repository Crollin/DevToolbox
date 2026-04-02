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
});
