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
  HostingResource,
  HOSTING_KIND_LABELS,
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

function formatExpiryDate(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
    resources,
    isLoaded,
    addDomain,
    updateDomain,
    deleteDomain,
    updateResource,
    deleteResource,
    syncHostinger,
    exportBillingCsv,
    updateBillingStatus,
    updateResourceBillingStatus,
  } = useDomainPortfolio();

  const [name, setName] = useState('');
  const [tlds, setTlds] = useState<string[]>([...DEFAULT_COMPARE_TLDS]);
  const [compareSettings, setCompareSettings] = useState<CompareSettings>(() => loadCompareSettings());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'domain' | 'vps' | 'hosting'>('all');
  const [payerFilter, setPayerFilter] = useState<'all' | 'agency' | 'client'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioDomain | null>(null);
  const [editingResource, setEditingResource] = useState<HostingResource | null>(null);

  const clientOptions = useMemo(() => {
    const names = new Set<string>();
    for (const d of domains) {
      const n = d.clientName?.trim();
      if (n) names.add(n);
    }
    for (const r of resources) {
      const n = r.clientName?.trim();
      if (n) names.add(n);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [domains, resources]);

  type PortfolioRow =
    | { rowType: 'domain'; item: PortfolioDomain }
    | { rowType: 'resource'; item: HostingResource };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows: PortfolioRow[] = [];

    if (typeFilter === 'all' || typeFilter === 'domain') {
      for (const d of domains) {
        const matchesSearch =
          !q ||
          d.name.includes(q) ||
          (d.clientName || '').toLowerCase().includes(q) ||
          (d.notes || '').toLowerCase().includes(q);
        const matchesPayer = payerFilter === 'all' || d.payer === payerFilter;
        const matchesClient =
          clientFilter === 'all' ||
          (clientFilter === '__none__' ? !d.clientName?.trim() : d.clientName === clientFilter);
        if (matchesSearch && matchesPayer && matchesClient) {
          rows.push({ rowType: 'domain', item: d });
        }
      }
    }

    if (typeFilter === 'all' || typeFilter === 'vps' || typeFilter === 'hosting') {
      for (const r of resources) {
        if (typeFilter !== 'all' && r.kind !== typeFilter) continue;
        const hay = [r.label, r.plan, r.hostname, r.ipv4, r.clientName, r.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const matchesSearch = !q || hay.includes(q);
        const matchesPayer = payerFilter === 'all' || r.payer === payerFilter;
        const matchesClient =
          clientFilter === 'all' ||
          (clientFilter === '__none__' ? !r.clientName?.trim() : r.clientName === clientFilter);
        if (matchesSearch && matchesPayer && matchesClient) {
          rows.push({ rowType: 'resource', item: r });
        }
      }
    }

    return rows;
  }, [domains, resources, search, typeFilter, payerFilter, clientFilter]);

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

  const handleDeleteResource = async (resource: HostingResource) => {
    if (!confirm(`Supprimer ${resource.label} ?`)) return;
    try {
      await deleteResource(resource.id);
      toast({ title: 'Ressource supprimée' });
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
      const parts = [
        `Domaines: ${result.domains.created}+ / ${result.domains.updated}↑`,
        `VPS: ${result.vps.created}+ / ${result.vps.updated}↑`,
        `Hébergement: ${result.hosting.created}+ / ${result.hosting.updated}↑`,
      ];
      const errors = [result.domains.error, result.vps.error, result.hosting.error]
        .filter(Boolean)
        .join(' · ');
      toast({
        title: 'Sync Hostinger',
        description: errors ? `${parts.join(' · ')} (${errors})` : parts.join(' · '),
        variant: errors ? 'destructive' : 'default',
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

  const handleResourceBillingChange = async (
    resource: HostingResource,
    status: DomainBillingStatus
  ) => {
    try {
      await updateResourceBillingStatus(resource.id, status);
      toast({ title: 'Statut facturation mis à jour' });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Échec',
        variant: 'destructive',
      });
    }
  };

  const handleSaveResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingResource) return;
    const form = new FormData(e.currentTarget);
    try {
      await updateResource(editingResource.id, {
        label: String(form.get('label') || editingResource.label),
        clientName: String(form.get('clientName') || '') || null,
        payer: (form.get('payer') as 'agency' | 'client') || editingResource.payer,
        sellYearly: form.get('sellYearly')
          ? Number(form.get('sellYearly'))
          : null,
        notes: String(form.get('notes') || '') || null,
      });
      toast({ title: 'Ressource mise à jour' });
      setEditingResource(null);
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
            <div className="font-mono text-lg">{domains.length + resources.length}</div>
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
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              >
                <option value="all">Tous les types</option>
                <option value="domain">Domaines</option>
                <option value="vps">VPS</option>
                <option value="hosting">Hébergement</option>
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={payerFilter}
                onChange={(e) => setPayerFilter(e.target.value as typeof payerFilter)}
              >
                <option value="all">Tous les payeurs</option>
                <option value="agency">Agence</option>
                <option value="client">Client</option>
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="all">Tous les clients</option>
                <option value="__none__">Sans client</option>
                {clientOptions.map((clientName) => (
                  <option key={clientName} value={clientName}>
                    {clientName}
                  </option>
                ))}
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
                Ajouter domaine
              </Button>
            </div>
          </div>

          {!isLoaded ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Aucun élément dans le portefeuille. Lancez Sync Hostinger pour importer domaines, VPS et hébergements.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Nom</th>
                    <th className="px-3 py-2">Détail</th>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Payeur</th>
                    <th className="px-3 py-2">Expiration</th>
                    <th className="px-3 py-2">Revente</th>
                    <th className="px-3 py-2">Facturation</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    if (row.rowType === 'domain') {
                      const d = row.item;
                      const days = daysUntil(d.expiresAt);
                      const expiryLabel = formatExpiryDate(d.expiresAt);
                      return (
                        <tr
                          key={`domain-${d.id}`}
                          className="border-b border-border/40 last:border-0 odd:bg-muted/25 even:bg-transparent hover:bg-muted/40 transition-colors"
                        >
                          <td className="px-3 py-2 text-xs text-muted-foreground">Domaine</td>
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
                            {expiryLabel
                              ? `${expiryLabel}${days !== null ? ` (${days}j)` : ''}`
                              : '—'}
                          </td>
                          <td className="px-3 py-2 font-mono">
                            {d.sellYearly != null ? `${d.sellYearly} ${d.currency}` : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <select
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                              value={d.billingStatus}
                              onChange={(e) =>
                                handleBillingStatusChange(
                                  d,
                                  e.target.value as DomainBillingStatus
                                )
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
                    }

                    const r = row.item;
                    const detail = [r.plan, r.hostname, r.ipv4, r.state]
                      .filter(Boolean)
                      .join(' · ');
                    return (
                      <tr
                        key={`resource-${r.id}`}
                        className="border-b border-border/40 last:border-0 odd:bg-muted/25 even:bg-transparent hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {HOSTING_KIND_LABELS[r.kind]}
                        </td>
                        <td className="px-3 py-2 font-medium">{r.label}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{detail || '—'}</td>
                        <td className="px-3 py-2">{r.clientName || '—'}</td>
                        <td className="px-3 py-2">
                          {r.payer === 'agency' ? 'Agence' : 'Client'}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {formatExpiryDate(r.expiresAt) || '—'}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {r.sellYearly != null ? `${r.sellYearly} ${r.currency}` : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                            value={r.billingStatus}
                            onChange={(e) =>
                              handleResourceBillingChange(
                                r,
                                e.target.value as DomainBillingStatus
                              )
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
                              onClick={() => setEditingResource(r)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteResource(r)}
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

      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <form
            onSubmit={handleSaveResource}
            className="w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-4 shadow-xl"
          >
            <h3 className="font-semibold">Éditer {HOSTING_KIND_LABELS[editingResource.kind]}</h3>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Libellé</label>
              <Input name="label" defaultValue={editingResource.label} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Client</label>
              <Input name="clientName" defaultValue={editingResource.clientName || ''} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Payeur</label>
              <select
                name="payer"
                defaultValue={editingResource.payer}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="agency">Agence</option>
                <option value="client">Client</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Revente annuelle</label>
              <Input
                name="sellYearly"
                type="number"
                step="0.01"
                defaultValue={editingResource.sellYearly ?? ''}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Notes</label>
              <Input name="notes" defaultValue={editingResource.notes || ''} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingResource(null)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </div>
      )}
    </ToolLayout>
  );
};

export default DomainHub;
