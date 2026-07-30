import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { PassThrough } from 'stream';
import app from '../../app';
import db from '../../db/database';

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

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('renvoie 500 sans erreur non gérée si la lecture du fichier échoue', async () => {
    const filePath = path.join(process.env.UPLOADS_ROOT!, 'broken.txt');
    fs.writeFileSync(filePath, 'contenu');
    const up = await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', filePath);

    vi.spyOn(fs, 'createReadStream').mockImplementationOnce(() => {
      const stream = new PassThrough();
      process.nextTick(() => stream.destroy(new Error('read failed')));
      return stream as unknown as fs.ReadStream;
    });

    const response = await request(app)
      .get(`/api/tasks/${taskId}/attachments/${up.body.attachment.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Erreur lors de la lecture de la pièce jointe');
  });

  it('renvoie 404 si le fichier disparaît avant l’ouverture du stream', async () => {
    const filePath = path.join(process.env.UPLOADS_ROOT!, 'missing.txt');
    fs.writeFileSync(filePath, 'contenu');
    const up = await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', filePath);
    const stored = db.prepare(`
      SELECT user_id, stored_filename FROM task_attachments WHERE id = ?
    `).get(up.body.attachment.id) as { user_id: string; stored_filename: string };
    fs.rmSync(path.join(
      process.env.UPLOADS_ROOT!,
      'tasks',
      stored.user_id,
      taskId,
      stored.stored_filename,
    ));

    const response = await request(app)
      .get(`/api/tasks/${taskId}/attachments/${up.body.attachment.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Fichier non trouvé');
  });

  it('ferme la réponse si la lecture échoue après l’envoi d’un chunk', async () => {
    const filePath = path.join(process.env.UPLOADS_ROOT!, 'partial.txt');
    fs.writeFileSync(filePath, 'contenu');
    const up = await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', filePath);

    vi.spyOn(fs, 'createReadStream').mockImplementationOnce(() => {
      const stream = new PassThrough();
      process.nextTick(() => {
        stream.write('partiel');
        stream.destroy(new Error('read failed after headers'));
      });
      return stream as unknown as fs.ReadStream;
    });

    await expect(
      request(app)
        .get(`/api/tasks/${taskId}/attachments/${up.body.attachment.id}`)
        .set('Authorization', `Bearer ${token}`),
    ).rejects.toThrow();
  });

  it('conserve le fichier si la suppression de la pièce jointe échoue en base', async () => {
    const filePath = path.join(process.env.UPLOADS_ROOT!, 'keep-attachment.txt');
    fs.writeFileSync(filePath, 'à conserver');
    const up = await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', filePath);
    const attachmentId = up.body.attachment.id;

    const prepare = db.prepare.bind(db);
    vi.spyOn(db, 'prepare').mockImplementation(((sql: string) => {
      if (sql.startsWith('DELETE FROM task_attachments')) {
        const statement = prepare(sql);
        vi.spyOn(statement, 'run').mockImplementation(() => {
          throw new Error('database unavailable');
        });
        return statement;
      }
      return prepare(sql);
    }) as typeof db.prepare);

    const deletion = await request(app)
      .delete(`/api/tasks/${taskId}/attachments/${attachmentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deletion.status).toBe(500);

    vi.restoreAllMocks();
    const download = await request(app)
      .get(`/api/tasks/${taskId}/attachments/${attachmentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(download.status).toBe(200);
    expect(download.text).toBe('à conserver');
  });

  it('conserve les fichiers si la suppression de la tâche échoue en base', async () => {
    const filePath = path.join(process.env.UPLOADS_ROOT!, 'keep-task.txt');
    fs.writeFileSync(filePath, 'à conserver aussi');
    const up = await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', filePath);
    const attachmentId = up.body.attachment.id;

    const prepare = db.prepare.bind(db);
    vi.spyOn(db, 'prepare').mockImplementation(((sql: string) => {
      if (sql.startsWith('DELETE FROM tasks')) {
        const statement = prepare(sql);
        vi.spyOn(statement, 'run').mockImplementation(() => {
          throw new Error('database unavailable');
        });
        return statement;
      }
      return prepare(sql);
    }) as typeof db.prepare);

    const deletion = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deletion.status).toBe(500);

    vi.restoreAllMocks();
    const download = await request(app)
      .get(`/api/tasks/${taskId}/attachments/${attachmentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(download.status).toBe(200);
    expect(download.text).toBe('à conserver aussi');
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
