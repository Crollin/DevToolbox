import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  isAuthenticated,
  decodeToken,
  isTokenExpired,
} from '../auth';

describe('auth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('setAuthToken / getAuthToken / removeAuthToken', () => {
    it('stocke et récupère le token', () => {
      setAuthToken('my-token-123');
      expect(getAuthToken()).toBe('my-token-123');
    });

    it('supprime le token', () => {
      setAuthToken('my-token-123');
      removeAuthToken();
      expect(getAuthToken()).toBeNull();
    });

    it('getAuthToken retourne null quand aucun token', () => {
      expect(getAuthToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('retourne true quand un token existe', () => {
      setAuthToken('token');
      expect(isAuthenticated()).toBe(true);
    });

    it('retourne false quand aucun token', () => {
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('decodeToken', () => {
    it('décode un JWT valide', () => {
      // JWT avec payload { userId: "123", exp: 9999999999 } (exp dans le futur)
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJleHAiOjk5OTk5OTk5OTl9.x';
      const payload = '{"userId":"123","exp":9999999999}';
      const base64 = btoa(payload);
      const validToken = `header.${base64}.signature`;

      const decoded = decodeToken(validToken);
      expect(decoded).toEqual({ userId: '123', exp: 9999999999 });
    });

    it('retourne null pour un token invalide', () => {
      expect(decodeToken('invalid')).toBeNull();
      expect(decodeToken('')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('retourne true pour un token expiré', () => {
      const exp = Math.floor(Date.now() / 1000) - 3600; // 1h dans le passé
      const payload = JSON.stringify({ exp });
      const base64 = btoa(payload);
      const token = `header.${base64}.signature`;

      expect(isTokenExpired(token)).toBe(true);
    });

    it('retourne false pour un token non expiré', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600; // 1h dans le futur
      const payload = JSON.stringify({ exp });
      const base64 = btoa(payload);
      const token = `header.${base64}.signature`;

      expect(isTokenExpired(token)).toBe(false);
    });

    it('retourne true pour un token sans exp', () => {
      const payload = JSON.stringify({ userId: '123' });
      const base64 = btoa(payload);
      const token = `header.${base64}.signature`;

      expect(isTokenExpired(token)).toBe(true);
    });
  });
});
