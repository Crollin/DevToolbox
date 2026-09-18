import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import MailIntegrationSettings from '../MailIntegrationSettings';

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'staging-user' } }) }));

let container: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  vi.clearAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.mocked(api.get).mockImplementation(async (path) => path === '/tasks/clients/list' ? { clients: [] } : {
    configured: true, aiReady: false, isAdmin: false,
    connection: { email: 'test@example.fr', paused: 0, last_sync: null, last_error: null,
      mappings: [{ match: 'example.fr', client: '' }], exclusions: [] },
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<MailIntegrationSettings />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

it('explains missing AI administrator access without exposing credential inputs', () => {
  expect(container.textContent).toContain('MAIL_ADMIN_USER_IDS');
  expect(container.textContent).toContain('staging-user');
  expect(container.querySelector('input[type="password"]')).toBeNull();
});

it('creates a selectable client without clearing the unsaved association', async () => {
  const select = container.querySelector('select')!;
  expect(select.disabled).toBe(true);
  expect(container.textContent).toContain('Aucun client enregistré');
  vi.mocked(api.post).mockResolvedValue({ client: { name: 'Acme' } });
  const input = container.querySelector<HTMLInputElement>('#zoho-new-client')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Acme');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const button = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Créer le client')!;
  await act(async () => button.click());
  expect(api.post).toHaveBeenCalledWith('/tasks/clients', { name: 'Acme' });
  expect(select.disabled).toBe(false);
  expect(Array.from(select.options).map(option => option.value)).toContain('Acme');
  expect(container.querySelector<HTMLInputElement>('[aria-label="Adresse ou domaine 1"]')!.value).toBe('example.fr');
  await act(async () => {
    select.value = 'Acme';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await act(async () => Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Enregistrer les règles')!.click());
  expect(api.put).toHaveBeenCalledWith('/integrations/zoho', {
    paused: false, mappings: [{ match: 'example.fr', client: 'Acme' }], exclusions: [],
  });
});
