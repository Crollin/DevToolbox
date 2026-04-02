import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setAuthToken, removeAuthToken } from '../auth';
import { api } from '../api';

describe('api', () => {
  beforeEach(() => {
    removeAuthToken();
    vi.clearAllMocks();
  });

  it('api.get existe et est une fonction', () => {
    expect(typeof api.get).toBe('function');
  });

  it('api.post existe et est une fonction', () => {
    expect(typeof api.post).toBe('function');
  });

  it('api.put existe et est une fonction', () => {
    expect(typeof api.put).toBe('function');
  });

  it('api.delete existe et est une fonction', () => {
    expect(typeof api.delete).toBe('function');
  });

  it('api.patch existe et est une fonction', () => {
    expect(typeof api.patch).toBe('function');
  });

  it('envoie une requête GET avec fetch', async () => {
    const mockJson = vi.fn().mockResolvedValue({ data: 'test' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: mockJson,
      status: 200,
    });

    const result = await api.get<{ data: string }>('/test-endpoint');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual({ data: 'test' });
  });

  it('ajoute le header Authorization quand un token existe', async () => {
    setAuthToken('my-jwt-token');
    const mockJson = vi.fn().mockResolvedValue({});
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: mockJson, status: 200 });

    await api.get('/auth/me');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-jwt-token',
        }),
      })
    );
  });
});
