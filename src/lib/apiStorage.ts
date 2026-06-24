/** Active l'API backend par défaut (désactiver avec VITE_USE_API=false). */
export const USE_API = import.meta.env.VITE_USE_API !== "false";

export function isMigrationDone(key: string): boolean {
  return localStorage.getItem(key) === "true";
}

export function markMigrationDone(key: string): void {
  localStorage.setItem(key, "true");
}

export function loadFromLocalStorage<T>(key: string, fallback: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

export function saveToLocalStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/** URL publique de l'app (bookmarklet, liens absolus). */
export function getAppOrigin(): string {
  const configured = import.meta.env.VITE_APP_URL as string | undefined;
  if (configured?.trim()) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
