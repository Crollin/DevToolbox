import assert from 'node:assert/strict';
import test from 'node:test';
import { updateTask, type Task } from './api.js';

test('updateTask sends only the fields provided by the MCP update', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalApiUrl = process.env.DEVTOOLBOX_API_URL;
  const originalPat = process.env.DEVTOOLBOX_PAT;
  const requests: Array<{ method: string; body?: string }> = [];
  const updated: Task = {
    id: '1b4bc6ac-86fd-45c8-a46f-f5c5db115ea3',
    title: 'Nouveau titre',
    description: 'Contexte à conserver',
    dueDate: '2026-11-15',
    client: 'Client Exemple',
    link: 'https://example.com/tache',
    tags: ['urgent'],
    priority: 'high',
    notificationChannels: ['email'],
    status: 'pending',
    reminderDays: [7, 1],
    reminderDatetime: '2026-11-14T09:00:00.000Z',
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-20T09:00:00.000Z',
  };

  process.env.DEVTOOLBOX_API_URL = 'https://devtoolbox.test/api';
  process.env.DEVTOOLBOX_PAT = 'test-token';
  globalThis.fetch = async (_input, init) => {
    const method = init?.method ?? 'GET';
    requests.push({ method, body: init?.body?.toString() });

    return new Response(
      JSON.stringify({ task: updated }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalApiUrl === undefined) delete process.env.DEVTOOLBOX_API_URL;
    else process.env.DEVTOOLBOX_API_URL = originalApiUrl;
    if (originalPat === undefined) delete process.env.DEVTOOLBOX_PAT;
    else process.env.DEVTOOLBOX_PAT = originalPat;
  });

  await updateTask(updated.id, { title: 'Nouveau titre' });

  assert.deepEqual(requests.map(({ method }) => method), ['PATCH']);
  assert.deepEqual(JSON.parse(requests[0].body ?? ''), { title: 'Nouveau titre' });
});
