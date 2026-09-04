import type { RegistrarCredentials } from '../domainHubCredentials';
import {
  errorOffer,
  RegistrarOffer,
  skippedOffer,
  toEur,
} from './types';

interface CfDomainResult {
  name: string;
  registrable: boolean;
  tier?: string;
  reason?: string;
  pricing?: {
    currency: string;
    registration_cost: string;
    renewal_cost: string;
  };
}

function buyUrl(domain: string, accountId: string | null): string {
  if (accountId) {
    return `https://dash.cloudflare.com/${accountId}/domains/register?domain=${encodeURIComponent(domain)}`;
  }
  return `https://dash.cloudflare.com/?to=/:account/domains/register`;
}

function parseCfItem(item: CfDomainResult, domain: string, accountId: string | null): RegistrarOffer {
  if (!item.registrable || !item.pricing) {
    return {
      registrar: 'cloudflare',
      status: 'ok',
      currency: null,
      registration: null,
      renewal: null,
      registrationEur: null,
      renewalEur: null,
      available: false,
      message: item.reason || 'Indisponible',
      buyUrl: buyUrl(domain, accountId),
    };
  }

  const registration = Number(item.pricing.registration_cost);
  const renewal = Number(item.pricing.renewal_cost);
  const currency = item.pricing.currency || 'USD';

  return {
    registrar: 'cloudflare',
    status: 'ok',
    currency,
    registration,
    renewal,
    registrationEur: toEur(registration, currency),
    renewalEur: toEur(renewal, currency),
    available: true,
    buyUrl: buyUrl(domain, accountId),
  };
}

/** Batch domain-check (max 20 domains per Cloudflare API call). */
export async function checkCloudflareOffers(
  domains: string[],
  creds: RegistrarCredentials
): Promise<Map<string, RegistrarOffer>> {
  const map = new Map<string, RegistrarOffer>();
  const token = creds.cloudflareApiToken;
  const accountId = creds.cloudflareAccountId;

  if (!token || !accountId) {
    const skipped = skippedOffer('cloudflare', 'Clés Cloudflare non configurées — ajoutez-les dans Mon compte');
    for (const d of domains) map.set(d, { ...skipped });
    return map;
  }

  if (domains.length === 0) return map;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/registrar/domain-check`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domains }),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = errorOffer('cloudflare', `HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
      for (const d of domains) map.set(d, { ...err });
      return map;
    }

    const json = (await res.json()) as {
      success?: boolean;
      result?: { domains?: CfDomainResult[] };
      errors?: Array<{ message?: string }>;
    };

    if (!json.success || !json.result?.domains) {
      const msg = json.errors?.[0]?.message || 'Réponse Cloudflare invalide';
      const err = errorOffer('cloudflare', msg);
      for (const d of domains) map.set(d, { ...err });
      return map;
    }

    const byName = new Map(
      json.result.domains.map((d) => [d.name.toLowerCase(), d] as const)
    );

    for (const domain of domains) {
      const item = byName.get(domain.toLowerCase());
      map.set(domain, item ? parseCfItem(item, domain, accountId) : errorOffer('cloudflare', 'Domaine absent de la réponse'));
    }
  } catch (err) {
    const offer = errorOffer('cloudflare', err instanceof Error ? err.message : 'Erreur réseau');
    for (const d of domains) map.set(d, { ...offer });
  }

  return map;
}

export async function checkCloudflareOffer(
  domain: string,
  creds: RegistrarCredentials
): Promise<RegistrarOffer> {
  const map = await checkCloudflareOffers([domain], creds);
  return map.get(domain) ?? errorOffer('cloudflare', 'Réponse vide');
}

export type CloudflareRegistrarDomain = {
  name: string;
  expiresAt: string | null;
  externalId: string | null;
};

interface CfRegistrarDomainItem {
  id?: string;
  name?: string;
  expires_at?: string | null;
  current_registrar?: string | null;
}

function resolveRegistrarDomainName(item: CfRegistrarDomainItem): string | null {
  const fromName = (item.name || '').trim().toLowerCase();
  if (fromName.includes('.')) return fromName;
  const fromId = (item.id || '').trim().toLowerCase();
  if (fromId.includes('.')) return fromId;
  return null;
}

function isCloudflareRegistrar(value: string | null | undefined): boolean {
  return (value || '').toLowerCase().includes('cloudflare');
}

/**
 * Liste les domaines du portefeuille Cloudflare Registrar (pagination).
 * Filtre current_registrar contenant "cloudflare".
 */
export async function listCloudflareRegistrarDomains(
  creds: RegistrarCredentials
): Promise<CloudflareRegistrarDomain[]> {
  const token = creds.cloudflareApiToken;
  const accountId = creds.cloudflareAccountId;

  if (!token || !accountId) {
    throw new Error('Clés Cloudflare non configurées — ajoutez-les dans Mon compte → Domain Hub');
  }

  const domains: CloudflareRegistrarDomain[] = [];
  let page = 1;
  const perPage = 50;

  for (;;) {
    const url = new URL(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/registrar/domains`
    );
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(perPage));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
    }

    const json = (await res.json()) as {
      success?: boolean;
      result?: CfRegistrarDomainItem[];
      errors?: Array<{ message?: string }>;
      result_info?: {
        page?: number;
        per_page?: number;
        total_count?: number;
        count?: number;
      };
    };

    if (!json.success || !Array.isArray(json.result)) {
      const msg = json.errors?.[0]?.message || 'Réponse Cloudflare invalide';
      throw new Error(msg);
    }

    for (const item of json.result) {
      if (!isCloudflareRegistrar(item.current_registrar)) continue;
      const name = resolveRegistrarDomainName(item);
      if (!name) continue;
      domains.push({
        name,
        expiresAt: item.expires_at || null,
        externalId: item.id != null ? String(item.id) : null,
      });
    }

    const info = json.result_info;
    const total = info?.total_count;
    if (total != null && page * (info?.per_page ?? perPage) >= total) break;
    if (json.result.length < perPage) break;
    page += 1;
    if (page > 100) break;
  }

  return domains;
}
