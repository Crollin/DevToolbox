const TOKEN_KEY = 'devtoolbox_auth_token';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Stocker le token
export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

// Récupérer le token
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Supprimer le token
export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Vérifier si l'utilisateur est authentifié
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

// Décoder le token JWT (sans vérification, juste pour l'UI)
export function decodeToken(token: string): { userId?: string; exp?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Vérifier si le token est expiré
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

