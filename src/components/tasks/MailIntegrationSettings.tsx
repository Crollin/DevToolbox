import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Provider = 'openrouter' | 'deepseek';
interface AiSettings {
  provider: Provider;
  openrouter: { model: string; configured: boolean; tested: boolean };
  deepseek: { model: string; configured: boolean; tested: boolean };
}
interface Connection {
  email: string; paused: number; last_sync: number | null; last_error: string | null;
  mappings: { match: string; client: string }[]; exclusions: string[];
}
interface State { configured: boolean; aiReady: boolean; isAdmin: boolean; connection: Connection | null }
const errorText = (e: unknown) => e instanceof Error ? e.message : 'Une erreur est survenue.';

function AiMailSettings({ onChange }: { onChange: () => Promise<void> }) {
  const [config, setConfig] = useState<AiSettings | null>(null);
  const [keys, setKeys] = useState({ openrouter: '', deepseek: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [usage, setUsage] = useState<{ provider: string; model: string; inputTokens: number; outputTokens: number; cost: number | null; calls: number; errors: number }[]>([]);
  const load = useCallback(async () => {
    try {
      setError('');
      setConfig(await api.get<AiSettings>('/integrations/mail-ai'));
      setUsage((await api.get<{ usage: typeof usage }>('/integrations/mail-ai/usage')).usage);
    } catch (e) { setError(errorText(e)); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function save(testProvider?: Provider) {
    if (!config) return;
    setBusy(true); setError(''); setNotice('');
    try {
      let saved = await api.put<AiSettings>('/integrations/mail-ai', { provider: config.provider,
        openrouterModel: config.openrouter.model, deepseekModel: config.deepseek.model,
        openrouterKey: keys.openrouter || undefined, deepseekKey: keys.deepseek || undefined });
      setConfig(saved); setKeys({ openrouter: '', deepseek: '' });
      await onChange();
      if (testProvider) {
        saved = await api.post<AiSettings>('/integrations/mail-ai/test', { provider: testProvider });
        setConfig(saved);
        await onChange();
      }
      setNotice(testProvider ? 'Test réussi sur un message synthétique. Aucun mail réel transmis.' : 'Configuration enregistrée. Testez le fournisseur avant son utilisation.');
      setUsage((await api.get<{ usage: typeof usage }>('/integrations/mail-ai/usage')).usage);
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  return <Card>
    <CardHeader><CardTitle>Analyse IA des mails</CardTitle><CardDescription>Configuration de l’instance. Le fournisseur sélectionné analyse les nouveaux traitements, sans basculement automatique.</CardDescription></CardHeader>
    <CardContent className="space-y-5">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!config ? <Button variant="outline" onClick={() => void load()}>Charger la configuration</Button> : <>
        <div className="space-y-2"><Label htmlFor="mail-ai-provider">Fournisseur actif</Label>
          <select id="mail-ai-provider" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={config.provider} disabled={busy} onChange={e => setConfig({ ...config, provider: e.target.value as Provider })}>
            <option value="openrouter">Mistral via OpenRouter</option><option value="deepseek">DeepSeek Platform</option>
          </select>
        </div>
        {(['openrouter', 'deepseek'] as const).map(provider => <fieldset key={provider} disabled={busy} className="space-y-3 border-t pt-4">
          <legend className="px-1 font-medium">{provider === 'openrouter' ? 'OpenRouter' : 'DeepSeek direct'}</legend>
          <p className="text-sm text-muted-foreground">{config[provider].tested ? 'Connexion testée' : config[provider].configured ? 'Clé enregistrée · test requis' : 'Clé à renseigner'}</p>
          <div className="space-y-2"><Label htmlFor={`mail-key-${provider}`}>Clé API</Label><Input id={`mail-key-${provider}`} type="password" autoComplete="new-password" value={keys[provider]} placeholder={config[provider].configured ? 'Laisser vide pour conserver la clé' : 'Votre clé API'} onChange={e => setKeys({ ...keys, [provider]: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor={`mail-model-${provider}`}>Modèle</Label><Input id={`mail-model-${provider}`} value={config[provider].model} onChange={e => setConfig({ ...config, [provider]: { ...config[provider], model: e.target.value, tested: false } })} /></div>
          <Button type="button" variant="outline" onClick={() => void save(provider)} disabled={!config[provider].configured && !keys[provider]}>Enregistrer et tester {provider === 'openrouter' ? 'OpenRouter' : 'DeepSeek'}</Button>
        </fieldset>)}
        <Button disabled={busy} onClick={() => void save()}>{busy ? 'Vérification…' : 'Enregistrer le fournisseur actif'}</Button>
        {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
        {usage.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="py-2 text-left font-medium">Consommation cumulée, tests inclus</caption><thead><tr><th className="pr-4">Modèle</th><th className="pr-4">Tokens entrée / sortie</th><th className="pr-4">Coût déclaré (USD)</th><th>Erreurs / appels</th></tr></thead><tbody>{usage.map(u => <tr key={u.provider + u.model} className="border-t"><td className="py-2 pr-4">{u.provider} · {u.model}</td><td>{u.inputTokens} / {u.outputTokens}</td><td>{u.cost === null ? 'Non fourni' : u.cost.toFixed(4)}</td><td>{u.errors} / {u.calls}</td></tr>)}</tbody></table></div>}
      </>}
    </CardContent>
  </Card>;
}

export default function MailIntegrationSettings() {
  const { user } = useAuth();
  const [state, setState] = useState<State | null>(null);
  const [clients, setClients] = useState<string[]>([]);
  const [newClient, setNewClient] = useState('');
  const [mappings, setMappings] = useState<Connection['mappings']>([]);
  const [exclusions, setExclusions] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    const data = await api.get<State>('/integrations/zoho');
    setState(data); setMappings(data.connection?.mappings || []); setExclusions((data.connection?.exclusions || []).join('\n'));
    const [registered, existing] = await Promise.all([
      api.get<{ clients: { name: string }[] }>('/tasks/clients/list'),
      api.get<{ tasks: { client?: string | null }[] }>('/tasks'),
    ]);
    setClients([...new Set([
      ...registered.clients.map(c => c.name),
      ...existing.tasks.flatMap(task => task.client ? [task.client] : []),
    ])].sort((a, b) => a.localeCompare(b, 'fr')));
  }
  useEffect(() => { void load().catch(e => setError(errorText(e))); }, []);
  async function action(fn: () => Promise<unknown>, message = '') {
    setBusy(true); setError(''); setNotice('');
    try { await fn(); await load(); setNotice(message); } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  async function createClient() {
    const name = newClient.trim();
    if (!name) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { client } = await api.post<{ client: { name: string } }>('/tasks/clients', { name });
      setClients(previous => [...new Set([...previous, client.name])].sort((a, b) => a.localeCompare(b, 'fr')));
      setNewClient('');
      setNotice('Client créé. Sélectionnez-le dans une association, puis enregistrez les règles.');
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  const callback = new URLSearchParams(window.location.search).get('zoho');
  const connection = state?.connection;
  const save = (paused: boolean) => action(() => api.put('/integrations/zoho', { paused, mappings,
    exclusions: exclusions.split('\n').map(s => s.trim()).filter(Boolean) }), 'Réglages enregistrés.');
  return <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>Zoho Mail</CardTitle><CardDescription>Transformez les demandes reçues en tâches. Les cas incertains restent dans « À vérifier ».</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {callback === 'error' && <p role="alert" className="text-sm text-destructive">Connexion Zoho non aboutie. Vérifiez les permissions et recommencez.</p>}
        {!state ? <Button variant="outline" onClick={() => void action(load)}>Charger l’intégration</Button> : <>
          {!state.configured && <p className="text-sm text-muted-foreground">L’administrateur doit configurer l’application Zoho Europe sur le serveur avant la connexion.</p>}
          {!state.aiReady && <p className="text-sm text-muted-foreground">L’analyse est en attente : le fournisseur IA actif doit être configuré et testé.</p>}
          {connection && <div className="space-y-1 text-sm"><p className="font-medium">{connection.email} · {connection.paused ? 'En pause' : 'Connectée'}</p><p className="text-muted-foreground">Dernière collecte : {connection.last_sync ? new Date(connection.last_sync).toLocaleString('fr-FR') : 'En attente'}</p>{connection.last_error && <p role="alert" className="text-destructive">{connection.last_error}</p>}</div>}
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy || !state.configured} onClick={() => void action(async () => { const data = await api.post<{ url: string }>('/integrations/zoho/connect'); window.location.assign(data.url); })}>{connection ? 'Réautoriser Zoho' : 'Connecter Zoho Mail (.eu)'}</Button>
            {connection && <><Button variant="outline" disabled={busy} onClick={() => void save(!connection.paused)}>{connection.paused ? 'Reprendre' : 'Mettre en pause'}</Button><Button variant="destructive" disabled={busy} onClick={() => { if (window.confirm('Déconnecter Zoho et arrêter les imports ? Les tâches créées seront conservées.')) void action(() => api.delete('/integrations/zoho'), 'Boîte déconnectée.'); }}>Déconnecter</Button></>}
          </div>
          {connection && <fieldset disabled={busy} className="space-y-4 border-t pt-4">
            <div className="space-y-2"><Label htmlFor="zoho-exclusions">Expéditeurs ou domaines à exclure</Label><textarea id="zoho-exclusions" className="min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm" value={exclusions} onChange={e => setExclusions(e.target.value)} placeholder={'newsletter@exemple.fr\nexemple.org'} /><p className="text-xs text-muted-foreground">Une adresse ou un domaine par ligne.</p></div>
            <div className="space-y-3"><p className="text-sm font-medium">Associer les expéditeurs à vos clients</p>
              <p className="text-xs text-muted-foreground">Cette liste reprend les clients de Task Reminder, y compris ceux déjà associés à vos tâches. Un client créé ici sera aussi disponible dans Task Reminder.</p>
              {clients.length === 0 && <p role="status" className="text-sm text-muted-foreground">Aucun client enregistré dans Task Reminder. Créez votre premier client ci-dessous pour pouvoir le sélectionner.</p>}
              <div className="space-y-2"><Label htmlFor="zoho-new-client">Nouveau client</Label><div className="flex flex-col gap-2 sm:flex-row"><Input id="zoho-new-client" maxLength={200} value={newClient} onChange={e => setNewClient(e.target.value)} placeholder="Nom du client" /><Button type="button" variant="outline" disabled={busy || !newClient.trim()} onClick={() => void createClient()}>Créer le client</Button></div></div>{mappings.map((mapping, index) => <div key={index} className="flex flex-col gap-2 sm:flex-row"><Input aria-label={`Adresse ou domaine ${index + 1}`} value={mapping.match} onChange={e => setMappings(mappings.map((m, i) => i === index ? { ...m, match: e.target.value } : m))} placeholder="client@exemple.fr ou exemple.fr" /><select disabled={clients.length === 0} aria-label={`Client ${index + 1}`} className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={mapping.client} onChange={e => setMappings(mappings.map((m, i) => i === index ? { ...m, client: e.target.value } : m))}><option value="">{clients.length === 0 ? 'Aucun client disponible' : 'Choisir un client'}</option>{clients.map(c => <option key={c}>{c}</option>)}</select><Button variant="ghost" onClick={() => setMappings(mappings.filter((_, i) => i !== index))}>Retirer</Button></div>)}<Button variant="outline" onClick={() => setMappings([...mappings, { match: '', client: '' }])}>Ajouter une association</Button></div>
            <Button onClick={() => void save(Boolean(connection.paused))}>Enregistrer les règles</Button>
          </fieldset>}
          {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
        </>}
      </CardContent>
    </Card>
    {state && (state.isAdmin ? <AiMailSettings onChange={async () => setState(await api.get<State>('/integrations/zoho'))} /> : <Card>
      <CardHeader><CardTitle>Analyse IA des mails</CardTitle><CardDescription>La connexion Zoho et la connexion au fournisseur IA se configurent séparément.</CardDescription></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{state.aiReady ? 'Le fournisseur IA est prêt.' : 'Le fournisseur IA doit encore être configuré et testé.'} Les clés OpenRouter et DeepSeek sont gérées par un administrateur de l’instance.</p>
        <details className="space-y-2">
          <summary className="cursor-pointer font-medium">Vous gérez cette instance ?</summary>
          <p>Dans les variables du backend sur Coolify, ajoutez votre identifiant à <code>MAIL_ADMIN_USER_IDS</code> (séparez plusieurs identifiants par des virgules), puis redéployez et rechargez cette page.</p>
          {user?.id && <p>Votre identifiant : <code className="break-all select-all">{user.id}</code></p>}
          <p>Vous pourrez alors saisir la clé API OpenRouter ou DeepSeek, choisir le modèle et utiliser « Enregistrer et tester », puis enregistrer le fournisseur actif.</p>
        </details>
      </CardContent>
    </Card>)}
  </div>;
}
