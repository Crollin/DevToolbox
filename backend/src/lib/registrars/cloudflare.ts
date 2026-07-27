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

export async function checkCloudflareOffer(domain: string): Promise<RegistrarOffer> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!token || !accountId) {
    return skippedOffer('cloudflare', 'CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID non configurés');
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/registrar/domain-check`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domains: [domain] }),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return errorOffer('cloudflare', `HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
    }

    const json = (await res.json()) as {
      success?: boolean;
      result?: { domains?: CfDomainResult[] };
      errors?: Array<{ message?: string }>;
    };

    if (!json.success || !json.result?.domains?.length) {
      const msg = json.errors?.[0]?.message || 'Réponse Cloudflare invalide';
      return errorOffer('cloudflare', msg);
    }

    const item = json.result.domains.find((d) => d.name === domain) || json.result.domains[0];

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
  } catch (err) {
    return errorOffer('cloudflare', err instanceof Error ? err.message : 'Erreur réseau');
  }
}
