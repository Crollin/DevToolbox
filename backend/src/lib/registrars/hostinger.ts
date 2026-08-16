import type { RegistrarCredentials } from '../domainHubCredentials';
import {
  errorOffer,
  RegistrarOffer,
  roundMoney,
  skippedOffer,
  toEur,
} from './types';

const HOSTINGER_API = 'https://developers.hostinger.com';

interface AvailabilityItem {
  domain?: string;
  is_available?: boolean;
  isAvailable?: boolean;
  tld?: string;
}

interface CatalogPrice {
  currency?: string;
  price?: number;
  first_period_price?: number;
}

interface CatalogItem {
  id?: string;
  name?: string;
  category?: string;
  prices?: CatalogPrice[];
  price?: number;
  currency?: string;
  metadata?: { renew_price?: number; price?: number };
}

function buyUrl(domain: string): string {
  return `https://hpanel.hostinger.com/domains/transfer-domain?domain=${encodeURIComponent(domain)}`;
}

function centsToAmount(cents: number): number {
  return roundMoney(cents / 100);
}

function pickDomainPrices(items: CatalogItem[], tld: string): { registration: number; renewal: number; currency: string } | null {
  const needle = tld.toUpperCase().replace(/^\./, '');
  const match = items.find((item) => {
    const name = (item.name || '').toUpperCase();
    return name.includes(`.${needle}`) || name.includes(needle) || name === needle;
  });

  if (!match) return null;

  const priceEntry = match.prices?.[0];
  const currency = (priceEntry?.currency || match.currency || 'EUR').toUpperCase();

  let registrationCents: number | undefined;
  let renewalCents: number | undefined;

  if (priceEntry) {
    registrationCents = priceEntry.first_period_price ?? priceEntry.price;
    renewalCents = priceEntry.price ?? priceEntry.first_period_price;
  } else if (typeof match.price === 'number') {
    registrationCents = match.price;
    renewalCents = match.metadata?.renew_price ?? match.price;
  }

  if (registrationCents === undefined || renewalCents === undefined) return null;

  return {
    registration: centsToAmount(registrationCents),
    renewal: centsToAmount(renewalCents),
    currency,
  };
}

async function fetchCatalog(token: string, tld: string): Promise<CatalogItem[]> {
  const name = `.${tld.toUpperCase()}*`;
  const url = new URL(`${HOSTINGER_API}/api/billing/v1/catalog`);
  url.searchParams.set('category', 'DOMAIN');
  url.searchParams.set('name', name);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const url2 = new URL(`${HOSTINGER_API}/api/billing/v1/catalog`);
    url2.searchParams.set('name', name);
    const res2 = await fetch(url2.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res2.ok) {
      throw new Error(`Catalog HTTP ${res.status}`);
    }
    const data2 = (await res2.json()) as CatalogItem[] | { data?: CatalogItem[] };
    return Array.isArray(data2) ? data2 : data2.data || [];
  }

  const data = (await res.json()) as CatalogItem[] | { data?: CatalogItem[] };
  return Array.isArray(data) ? data : data.data || [];
}

function buildHostingerOffer(
  domain: string,
  available: boolean | null,
  prices: { registration: number; renewal: number; currency: string } | null
): RegistrarOffer {
  if (!prices) {
    return {
      registrar: 'hostinger',
      status: available === null ? 'error' : 'ok',
      currency: null,
      registration: null,
      renewal: null,
      registrationEur: null,
      renewalEur: null,
      available,
      message: available === false ? 'Indisponible' : 'Prix catalogue introuvable pour ce TLD',
      buyUrl: buyUrl(domain),
    };
  }

  if (available === false) {
    return {
      registrar: 'hostinger',
      status: 'ok',
      currency: prices.currency,
      registration: null,
      renewal: prices.renewal,
      registrationEur: null,
      renewalEur: toEur(prices.renewal, prices.currency),
      available: false,
      message: 'Indisponible',
      buyUrl: buyUrl(domain),
    };
  }

  return {
    registrar: 'hostinger',
    status: 'ok',
    currency: prices.currency,
    registration: prices.registration,
    renewal: prices.renewal,
    registrationEur: toEur(prices.registration, prices.currency),
    renewalEur: toEur(prices.renewal, prices.currency),
    available: available ?? true,
    buyUrl: buyUrl(domain),
  };
}

/** One availability call + cached catalog per TLD. */
export async function checkHostingerOffers(
  domains: string[],
  creds: RegistrarCredentials
): Promise<Map<string, RegistrarOffer>> {
  const map = new Map<string, RegistrarOffer>();
  const token = creds.hostingerApiToken;

  if (!token) {
    const skipped = skippedOffer('hostinger', 'Token Hostinger non configuré — ajoutez-le dans Mon compte');
    for (const d of domains) map.set(d, { ...skipped });
    return map;
  }

  if (domains.length === 0) return map;

  const availabilityByDomain = new Map<string, boolean | null>();
  const tldByDomain = new Map<string, string>();
  const uniqueTlds = new Set<string>();
  let sld: string | null = null;

  for (const domain of domains) {
    const parts = domain.split('.');
    if (parts.length < 2) {
      map.set(domain, errorOffer('hostinger', 'Domaine invalide'));
      continue;
    }
    const domainSld = parts[0];
    const tld = parts.slice(1).join('.').replace(/^\./, '');
    if (sld === null) sld = domainSld;
    tldByDomain.set(domain, tld);
    uniqueTlds.add(tld);
  }

  try {
    if (sld) {
      const availRes = await fetch(`${HOSTINGER_API}/api/domains/v1/availability`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: sld, tlds: [...uniqueTlds] }),
      });

      if (availRes.ok) {
        const availJson = (await availRes.json()) as
          | AvailabilityItem[]
          | { data?: AvailabilityItem[] };
        const items = Array.isArray(availJson) ? availJson : availJson.data || [];
        for (const item of items) {
          const fqdn = (item.domain || '').toLowerCase();
          if (fqdn) {
            availabilityByDomain.set(fqdn, Boolean(item.is_available ?? item.isAvailable));
          }
        }
      }
    }

    const catalogByTld = new Map<string, CatalogItem[]>();
    await Promise.all(
      [...uniqueTlds].map(async (tld) => {
        catalogByTld.set(tld, await fetchCatalog(token, tld));
      })
    );

    for (const domain of domains) {
      if (map.has(domain)) continue;
      const tld = tldByDomain.get(domain);
      if (!tld) continue;
      const catalog = catalogByTld.get(tld) || [];
      const prices = pickDomainPrices(catalog, tld);
      const available = availabilityByDomain.get(domain.toLowerCase()) ?? null;
      map.set(domain, buildHostingerOffer(domain, available, prices));
    }
  } catch (err) {
    const offer = errorOffer('hostinger', err instanceof Error ? err.message : 'Erreur réseau');
    for (const d of domains) {
      if (!map.has(d)) map.set(d, { ...offer });
    }
  }

  return map;
}

export async function checkHostingerOffer(
  domain: string,
  creds: RegistrarCredentials
): Promise<RegistrarOffer> {
  const map = await checkHostingerOffers([domain], creds);
  return map.get(domain) ?? errorOffer('hostinger', 'Réponse vide');
}
