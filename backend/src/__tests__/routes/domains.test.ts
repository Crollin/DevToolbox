import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('sync Hostinger importe toutes les pages des comptes hébergement', async () => {
    await request(app)
      .put('/api/account/domain-hub-credentials')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ hostingerApiToken: 'test-token' });

    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      plan: { name: `Plan ${index + 1}` },
      status: 'active',
    }));
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('/api/domains/v1/portfolio')) {
        return Response.json([]);
      }
      if (url.includes('/api/vps/v1/virtual-machines')) {
        return Response.json([]);
      }
      if (url.includes('page=2')) {
        return Response.json({
          data: [{ id: 101, plan: { name: 'Plan 101' }, status: 'active' }],
          meta: { current_page: 2, per_page: 100, total: 101 },
        });
      }
      return Response.json({
        data: firstPage,
        meta: { current_page: 1, per_page: 100, total: 101 },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const syncRes = await request(app)
      .post('/api/domains/sync/hostinger')
      .set('Authorization', `Bearer ${authToken}`);

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.hosting.synced).toBe(101);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/hosting/v1/orders?per_page=100&page=2'),
      expect.any(Object)
    );
  });

  it('préserve le statut de facturation quand le payeur ne change pas', async () => {
    const createRes = await request(app)
      .post('/api/domains/resources')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        kind: 'vps',
        label: 'VPS client',
        payer: 'client',
        sellYearly: 240,
        billingStatus: 'paid',
      });

    const updateRes = await request(app)
      .put(`/api/domains/resources/${createRes.body.resource.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ label: 'VPS client renommé', payer: 'client' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.resource.billingStatus).toBe('paid');
  });

  it('préserve le libellé personnalisé lors des synchronisations suivantes', async () => {
    await request(app)
      .put('/api/account/domain-hub-credentials')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ hostingerApiToken: 'test-token' });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes('/api/domains/v1/portfolio')) {
          return Response.json([]);
        }
        if (url.includes('/api/vps/v1/virtual-machines')) {
          return Response.json([
            {
              id: 7,
              hostname: 'srv7.hstgr.cloud',
              plan: 'KVM 4',
              state: 'running',
            },
          ]);
        }
        return Response.json({
          data: [],
          meta: { current_page: 1, per_page: 100, total: 0 },
        });
      })
    );

    await request(app)
      .post('/api/domains/sync/hostinger')
      .set('Authorization', `Bearer ${authToken}`);
    const listRes = await request(app)
      .get('/api/domains/resources')
      .set('Authorization', `Bearer ${authToken}`);
    const resource = listRes.body.resources.find(
      (item: { externalId: string | null }) => item.externalId === '7'
    );

    await request(app)
      .put(`/api/domains/resources/${resource.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ label: 'Client ACME — Prod' });
    await request(app)
      .post('/api/domains/sync/hostinger')
      .set('Authorization', `Bearer ${authToken}`);

    const refreshedRes = await request(app)
      .get('/api/domains/resources')
      .set('Authorization', `Bearer ${authToken}`);
    const refreshed = refreshedRes.body.resources.find(
      (item: { id: string }) => item.id === resource.id
    );
    expect(refreshed.label).toBe('Client ACME — Prod');
  });

  it('inclut les ressources facturables dans export CSV', async () => {
    await request(app)
      .post('/api/domains/resources')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        kind: 'hosting',
        label: 'Hébergement Business ACME',
        payer: 'client',
        clientName: 'ACME',
        sellYearly: 120,
        billingStatus: 'pending',
      });

    const exportRes = await request(app)
      .get('/api/domains/export/billing.csv?payer=client&days=60&billingStatus=pending')
      .set('Authorization', `Bearer ${authToken}`);

    expect(exportRes.status).toBe(200);
    expect(exportRes.text).toContain('Hébergement Business ACME');
    expect(exportRes.text).toContain('Renouvellement hébergement');
  });
});
