import { describe, it, expect, beforeEach } from 'vitest';
import db, { initializeDatabase } from '../../db/database';
import {
  upsertCredentials,
  toPublic,
  getCredentialsRow,
  toRegistrarCredentials,
} from '../../lib/domainHubCredentials';

initializeDatabase();

describe('domainHubCredentials', () => {
  const userId = 'user-creds-test';

  beforeEach(() => {
    db.prepare('DELETE FROM domain_hub_credentials WHERE user_id = ?').run(userId);
    db.prepare(
      `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at, updated_at)
       VALUES (?, 'creds@test.com', 'x', 'Test', datetime('now'), datetime('now'))`
    ).run(userId);
  });

  it('masks secrets on toPublic and reports configured flags', () => {
    upsertCredentials(userId, {
      cloudflareApiToken: 'cf-secret',
      cloudflareAccountId: 'acct-1',
      hostingerApiToken: '',
    });
    const pub = toPublic(getCredentialsRow(userId));
    expect(pub.cloudflareApiToken).toBe('***');
    expect(pub.cloudflareAccountId).toBe('acct-1');
    expect(pub.configured.cloudflare).toBe(true);
    expect(pub.configured.hostinger).toBe(false);
  });

  it('keeps existing secret when body sends ***', () => {
    upsertCredentials(userId, { hostingerApiToken: 'h1' });
    upsertCredentials(userId, { hostingerApiToken: '***' });
    const raw = toRegistrarCredentials(getCredentialsRow(userId));
    expect(raw.hostingerApiToken).toBe('h1');
  });

  it('clears secret when body sends empty string', () => {
    upsertCredentials(userId, { hostingerApiToken: 'h1' });
    upsertCredentials(userId, { hostingerApiToken: '' });
    const raw = toRegistrarCredentials(getCredentialsRow(userId));
    expect(raw.hostingerApiToken).toBeNull();
  });
});
