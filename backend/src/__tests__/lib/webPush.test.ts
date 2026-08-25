import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const { sendNotification, setVapidDetails } = vi.hoisted(() => ({
  sendNotification: vi.fn(),
  setVapidDetails: vi.fn(),
}));

vi.mock('web-push', () => ({
  default: {
    sendNotification,
    setVapidDetails,
  },
}));

import db, { initializeDatabase } from '../../db/database';
import {
  upsertPushSubscription,
  countPushSubscriptions,
  sendWebPushToUser,
  isWebPushConfigured,
  deletePushSubscription,
} from '../../lib/webPush';

initializeDatabase();

describe('webPush', () => {
  const userId = 'user-webpush-test';

  beforeEach(() => {
    sendNotification.mockReset();
    setVapidDetails.mockReset();
    process.env.VAPID_PUBLIC_KEY =
      'BEl62iUYgUivxIkv69yViEuiBIa-Ib29-8m5Pq8XjYHjYQ3nq5e4QqJgVgF9VxG0Y5pQ1xP8pYxYxYxYxYxYxYw';
    process.env.VAPID_PRIVATE_KEY = 'test-private-key-for-vitest-only';
    process.env.VAPID_SUBJECT = 'mailto:test@example.com';

    db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(userId);
    db.prepare(
      `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at, updated_at)
       VALUES (?, 'push@test.com', 'x', 'Push User', datetime('now'), datetime('now'))`
    ).run(userId);
  });

  afterEach(() => {
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_SUBJECT;
  });

  it('upserts subscription and counts devices', () => {
    upsertPushSubscription(userId, {
      endpoint: 'https://push.example/endpoint-1',
      keys: { p256dh: 'p256', auth: 'auth' },
    });
    upsertPushSubscription(userId, {
      endpoint: 'https://push.example/endpoint-1',
      keys: { p256dh: 'p256-updated', auth: 'auth-updated' },
    });
    expect(countPushSubscriptions(userId)).toBe(1);

    const row = db
      .prepare('SELECT p256dh, auth FROM push_subscriptions WHERE endpoint = ?')
      .get('https://push.example/endpoint-1') as { p256dh: string; auth: string };
    expect(row.p256dh).toBe('p256-updated');
    expect(row.auth).toBe('auth-updated');
  });

  it('sends push to all subscriptions', async () => {
    sendNotification.mockResolvedValue({ statusCode: 201 });
    upsertPushSubscription(userId, {
      endpoint: 'https://push.example/a',
      keys: { p256dh: 'k1', auth: 'a1' },
    });
    upsertPushSubscription(userId, {
      endpoint: 'https://push.example/b',
      keys: { p256dh: 'k2', auth: 'a2' },
    });

    const result = await sendWebPushToUser(userId, {
      title: 'Hello',
      body: 'World',
      url: '/tasks',
    });

    expect(result.sent).toBe(true);
    expect(result.count).toBe(2);
    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(JSON.parse(sendNotification.mock.calls[0][1])).toMatchObject({
      title: 'Hello',
      body: 'World',
      url: '/tasks',
    });
  });

  it('deletes subscription on 410 Gone', async () => {
    const goneError = Object.assign(new Error('Gone'), { statusCode: 410 });
    sendNotification.mockRejectedValue(goneError);

    upsertPushSubscription(userId, {
      endpoint: 'https://push.example/expired',
      keys: { p256dh: 'k', auth: 'a' },
    });

    const result = await sendWebPushToUser(userId, { title: 't', body: 'b' });
    expect(result.sent).toBe(false);
    expect(countPushSubscriptions(userId)).toBe(0);
  });

  it('returns silently when VAPID is missing', async () => {
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    expect(isWebPushConfigured()).toBe(false);
    const result = await sendWebPushToUser(userId, { title: 't', body: 'b' });
    expect(result).toEqual({ sent: false, count: 0 });
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('deletes a single endpoint', () => {
    upsertPushSubscription(userId, {
      endpoint: 'https://push.example/to-delete',
      keys: { p256dh: 'k', auth: 'a' },
    });
    expect(deletePushSubscription(userId, 'https://push.example/to-delete')).toBe(true);
    expect(countPushSubscriptions(userId)).toBe(0);
  });
});
