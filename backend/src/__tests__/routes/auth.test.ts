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
});
