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
    // Fallback without category filter
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

export async function checkHostingerOffer(domain: string): Promise<RegistrarOffer> {
  const token = process.env.HOSTINGER_API_TOKEN;
  if (!token) {
    return skippedOffer('hostinger', 'HOSTINGER_API_TOKEN non configuré');
  }

  const parts = domain.split('.');
  if (parts.length < 2) {
    return errorOffer('hostinger', 'Domaine invalide');
  }
  const tld = parts.slice(1).join('.');
  const sld = parts[0];

  try {
    const availRes = await fetch(`${HOSTINGER_API}/api/domains/v1/availability`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain: sld, tlds: [tld.replace(/^\./, '')] }),
    });

    let available: boolean | null = null;
    if (availRes.ok) {
      const availJson = (await availRes.json()) as
        | AvailabilityItem[]
        | { data?: AvailabilityItem[] };
      const items = Array.isArray(availJson) ? availJson : availJson.data || [];
      const hit =
        items.find((i) => (i.domain || '').toLowerCase() === domain.toLowerCase()) || items[0];
      if (hit) {
        available = Boolean(hit.is_available ?? hit.isAvailable);
      }
    }

    const catalog = await fetchCatalog(token, tld.replace(/^\./, ''));
    const prices = pickDomainPrices(catalog, tld.replace(/^\./, ''));

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
  } catch (err) {
    return errorOffer('hostinger', err instanceof Error ? err.message : 'Erreur réseau');
  }
}
