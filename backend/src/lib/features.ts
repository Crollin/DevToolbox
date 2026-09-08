function parseEnvBool(value: string | undefined): boolean {
  if (value === undefined || value === '') return false;
  return value === 'true' || value === '1';
}

/** Active le module Domain Hub (comparateur, portefeuille, API /api/domains). */
export function isDomainHubEnabled(): boolean {
  return parseEnvBool(process.env.DOMAIN_HUB_ENABLED);
}

/** Active File Converter quand l’URL et la clé API Transmute sont définies. */
export function isTransmuteEnabled(): boolean {
  const baseUrl = process.env.TRANSMUTE_BASE_URL?.trim();
  const apiKey = process.env.TRANSMUTE_API_KEY?.trim();
  return Boolean(baseUrl && apiKey);
}
