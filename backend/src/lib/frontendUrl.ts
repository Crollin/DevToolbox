const DEV_DEFAULT = 'http://localhost:8080';

/**
 * URL publique du frontend pour les liens dans les e-mails.
 * Dev local Vite : 8080 | Docker : 14001 (via FRONTEND_URL)
 */
export function getFrontendUrl(): string {
  return process.env.FRONTEND_URL?.trim() || DEV_DEFAULT;
}
