import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import app from '../../app';

describe('Task attachments API', () => {
  let token: string;
  let taskId: string;

  beforeEach(async () => {
    process.env.UPLOADS_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-att-api-'));
    const reg = await request(app).post('/api/auth/register').send({
      email: `att-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Att User',
    });
    token = reg.body.token;
    const task = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Avec PJ', dueDate: '2030-01-01' });
    taskId = task.body.task.id;
  });

  it('POST upload puis GET liste', async () => {
    const filePath = path.join(process.env.UPLOADS_ROOT!, 'hello.txt');
    fs.writeFileSync(filePath, 'hello world');
    const up = await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', filePath);
    expect(up.status).toBe(201);
    expect(up.body.attachment.originalFilename).toBe('hello.txt');
    expect(up.body.attachment.previewable).toBe(false);

    const list = await request(app)
      .get(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.attachments).toHaveLength(1);
  });

  it('rejette fichier > 10Mo', async () => {
    const big = path.join(process.env.UPLOADS_ROOT!, 'big.bin');
    fs.writeFileSync(big, Buffer.alloc(10 * 1024 * 1024 + 1));
    const up = await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', big);
    expect(up.status).toBe(400);
  });

  it('GET stream et DELETE', async () => {
    const filePath = path.join(process.env.UPLOADS_ROOT!, 'pic.png');
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(filePath, png);
    const up = await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', filePath);
    const id = up.body.attachment.id;
    const get = await request(app)
      .get(`/api/tasks/${taskId}/attachments/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(get.headers['content-type']).toMatch(/image\/png/);

    const del = await request(app)
      .delete(`/api/tasks/${taskId}/attachments/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const list = await request(app)
      .get(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.attachments).toHaveLength(0);
  });

  it('DELETE tâche nettoie les fichiers', async () => {
    const filePath = path.join(process.env.UPLOADS_ROOT!, 'a.txt');
    fs.writeFileSync(filePath, 'x');
    await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', filePath);
    await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`);
    const tasksDir = path.join(process.env.UPLOADS_ROOT!, 'tasks');
    const leftover = fs.existsSync(tasksDir)
      ? fs.readdirSync(tasksDir, { recursive: true })
      : [];
    expect(String(leftover)).not.toContain(taskId);
  });
});
