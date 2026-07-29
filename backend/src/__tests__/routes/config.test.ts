import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { isDomainHubEnabled } from '../../lib/features';

describe('Config API', () => {
  it('GET /api/config retourne domainHubEnabled sans authentification', async () => {
    const res = await request(app).get('/api/config');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ domainHubEnabled: true });
  });
});

describe('isDomainHubEnabled', () => {
  const original = process.env.DOMAIN_HUB_ENABLED;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.DOMAIN_HUB_ENABLED;
    } else {
      process.env.DOMAIN_HUB_ENABLED = original;
    }
  });

  it('retourne false par défaut', () => {
    delete process.env.DOMAIN_HUB_ENABLED;
    expect(isDomainHubEnabled()).toBe(false);
  });

  it('retourne true pour "true" ou "1"', () => {
    process.env.DOMAIN_HUB_ENABLED = 'true';
    expect(isDomainHubEnabled()).toBe(true);

    process.env.DOMAIN_HUB_ENABLED = '1';
    expect(isDomainHubEnabled()).toBe(true);
  });

  it('retourne false pour les autres valeurs', () => {
    process.env.DOMAIN_HUB_ENABLED = 'false';
    expect(isDomainHubEnabled()).toBe(false);

    process.env.DOMAIN_HUB_ENABLED = '0';
    expect(isDomainHubEnabled()).toBe(false);
  });
});

describe('Domains API (module désactivé)', () => {
  it('retourne 404 quand DOMAIN_HUB_ENABLED est false (testé via /api/config)', async () => {
    process.env.DOMAIN_HUB_ENABLED = 'false';
    expect(isDomainHubEnabled()).toBe(false);
  });
});
