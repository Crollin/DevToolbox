import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { isDomainHubEnabled, isTransmuteEnabled } from '../../lib/features';

describe('Config API', () => {
  it('GET /api/config retourne les feature flags sans authentification', async () => {
    const res = await request(app).get('/api/config');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      domainHubEnabled: true,
      transmuteEnabled: true,
    });
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

describe('isTransmuteEnabled', () => {
  const originalUrl = process.env.TRANSMUTE_BASE_URL;
  const originalKey = process.env.TRANSMUTE_API_KEY;

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.TRANSMUTE_BASE_URL;
    else process.env.TRANSMUTE_BASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.TRANSMUTE_API_KEY;
    else process.env.TRANSMUTE_API_KEY = originalKey;
  });

  it('retourne false si URL ou clé manquante', () => {
    delete process.env.TRANSMUTE_BASE_URL;
    delete process.env.TRANSMUTE_API_KEY;
    expect(isTransmuteEnabled()).toBe(false);

    process.env.TRANSMUTE_BASE_URL = 'http://localhost:3313';
    delete process.env.TRANSMUTE_API_KEY;
    expect(isTransmuteEnabled()).toBe(false);

    delete process.env.TRANSMUTE_BASE_URL;
    process.env.TRANSMUTE_API_KEY = 'tm_x';
    expect(isTransmuteEnabled()).toBe(false);
  });

  it('retourne true quand URL et clé sont définies', () => {
    process.env.TRANSMUTE_BASE_URL = 'http://localhost:3313';
    process.env.TRANSMUTE_API_KEY = 'tm_x';
    expect(isTransmuteEnabled()).toBe(true);
  });
});

describe('Domains API (module désactivé)', () => {
  it('retourne 404 quand DOMAIN_HUB_ENABLED est false (testé via /api/config)', async () => {
    process.env.DOMAIN_HUB_ENABLED = 'false';
    expect(isDomainHubEnabled()).toBe(false);
  });
});
