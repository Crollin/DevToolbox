import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Domains API', () => {
  let authToken: string;

  beforeEach(async () => {
    process.env.DOMAIN_HUB_ENABLED = 'true';
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `domains-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Domains Test User',
      });
    authToken = res.body.token;
  });

  it('sync Hostinger uses user credentials not env', async () => {
    process.env.HOSTINGER_API_TOKEN = 'env-should-be-ignored';
    const res = await request(app)
      .post('/api/domains/sync/hostinger')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Hostinger/i);
  });

  it('sync Cloudflare refuse sans credentials utilisateur', async () => {
    const res = await request(app)
      .post('/api/domains/sync/cloudflare')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Cloudflare/i);
  });

  it('sync Cloudflare crée et met à jour les domaines', async () => {
    await request(app)
      .put('/api/account/domain-hub-credentials')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cloudflareApiToken: 'cf-test-token',
        cloudflareAccountId: 'acct-test-123',
      });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          success: true,
          result: [
            {
              id: 'example.com',
              name: 'example.com',
              expires_at: '2027-01-15T00:00:00Z',
              current_registrar: 'Cloudflare',
            },
            {
              id: 'skip.net',
              name: 'skip.net',
              expires_at: '2027-06-01T00:00:00Z',
              current_registrar: 'GoDaddy',
            },
          ],
          result_info: { page: 1, per_page: 50, total_count: 2, count: 2 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )) as typeof fetch;

    try {
      const first = await request(app)
        .post('/api/domains/sync/cloudflare')
        .set('Authorization', `Bearer ${authToken}`);
      expect(first.status).toBe(200);
      expect(first.body).toMatchObject({ synced: 1, created: 1, updated: 0 });

      const second = await request(app)
        .post('/api/domains/sync/cloudflare')
        .set('Authorization', `Bearer ${authToken}`);
      expect(second.status).toBe(200);
      expect(second.body).toMatchObject({ synced: 1, created: 0, updated: 1 });

      const list = await request(app)
        .get('/api/domains')
        .set('Authorization', `Bearer ${authToken}`);
      expect(list.status).toBe(200);
      const names = (list.body.domains as Array<{ name: string; registrar: string }>).map(
        (d) => d.name
      );
      expect(names).toContain('example.com');
      expect(names).not.toContain('skip.net');
      const cf = (list.body.domains as Array<{ name: string; registrar: string }>).find(
        (d) => d.name === 'example.com'
      );
      expect(cf?.registrar).toBe('cloudflare');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('GET /api/domains requiert une authentification', async () => {
    const res = await request(app).get('/api/domains');
    expect(res.status).toBe(401);
  });

  it('POST /api/domains crée un domaine avec billingStatus', async () => {
    const res = await request(app)
      .post('/api/domains')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'test-export.com',
        registrar: 'cloudflare',
        payer: 'client',
        clientName: 'Client Test',
        sellYearly: 29.99,
        expiresAt: '2026-12-31',
        billingStatus: 'pending',
      });

    expect(res.status).toBe(201);
    expect(res.body.domain.billingStatus).toBe('pending');
    expect(res.body.domain.name).toBe('test-export.com');
  });

  it('GET /api/domains/export/billing.csv retourne un CSV', async () => {
    await request(app)
      .post('/api/domains')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'csv-test.com',
        registrar: 'hostinger',
        payer: 'client',
        clientName: 'CSV Client',
        clientEmail: 'csv@client.com',
        sellYearly: 15,
        expiresAt: '2026-12-31',
      });

    const res = await request(app)
      .get('/api/domains/export/billing.csv?payer=client&days=0&billingStatus=pending')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.text).toContain('client_name');
    expect(res.text).toContain('csv-test.com');
    expect(res.text).toContain('CSV Client');
  });

  it('PATCH /api/domains/:id/billing met à jour le statut', async () => {
    const createRes = await request(app)
      .post('/api/domains')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'billing-patch.com',
        registrar: 'ovh',
        payer: 'client',
        sellYearly: 10,
      });

    const domainId = createRes.body.domain.id;

    const res = await request(app)
      .patch(`/api/domains/${domainId}/billing`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ billingStatus: 'invoiced' });

    expect(res.status).toBe(200);
    expect(res.body.domain.billingStatus).toBe('invoiced');
    expect(res.body.domain.lastBilledAt).toBeTruthy();
  });

  it('POST /api/domains/resources crée une ressource VPS', async () => {
    const res = await request(app)
      .post('/api/domains/resources')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        kind: 'vps',
        label: 'srv-test',
        plan: 'KVM 4',
        hostname: 'srv-test.example',
        ipv4: '1.2.3.4',
        payer: 'agency',
      });

    expect(res.status).toBe(201);
    expect(res.body.resource.kind).toBe('vps');
    expect(res.body.resource.label).toBe('srv-test');
    expect(res.body.resource.billingStatus).toBe('n/a');
  });

  it('GET /api/domains/resources liste les ressources', async () => {
    await request(app)
      .post('/api/domains/resources')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ kind: 'hosting', label: 'Business', externalId: '123' });

    const res = await request(app)
      .get('/api/domains/resources')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.resources.length).toBeGreaterThanOrEqual(1);
  });
});
