import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Plus, RefreshCw, Search, Pencil, Trash2, Download, Loader2 } from 'lucide-react';
import { tools } from '@/data/tools';
import ToolLayout from '@/components/ToolLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useDomainCompare } from '@/hooks/useDomainCompare';
import { useDomainPortfolio } from '@/hooks/useDomainPortfolio';
import { CompareResults } from '@/components/domain/CompareResults';
import { DomainFormModal } from '@/components/domain/DomainFormModal';
import {
  CompareSettings,
  DEFAULT_COMPARE_TLDS,
  loadCompareSettings,
  PortfolioDomain,
  PortfolioDomainInput,
  REGISTRAR_LABELS,
  BILLING_STATUS_LABELS,
  DomainBillingStatus,
  saveCompareSettings,
} from '@/types/domain';
import { toast } from '@/hooks/use-toast';
import { useDomainHubCredentials } from '@/hooks/useDomainHubCredentials';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { cn } from '@/lib/utils';

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(date);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / 86400000);
}

const DomainHub = () => {
  const navigate = useNavigate();
  const { domainHubEnabled } = useFeatureFlags();
  const {
    noRegistrarConfigured,
    loaded: credentialsLoaded,
    loadError: credentialsLoadError,
  } = useDomainHubCredentials(domainHubEnabled, { quiet: true });
  const tool = tools.find((t) => t.id === 'domain-hub')!;
  const { compare, loading: comparing, error: compareError, data, pendingLabel } = useDomainCompare();
  const {
    domains,
    isLoaded,
    addDomain,
    updateDomain,
    deleteDomain,
    syncHostinger,
    exportBillingCsv,
    updateBillingStatus,
  } = useDomainPortfolio();

  const [name, setName] = useState('');
  const [tlds, setTlds] = useState<string[]>([...DEFAULT_COMPARE_TLDS]);
  const [compareSettings, setCompareSettings] = useState<CompareSettings>(() => loadCompareSettings());
  const [search, setSearch] = useState('');
  const [payerFilter, setPayerFilter] = useState<'all' | 'agency' | 'client'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioDomain | null>(null);

  const filtered = useMemo(() => {
    return domains.filter((d) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        d.name.includes(q) ||
        (d.clientName || '').toLowerCase().includes(q) ||
        (d.notes || '').toLowerCase().includes(q);
      const matchesPayer = payerFilter === 'all' || d.payer === payerFilter;
      return matchesSearch && matchesPayer;
    });
  }, [domains, search, payerFilter]);

  const expiringSoon = domains.filter((d) => {
    const days = daysUntil(d.expiresAt);
    return days !== null && days <= 60;
  }).length;

  const toggleTld = (tld: string) => {
    setTlds((prev) =>
      prev.includes(tld) ? prev.filter((t) => t !== tld) : [...prev, tld]
    );
  };

  const toggleRegistrar = (key: keyof CompareSettings) => {
    setCompareSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveCompareSettings(next);
      return next;
    });
  };

  const handleCompare = async () => {
    if (!name.trim()) {
      toast({ title: 'Indiquez un nom de domaine', variant: 'destructive' });
      return;
    }
    if (tlds.length === 0 && !name.includes('.')) {
      toast({ title: 'Sélectionnez au moins un TLD', variant: 'destructive' });
      return;
    }
    if (!compareSettings.cloudflare && !compareSettings.hostinger && !compareSettings.ovh) {
      toast({
        title: 'Aucun registrar API actif',
        description: 'Activez au moins Cloudflare, Hostinger ou OVH.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await compare(name.trim(), tlds, compareSettings);
    } catch (err) {
      toast({
        title: 'Comparaison impossible',
        description: err instanceof Error ? err.message : 'Erreur',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async (input: PortfolioDomainInput) => {
    try {
      if (editing) {
        await updateDomain(editing.id, input);
        toast({ title: 'Domaine mis à jour' });
      } else {
        await addDomain(input);
        toast({ title: 'Domaine ajouté' });
      }
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Échec',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleDelete = async (domain: PortfolioDomain) => {
    if (!confirm(`Supprimer ${domain.name} ?`)) return;
    try {
      await deleteDomain(domain.id);
      toast({ title: 'Domaine supprimé' });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Échec',
        variant: 'destructive',
      });
    }
  };

  const handleSync = async () => {
    try {
      const result = await syncHostinger();
      toast({
        title: 'Sync Hostinger',
        description: `${result.created} créés, ${result.updated} mis à jour`,
      });
    } catch (err) {
      toast({
        title: 'Sync impossible',
        description:
          err instanceof Error
            ? err.message
            : 'Configurez votre token Hostinger dans Mon compte → Domain Hub.',
        variant: 'destructive',
      });
    }
  };

  const handleExportBilling = async () => {
    try {
      await exportBillingCsv({
        payer: payerFilter === 'all' ? 'client' : payerFilter,
        days: 60,
        billingStatus: 'pending',
      });
      toast({
        title: 'Export CSV',
        description: 'Fichier facturation téléchargé — importez-le dans votre banque ou Qonto.',
      });
    } catch (err) {
      toast({
        title: 'Export impossible',
        description: err instanceof Error ? err.message : 'Échec',
        variant: 'destructive',
      });
    }
  };

  const handleBillingStatusChange = async (domain: PortfolioDomain, status: DomainBillingStatus) => {
    try {
      await updateBillingStatus(domain.id, status);
      toast({ title: 'Statut facturation mis à jour' });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Échec',
        variant: 'destructive',
      });
    }
  };

  return (
    <ToolLayout tool={tool}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm max-w-2xl">{tool.description}</p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="rounded-md border border-border px-3 py-2">
            <span className="text-muted-foreground">Portefeuille</span>
            <div className="font-mono text-lg">{domains.length}</div>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <span className="text-muted-foreground">≤ 60 j</span>
            <div className="font-mono text-lg text-amber-400">{expiringSoon}</div>
          </div>
        </div>
      </div>

      {credentialsLoadError && (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm mb-4">
          <p>
            Impossible de vérifier les identifiants registrar. Vous pouvez quand même utiliser le
            portefeuille ; la comparaison et la sync Hostinger nécessitent des clés dans Mon compte.
          </p>
        </div>
      )}

      {credentialsLoaded && noRegistrarConfigured && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm mb-4">
          <p>
            Aucune clé registrar configurée. Ajoutez Cloudflare, Hostinger ou OVH pour comparer et
            synchroniser.
          </p>
          <Button variant="link" className="px-0" onClick={() => navigate('/account?tab=domain-hub')}>
            Configurer dans Mon compte
          </Button>
        </div>
      )}

      <Tabs defaultValue="compare">
        <TabsList>
          <TabsTrigger value="compare">Comparateur</TabsTrigger>
          <TabsTrigger value="portfolio">Portefeuille</TabsTrigger>
        </TabsList>

        <TabsContent value="compare" className="space-y-4 mt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm text-muted-foreground" htmlFor="compare-name">
                Nom (sans TLD) ou FQDN
              </label>
              <Input
                id="compare-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="acme ou acme.com"
                onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
              />
            </div>
            <Button onClick={handleCompare} disabled={comparing}>
              <Search className="w-4 h-4 mr-2" />
              {comparing ? 'Comparaison…' : 'Comparer'}
            </Button>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Registrars à interroger</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={compareSettings.cloudflare}
                  onCheckedChange={() => toggleRegistrar('cloudflare')}
                />
                Cloudflare
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={compareSettings.hostinger}
                  onCheckedChange={() => toggleRegistrar('hostinger')}
                />
                Hostinger
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={compareSettings.ovh}
                  onCheckedChange={() => toggleRegistrar('ovh')}
                />
                OVH <span className="text-xs text-muted-foreground">(plus lent)</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={compareSettings.o2switch}
                  onCheckedChange={() => toggleRegistrar('o2switch')}
                />
                o2switch <span className="text-xs text-muted-foreground">(lien manuel)</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Préférences enregistrées dans ce navigateur. Désactivez OVH si vous ne l’utilisez pas — cela accélère fortement la recherche.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {DEFAULT_COMPARE_TLDS.map((tld) => (
              <label key={tld} className="flex items-center gap-2 text-sm font-mono">
                <Checkbox
                  checked={tlds.includes(tld)}
                  onCheckedChange={() => toggleTld(tld)}
                  disabled={name.includes('.')}
                />
                .{tld}
              </label>
            ))}
          </div>

          {compareError && (
            <p className="text-sm text-destructive">{compareError}</p>
          )}

          {comparing && pendingLabel && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
              <p className="font-medium text-foreground">{pendingLabel}</p>
            </div>
          )}

          {!comparing && data && (
            <CompareResults results={data.results} showO2switch={compareSettings.o2switch} />
          )}
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2 flex-1">
              <Input
                className="max-w-xs"
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={payerFilter}
                onChange={(e) => setPayerFilter(e.target.value as typeof payerFilter)}
              >
                <option value="all">Tous les payeurs</option>
                <option value="agency">Agence</option>
                <option value="client">Client</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportBilling}>
                <Download className="w-4 h-4 mr-1" />
                Export CSV facturation
              </Button>
              <Button variant="outline" size="sm" onClick={handleSync}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Sync Hostinger
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </div>

          {!isLoaded ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Aucun domaine dans le portefeuille.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                    <th className="px-3 py-2">Domaine</th>
                    <th className="px-3 py-2">Registrar</th>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Payeur</th>
                    <th className="px-3 py-2">Expiration</th>
                    <th className="px-3 py-2">Revente</th>
                    <th className="px-3 py-2">Facturation</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => {
                    const days = daysUntil(d.expiresAt);
                    return (
                      <tr key={d.id} className="border-b border-border/50 last:border-0">
                        <td className="px-3 py-2 font-mono">{d.name}</td>
                        <td className="px-3 py-2">{REGISTRAR_LABELS[d.registrar]}</td>
                        <td className="px-3 py-2">{d.clientName || '—'}</td>
                        <td className="px-3 py-2">
                          {d.payer === 'agency' ? 'Agence' : 'Client'}
                        </td>
                        <td
                          className={cn(
                            'px-3 py-2 font-mono',
                            days !== null && days <= 30 && 'text-amber-400',
                            days !== null && days < 0 && 'text-destructive'
                          )}
                        >
                          {d.expiresAt
                            ? `${d.expiresAt.slice(0, 10)}${days !== null ? ` (${days}j)` : ''}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {d.sellYearly != null
                            ? `${d.sellYearly} ${d.currency}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                            value={d.billingStatus}
                            onChange={(e) =>
                              handleBillingStatusChange(d, e.target.value as DomainBillingStatus)
                            }
                          >
                            {(Object.keys(BILLING_STATUS_LABELS) as DomainBillingStatus[]).map(
                              (status) => (
                                <option key={status} value={status}>
                                  {BILLING_STATUS_LABELS[status]}
                                </option>
                              )
                            )}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditing(d);
                                setModalOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(d)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {modalOpen && (
        <DomainFormModal
          key={editing?.id || 'new'}
          initial={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </ToolLayout>
  );
};

export default DomainHub;
