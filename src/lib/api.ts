// Configuration de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
import { getAuthToken } from './auth';

const SENSITIVE_PATHS = ['/auth/login', '/auth/register'];

function redactSensitiveData(obj: unknown, url: string): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  const isSensitive = SENSITIVE_PATHS.some((p) => url.includes(p));
  if (!isSensitive) return obj;
  const redacted = { ...(obj as Record<string, unknown>) };
  if ('password' in redacted) redacted.password = '[REDACTED]';
  if ('email' in redacted) redacted.email = '[REDACTED]';
  return redacted;
}

function logApi(message: string, data?: unknown, url?: string): void {
  if (import.meta.env.DEV) {
    const safeData = url ? redactSensitiveData(data, url) : data;
    console.log(message, safeData ?? '');
  }
}

// Fonction utilitaire pour les appels API
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Ajouter le token d'authentification si disponible
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const bodyData = options.body ? (() => { try { return JSON.parse(options.body as string); } catch { return options.body; } })() : undefined;
  logApi(`[API] ${options.method || 'GET'} ${url}`, bodyData, url);
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  logApi(`[API] Response status: ${response.status} for ${url}`);

  if (!response.ok) {
    // Si erreur 401, supprimer le token
    if (response.status === 401) {
      const { removeAuthToken } = await import('./auth');
      removeAuthToken();
    }
    const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
    throw new Error(error.error || `Erreur HTTP: ${response.status}`);
  }

  return response.json();
}

// Méthodes HTTP
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export default api;

