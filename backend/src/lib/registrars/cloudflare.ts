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

function buyUrl(domain: string): string {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
  if (accountId) {
    return `https://dash.cloudflare.com/${accountId}/domains/register?domain=${encodeURIComponent(domain)}`;
  }
  return `https://dash.cloudflare.com/?to=/:account/domains/register`;
}

function parseCfItem(item: CfDomainResult, domain: string): RegistrarOffer {
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
      buyUrl: buyUrl(domain),
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
    buyUrl: buyUrl(domain),
  };
}

/** Batch domain-check (max 20 domains per Cloudflare API call). */
export async function checkCloudflareOffers(domains: string[]): Promise<Map<string, RegistrarOffer>> {
  const map = new Map<string, RegistrarOffer>();
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!token || !accountId) {
    const skipped = skippedOffer('cloudflare', 'CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID non configurés');
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
      map.set(domain, item ? parseCfItem(item, domain) : errorOffer('cloudflare', 'Domaine absent de la réponse'));
    }
  } catch (err) {
    const offer = errorOffer('cloudflare', err instanceof Error ? err.message : 'Erreur réseau');
    for (const d of domains) map.set(d, { ...offer });
  }

  return map;
}

export async function checkCloudflareOffer(domain: string): Promise<RegistrarOffer> {
  const map = await checkCloudflareOffers([domain]);
  return map.get(domain) ?? errorOffer('cloudflare', 'Réponse vide');
}
