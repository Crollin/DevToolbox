import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Domains API', () => {
  let authToken: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `domains-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Domains Test User',
      });
    authToken = res.body.token;
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
});
