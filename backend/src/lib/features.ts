function parseEnvBool(value: string | undefined): boolean {
  if (value === undefined || value === '') return false;
  return value === 'true' || value === '1';
}

/** Active le module Domain Hub (comparateur, portefeuille, API /api/domains). */
export function isDomainHubEnabled(): boolean {
  return parseEnvBool(process.env.DOMAIN_HUB_ENABLED);
}
