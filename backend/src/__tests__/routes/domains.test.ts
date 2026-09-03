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
