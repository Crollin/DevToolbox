import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Domain Hub credentials API', () => {
  let token: string;
  const prev = process.env.DOMAIN_HUB_ENABLED;

  beforeEach(async () => {
    process.env.DOMAIN_HUB_ENABLED = 'true';
    const res = await request(app).post('/api/auth/register').send({
      email: `dh-creds-${Date.now()}@example.com`,
      password: 'password123',
      name: 'DH Creds',
    });
    token = res.body.token;
  });

  afterEach(() => {
    process.env.DOMAIN_HUB_ENABLED = prev;
  });

  it('GET returns empty configured flags', async () => {
    const res = await request(app)
      .get('/api/account/domain-hub-credentials')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.configured).toEqual({
      cloudflare: false,
      hostinger: false,
      ovh: false,
    });
  });

  it('PUT saves and masks secrets', async () => {
    const put = await request(app)
      .put('/api/account/domain-hub-credentials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cloudflareApiToken: 'tok',
        cloudflareAccountId: 'acc',
      });
    expect(put.status).toBe(200);
    expect(put.body.cloudflareApiToken).toBe('***');
    expect(put.body.configured.cloudflare).toBe(true);
  });

  it('returns 404 when Domain Hub disabled', async () => {
    process.env.DOMAIN_HUB_ENABLED = 'false';
    const res = await request(app)
      .get('/api/account/domain-hub-credentials')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
