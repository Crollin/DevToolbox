import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('rejette une inscription sans email, mot de passe ou nom', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('rejette un email invalide', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid', password: 'password123', name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('email');
    });

    it('rejette un mot de passe trop court', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: '12345', name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('mot de passe');
    });

    it('crée un utilisateur valide et retourne un token', async () => {
      const uniqueEmail = `newuser-${Date.now()}-${Math.random()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: uniqueEmail,
          password: 'password123',
          name: 'New User',
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(uniqueEmail);
      expect(res.body.user.name).toBe('New User');
    });

    it('refuse un email déjà utilisé', async () => {
      const duplicateEmail = `duplicate-${Date.now()}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email: duplicateEmail,
          password: 'password123',
          name: 'First User',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: duplicateEmail,
          password: 'password456',
          name: 'Second User',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser: { email: string; password: string; name: string };

    beforeEach(async () => {
      testUser = {
        email: `login-${Date.now()}-${Math.random()}@example.com`,
        password: 'loginpassword',
        name: 'Login Test',
      };
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('rejette une connexion sans credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({});

      expect(res.status).toBe(400);
    });

    it('rejette un mot de passe incorrect', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('connexion réussie retourne un token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
    });
  });

  describe('Personal Access Tokens', () => {
    it('crée, utilise puis révoque un token limité aux licences', async () => {
      const user = { email: `raycast-${Date.now()}-${Math.random()}@example.com`, password: 'raycastpassword', name: 'Raycast User' };
      const auth = await request(app).post('/api/auth/register').send(user);
      const sessionToken = auth.body.token as string;
      const created = await request(app).post('/api/auth/personal-tokens').set('Authorization', `Bearer ${sessionToken}`).send({ name: 'Raycast' });

      expect(created.status).toBe(201);
      expect(created.body.token).toMatch(/^dt_/);
      expect(created.body.personalAccessToken.scope).toEqual(['licences']);

      const licence = await request(app).post('/api/licences').set('Authorization', `Bearer ${created.body.token}`).send({ name: 'Test Licence', key: 'secret-key', type: 'saas', isLifetime: true });
      expect(licence.status).toBe(201);

      const listed = await request(app).get('/api/auth/personal-tokens').set('Authorization', `Bearer ${sessionToken}`);
      expect(listed.status).toBe(200);
      expect(listed.body.personalAccessTokens[0].token).toBeUndefined();

      const revoked = await request(app).delete(`/api/auth/personal-tokens/${created.body.personalAccessToken.id}`).set('Authorization', `Bearer ${sessionToken}`);
      expect(revoked.status).toBe(200);
      const denied = await request(app).get('/api/licences').set('Authorization', `Bearer ${created.body.token}`);
      expect(denied.status).toBe(401);
    });

    it('refuse une date d’expiration passée', async () => {
      const user = { email: `expired-raycast-${Date.now()}-${Math.random()}@example.com`, password: 'raycastpassword', name: 'Expired Raycast User' };
      const auth = await request(app).post('/api/auth/register').send(user);
      const created = await request(app).post('/api/auth/personal-tokens').set('Authorization', `Bearer ${auth.body.token}`).send({ name: 'Expired', expiresAt: '2000-01-01T00:00:00.000Z' });
      expect(created.status).toBe(400);
    });
  });
});
