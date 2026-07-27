import { DomainCompareResult, DomainOffer, REGISTRAR_LABELS } from '@/types/domain';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

function formatPrice(value: number | null, currency: string | null): string {
  if (value === null) return '—';
  const cur = currency || 'EUR';
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur }).format(value);
  } catch {
    return `${value.toFixed(2)} ${cur}`;
  }
}

function bestRenewRegistrar(offers: DomainOffer[]): string | null {
  const ok = offers.filter(
    (o) => o.status === 'ok' && o.renewalEur !== null && o.available !== false
  );
  if (ok.length === 0) return null;
  return ok.reduce((best, cur) =>
    (cur.renewalEur ?? Infinity) < (best.renewalEur ?? Infinity) ? cur : best
  ).registrar;
}

interface CompareResultsProps {
  results: DomainCompareResult[];
}

export function CompareResults({ results }: CompareResultsProps) {
  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aucun résultat. Lancez une comparaison.</p>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((result) => {
        const best = bestRenewRegistrar(result.offers);
        return (
          <div key={result.domain} className="border border-border rounded-lg overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-muted/40 border-b border-border">
              <div>
                <h3 className="font-mono font-medium text-foreground">{result.domain}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {result.available === true && 'Disponible (au moins un registrar)'}
                  {result.available === false && 'Indisponible / déjà pris'}
                  {result.available === null && 'Disponibilité indéterminée'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="px-4 py-2 font-medium">Registrar</th>
                    <th className="px-4 py-2 font-medium">Création</th>
                    <th className="px-4 py-2 font-medium">Renouvellement</th>
                    <th className="px-4 py-2 font-medium">Renew € (tri)</th>
                    <th className="px-4 py-2 font-medium">Statut</th>
                    <th className="px-4 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {result.offers.map((offer) => (
                    <tr
                      key={offer.registrar}
                      className={cn(
                        'border-b border-border/60 last:border-0',
                        best === offer.registrar && 'bg-emerald-500/10'
                      )}
                    >
                      <td className="px-4 py-2.5 font-medium">
                        {REGISTRAR_LABELS[offer.registrar]}
                        {best === offer.registrar && (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-emerald-400">
                            meilleur renew
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono">
                        {formatPrice(offer.registration, offer.currency)}
                      </td>
                      <td className="px-4 py-2.5 font-mono">
                        {formatPrice(offer.renewal, offer.currency)}
                      </td>
                      <td className="px-4 py-2.5 font-mono">
                        {offer.renewalEur !== null
                          ? formatPrice(offer.renewalEur, 'EUR')
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {offer.status === 'ok' && (offer.message || 'OK')}
                        {offer.status === 'skipped' && (offer.message || 'Non configuré')}
                        {offer.status === 'error' && (offer.message || 'Erreur')}
                      </td>
                      <td className="px-4 py-2.5">
                        {offer.buyUrl && (
                          <a
                            href={offer.buyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Acheter <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">o2switch</td>
                    <td className="px-4 py-2.5 text-muted-foreground" colSpan={4}>
                      {result.o2switch.note}
                    </td>
                    <td className="px-4 py-2.5">
                      <a
                        href={result.o2switch.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Site <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
