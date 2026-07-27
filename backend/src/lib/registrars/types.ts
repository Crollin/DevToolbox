export type RegistrarId = 'cloudflare' | 'hostinger' | 'ovh';

export type OfferStatus = 'ok' | 'skipped' | 'error';

export interface RegistrarOffer {
  registrar: RegistrarId;
  status: OfferStatus;
  currency: string | null;
  registration: number | null;
  renewal: number | null;
  registrationEur: number | null;
  renewalEur: number | null;
  available?: boolean | null;
  message?: string;
  buyUrl?: string;
}

export interface DomainCompareResult {
  domain: string;
  available: boolean | null;
  offers: RegistrarOffer[];
  o2switch: { note: string; url: string };
}

export interface CompareResponse {
  query: string;
  results: DomainCompareResult[];
}

export interface CompareInput {
  name: string;
  tlds?: string[];
}

export const DEFAULT_TLDS = ['com', 'fr', 'net', 'org', 'io', 'dev', 'app', 'eu'] as const;

export const O2SWITCH_INFO = {
  note: 'o2switch ne propose pas d’API registrar — vérifier manuellement dans l’espace client.',
  url: 'https://www.o2switch.fr/',
} as const;

export function getUsdEurRate(): number {
  const raw = process.env.DOMAIN_USD_EUR_RATE;
  if (!raw) return 0.92;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0.92;
}

export function toEur(amount: number | null, currency: string | null): number | null {
  if (amount === null || currency === null) return null;
  const c = currency.toUpperCase();
  if (c === 'EUR') return roundMoney(amount);
  if (c === 'USD') return roundMoney(amount * getUsdEurRate());
  return roundMoney(amount);
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function skippedOffer(registrar: RegistrarId, message: string): RegistrarOffer {
  return {
    registrar,
    status: 'skipped',
    currency: null,
    registration: null,
    renewal: null,
    registrationEur: null,
    renewalEur: null,
    available: null,
    message,
  };
}

export function errorOffer(registrar: RegistrarId, message: string): RegistrarOffer {
  return {
    registrar,
    status: 'error',
    currency: null,
    registration: null,
    renewal: null,
    registrationEur: null,
    renewalEur: null,
    available: null,
    message,
  };
}

/** Parse "acme" + tlds, or a full FQDN like "acme.com". */
export function expandDomains(name: string, tlds?: string[]): string[] {
  const trimmed = name.trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  if (!trimmed) return [];

  if (trimmed.includes('.')) {
    return [trimmed];
  }

  const list = (tlds && tlds.length > 0 ? tlds : [...DEFAULT_TLDS])
    .map((t) => t.replace(/^\./, '').toLowerCase().trim())
    .filter(Boolean)
    .slice(0, 12);

  return list.map((tld) => `${trimmed}.${tld}`);
}
