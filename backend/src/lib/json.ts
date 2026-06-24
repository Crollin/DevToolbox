/**
 * Parse JSON safely with a fallback value when input is invalid or empty.
 */
export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (value == null || value === '') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
