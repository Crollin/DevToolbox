import { checkCloudflareOffers } from './cloudflare';
import { checkHostingerOffers } from './hostinger';
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
  skippedOffer,
} from './types';

const ALL_REGISTRARS: RegistrarId[] = ['cloudflare', 'hostinger', 'ovh'];

function disabledOffer(registrar: RegistrarId): RegistrarOffer {
  return skippedOffer(registrar, 'Registrar désactivé');
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

async function safeOvh(domain: string): Promise<RegistrarOffer> {
  try {
    return await checkOvhOffer(domain);
  } catch (err) {
    return errorOffer('ovh', err instanceof Error ? err.message : 'Erreur inconnue');
  }
}

export async function compareDomains(input: CompareInput): Promise<CompareResponse> {
  const domains = expandDomains(input.name, input.tlds);
  if (domains.length === 0) {
    return { query: input.name, results: [] };
  }

  const enabled = new Set(
    input.registrars && input.registrars.length > 0 ? input.registrars : ALL_REGISTRARS
  );
  const includeO2switch = input.includeO2switch ?? false;

  const [cfMap, hiMap, ovhOffers] = await Promise.all([
    enabled.has('cloudflare')
      ? checkCloudflareOffers(domains)
      : Promise.resolve(new Map<string, RegistrarOffer>()),
    enabled.has('hostinger')
      ? checkHostingerOffers(domains)
      : Promise.resolve(new Map<string, RegistrarOffer>()),
    enabled.has('ovh')
      ? Promise.all(domains.map((d) => safeOvh(d)))
      : Promise.resolve([] as RegistrarOffer[]),
  ]);

  const results: DomainCompareResult[] = domains.map((domain, index) => {
    const offers: RegistrarOffer[] = ALL_REGISTRARS.map((registrar) => {
      if (!enabled.has(registrar)) {
        return disabledOffer(registrar);
      }
      if (registrar === 'cloudflare') {
        return cfMap.get(domain) ?? errorOffer('cloudflare', 'Réponse manquante');
      }
      if (registrar === 'hostinger') {
        return hiMap.get(domain) ?? errorOffer('hostinger', 'Réponse manquante');
      }
      return ovhOffers[index] ?? errorOffer('ovh', 'Réponse manquante');
    });

    return {
      domain,
      available: consensusAvailable(offers),
      offers,
      o2switch: includeO2switch
        ? { note: O2SWITCH_INFO.note, url: O2SWITCH_INFO.url }
        : { note: '', url: O2SWITCH_INFO.url },
    };
  });

  return {
    query: input.name.trim(),
    results,
  };
}
