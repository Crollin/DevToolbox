import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import app from '../../app';
import db from '../../db/database';
import { generateToken } from '../../middleware/auth';

let token: string, userId: string;
beforeEach(() => {
  userId = randomUUID();
  db.prepare('INSERT INTO users(id,email,password_hash,name,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(userId,`${userId}@example.fr`,'unused','Test','2026','2026');
  token = generateToken({userId,email:`${userId}@example.fr`});
  process.env.MAIL_ENCRYPTION_KEY = Buffer.alloc(32,8).toString('base64');
  process.env.MAIL_ADMIN_USER_IDS = '';
});
describe('Mail integration API', () => {
  it('requires a session and explicit administrator assignment', async () => {
    expect((await request(app).get('/api/integrations/zoho')).status).toBe(401);
    expect((await request(app).get('/api/integrations/mail-ai').set('Authorization',`Bearer ${token}`)).status).toBe(403);
    process.env.MAIL_ADMIN_USER_IDS = userId;
    expect((await request(app).get('/api/integrations/mail-ai').set('Authorization',`Bearer ${token}`)).status).toBe(200);
  });
  it('never returns stored API keys and invalidates tests after configuration changes', async () => {
    process.env.MAIL_ADMIN_USER_IDS = userId;
    const response = await request(app).put('/api/integrations/mail-ai').set('Authorization',`Bearer ${token}`)
      .send({provider:'openrouter',openrouterModel:'mistralai/mistral-small-2603',deepseekModel:'deepseek-chat',openrouterKey:'super-secret'});
    expect(response.status).toBe(200); expect(response.body.openrouter.configured).toBe(true);
    expect(JSON.stringify(response.body)).not.toContain('super-secret');
    expect(response.body.openrouter.tested).toBe(false);
    const row = db.prepare('SELECT openrouter_key FROM mail_ai_config').get() as {openrouter_key:string};
    expect(row.openrouter_key).not.toBe('super-secret');
  });
  it('supports null or missing due dates and rejects invalid task fields', async () => {
    for (const input of [{title:'Sans date'},{title:'Sans date',dueDate:null}]) {
      const res = await request(app).post('/api/tasks').set('Authorization',`Bearer ${token}`).send(input);
      expect(res.status).toBe(201); expect(res.body.task.dueDate).toBeNull();
      const update = await request(app).put(`/api/tasks/${res.body.task.id}`).set('Authorization',`Bearer ${token}`).send({title:'Toujours sans date',dueDate:null});
      expect(update.status).toBe(200);
    }
    expect((await request(app).post('/api/tasks').set('Authorization',`Bearer ${token}`).send({title:'Test',dueDate:'invalid'})).status).toBe(400);
  });
  it('does not expose or accept another user’s proposals', async () => {
    const res = await request(app).get('/api/integrations/zoho/proposals').set('Authorization',`Bearer ${token}`);
    expect(res.body.proposals).toEqual([]);
    const accept = await request(app).post('/api/integrations/zoho/proposals/nonexistent/accept').set('Authorization',`Bearer ${token}`).send({});
    expect(accept.status).toBe(422);
  });
  it('accepts clients from existing tasks but not another user’s tasks', async () => {
    db.prepare('INSERT INTO zoho_connections(user_id,generation,account_id,email,refresh_token,activated_at) VALUES(?,?,?,?,?,?)')
      .run(userId, randomUUID(), 'account', 'test@example.fr', 'unused', Date.now());
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send({ title: 'Ancienne tâche', client: 'Client historique' }).expect(201);
    const update = (client: string) => request(app).put('/api/integrations/zoho').set('Authorization', `Bearer ${token}`)
      .send({ paused: false, mappings: [{ match: 'example.fr', client }], exclusions: [] });
    expect((await update('Client historique')).status).toBe(200);
    const otherId = randomUUID();
    db.prepare('INSERT INTO users(id,email,password_hash,name,created_at,updated_at) VALUES(?,?,?,?,?,?)')
      .run(otherId, `${otherId}@example.fr`, 'unused', 'Other', '2026', '2026');
    const otherToken = generateToken({ userId: otherId, email: `${otherId}@example.fr` });
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${otherToken}`).send({ title: 'Autre tâche', client: 'Client privé' }).expect(201);
    expect((await update('Client privé')).status).toBe(400);
  });
});
