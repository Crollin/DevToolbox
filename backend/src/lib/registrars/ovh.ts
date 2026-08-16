import crypto from 'crypto';
import type { RegistrarCredentials } from '../domainHubCredentials';
import {
  errorOffer,
  RegistrarOffer,
  skippedOffer,
  toEur,
} from './types';

const OVH_API = 'https://eu.api.ovh.com/1.0';

interface OvhPrice {
  label?: string;
  price?: { currencyCode?: string; value?: number; text?: string };
}

interface OvhOffer {
  orderable?: boolean;
  action?: string;
  prices?: OvhPrice[];
}

function getSubsidiary(creds: RegistrarCredentials): string {
  return creds.ovhSubsidiary || 'FR';
}

function buyUrl(domain: string): string {
  return `https://www.ovh.com/fr/order/domain/#/web/domain/select?domain=${encodeURIComponent(domain)}`;
}

async function ovhRequest<T>(
  method: string,
  path: string,
  creds: RegistrarCredentials,
  body?: unknown
): Promise<T> {
  const appKey = creds.ovhAppKey!;
  const appSecret = creds.ovhAppSecret!;
  const consumerKey = creds.ovhConsumerKey!;

  const url = `${OVH_API}${path}`;
  const bodyStr = body !== undefined ? JSON.stringify(body) : '';

  const timeRes = await fetch(`${OVH_API}/auth/time`);
  if (!timeRes.ok) throw new Error('Impossible de récupérer l’heure OVH');
  const timestamp = String(await timeRes.json());

  const signaturePayload = `${appSecret}+${consumerKey}+${method}+${url}+${bodyStr}+${timestamp}`;
  const signature = `$1$${crypto.createHash('sha1').update(signaturePayload).digest('hex')}`;

  const headers: Record<string, string> = {
    'X-Ovh-Application': appKey,
    'X-Ovh-Timestamp': timestamp,
    'X-Ovh-Signature': signature,
    'X-Ovh-Consumer': consumerKey,
    'Content-Type': 'application/json',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: bodyStr || undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OVH HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function extractPrices(offer: OvhOffer): {
  registration: number | null;
  renewal: number | null;
  currency: string;
} {
  const prices = offer.prices || [];
  const currency =
    prices.find((p) => p.price?.currencyCode)?.price?.currencyCode || 'EUR';

  const byLabel = (label: string) =>
    prices.find((p) => (p.label || '').toUpperCase() === label)?.price?.value;

  const total = byLabel('TOTAL');
  const renew = byLabel('RENEW');
  const price = byLabel('PRICE');

  const registration =
    total !== undefined ? total : price !== undefined ? price : null;
  const renewal = renew !== undefined && renew > 0 ? renew : registration;

  return {
    registration: registration ?? null,
    renewal: renewal ?? null,
    currency,
  };
}

export async function checkOvhOffer(
  domain: string,
  creds: RegistrarCredentials
): Promise<RegistrarOffer> {
  const appKey = creds.ovhAppKey;
  const appSecret = creds.ovhAppSecret;
  const consumerKey = creds.ovhConsumerKey;

  if (!appKey || !appSecret || !consumerKey) {
    return skippedOffer('ovh', 'Clés OVH non configurées — ajoutez-les dans Mon compte');
  }

  try {
    const cart = await ovhRequest<{ cartId: string }>('POST', '/order/cart', creds, {
      ovhSubsidiary: getSubsidiary(creds),
      description: 'devtoolbox-domain-compare',
    });

    const offers = await ovhRequest<OvhOffer[]>(
      'GET',
      `/order/cart/${encodeURIComponent(cart.cartId)}/domain?domain=${encodeURIComponent(domain)}`,
      creds
    );

    // Best-effort cleanup
    try {
      await ovhRequest('DELETE', `/order/cart/${encodeURIComponent(cart.cartId)}`, creds);
    } catch {
      /* ignore */
    }

    if (!Array.isArray(offers) || offers.length === 0) {
      return {
        registrar: 'ovh',
        status: 'ok',
        currency: null,
        registration: null,
        renewal: null,
        registrationEur: null,
        renewalEur: null,
        available: false,
        message: 'Aucune offre',
        buyUrl: buyUrl(domain),
      };
    }

    const createOffer =
      offers.find((o) => o.action === 'create' && o.orderable) ||
      offers.find((o) => o.orderable) ||
      offers[0];

    const available = Boolean(createOffer.orderable);
    const { registration, renewal, currency } = extractPrices(createOffer);

    if (!available) {
      return {
        registrar: 'ovh',
        status: 'ok',
        currency: registration !== null ? currency : null,
        registration: null,
        renewal,
        registrationEur: null,
        renewalEur: toEur(renewal, currency),
        available: false,
        message: 'Indisponible',
        buyUrl: buyUrl(domain),
      };
    }

    return {
      registrar: 'ovh',
      status: 'ok',
      currency,
      registration,
      renewal,
      registrationEur: toEur(registration, currency),
      renewalEur: toEur(renewal, currency),
      available: true,
      buyUrl: buyUrl(domain),
    };
  } catch (err) {
    return errorOffer('ovh', err instanceof Error ? err.message : 'Erreur réseau');
  }
}
