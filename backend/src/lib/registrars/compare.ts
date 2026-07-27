import { checkCloudflareOffer } from './cloudflare';
import { checkHostingerOffer } from './hostinger';
import { checkOvhOffer } from './ovh';
import {
  CompareInput,
  CompareResponse,
  DomainCompareResult,
  errorOffer,
  expandDomains,
  O2SWITCH_INFO,
  RegistrarId,
  RegistrarOffer,
} from './types';

async function safeOffer(
  registrar: RegistrarId,
  fn: () => Promise<RegistrarOffer>
): Promise<RegistrarOffer> {
  try {
    return await fn();
  } catch (err) {
    return errorOffer(registrar, err instanceof Error ? err.message : 'Erreur inconnue');
  }
}

function consensusAvailable(offers: RegistrarOffer[]): boolean | null {
  const known = offers.filter(
    (o) => o.status === 'ok' && o.available !== null && o.available !== undefined
  );
  if (known.length === 0) return null;
  if (known.some((o) => o.available === true)) return true;
  if (known.every((o) => o.available === false)) return false;
  return null;
}

export async function compareDomains(input: CompareInput): Promise<CompareResponse> {
  const domains = expandDomains(input.name, input.tlds);
  if (domains.length === 0) {
    return { query: input.name, results: [] };
  }

  const results: DomainCompareResult[] = [];

  for (const domain of domains) {
    const offers = await Promise.all([
      safeOffer('cloudflare', () => checkCloudflareOffer(domain)),
      safeOffer('hostinger', () => checkHostingerOffer(domain)),
      safeOffer('ovh', () => checkOvhOffer(domain)),
    ]);

    results.push({
      domain,
      available: consensusAvailable(offers),
      offers,
      o2switch: { note: O2SWITCH_INFO.note, url: O2SWITCH_INFO.url },
    });
  }

  return {
    query: input.name.trim(),
    results,
  };
}
