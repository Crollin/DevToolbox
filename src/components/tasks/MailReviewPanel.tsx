import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Proposal {
  id: string; subject: string; sender: string; reason: string; zohoMessageId: string;
  payload: { title: string; description: string; dueDate: string | null; client?: string; priority: string; evidence: string; action: string; existingTaskId: string | null };
}
interface History { id: string; subject: string; status: string; decision: string | null; error: string | null }
const decisions: Record<string, string> = { queued: 'En attente', processing: 'Analyse en cours', failed: 'Échec', cancelled: 'Annulé', create: 'Traité', ignore: 'Sans action', review: 'À vérifier', done: 'Traité' };
function ProposalEditor({ proposal, onDone }: { proposal: Proposal; onDone: () => void }) {
  const [draft, setDraft] = useState(proposal.payload);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(accept: boolean) {
    setBusy(true); setError('');
    try {
      await api.post(`/integrations/zoho/proposals/${proposal.id}/${accept ? 'accept' : 'reject'}`, accept ? {
        title: draft.title, description: draft.description, dueDate: draft.dueDate || null, client: draft.client || '', priority: draft.priority,
      } : {});
      onDone();
    } catch (e) { setError(e instanceof Error ? e.message : 'Action impossible.'); } finally { setBusy(false); }
  }
  const label = !draft.existingTaskId ? 'Créer la tâche' : draft.action === 'complete' ? 'Confirmer la clôture' : draft.action === 'update' ? 'Appliquer la modification' : draft.action === 'followup' && draft.existingTaskId ? 'Rattacher à la tâche' : 'Créer la tâche';
  return <article className="space-y-3 border-t py-5">
    <div><p className="font-medium">{proposal.subject}</p><p className="text-sm text-muted-foreground">{proposal.sender}</p></div>
    <p className="text-sm">{proposal.reason}</p>
    {draft.evidence && <blockquote className="border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground">{draft.evidence}</blockquote>}
    <fieldset disabled={busy} className="space-y-3">
      {draft.existingTaskId && <p className="text-sm text-muted-foreground">Action sur la tâche liée : {draft.title}</p>}
      {(!['complete', 'followup'].includes(draft.action) || !draft.existingTaskId) && <>
        <div className="space-y-1"><Label htmlFor={`proposal-${proposal.id}`}>Titre</Label><Input id={`proposal-${proposal.id}`} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor={`description-${proposal.id}`}>Description</Label><textarea id={`description-${proposal.id}`} className="min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></div>
        <div className="grid gap-3 sm:grid-cols-3"><div className="space-y-1"><Label htmlFor={`date-${proposal.id}`}>Échéance facultative</Label><Input id={`date-${proposal.id}`} type="date" value={draft.dueDate || ''} onChange={e => setDraft({ ...draft, dueDate: e.target.value || null })} /></div><div className="space-y-1"><Label htmlFor={`client-${proposal.id}`}>Client</Label><Input id={`client-${proposal.id}`} value={draft.client || ''} onChange={e => setDraft({ ...draft, client: e.target.value })} /></div><div className="space-y-1"><Label htmlFor={`priority-${proposal.id}`}>Priorité</Label><select id={`priority-${proposal.id}`} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={draft.priority} onChange={e => setDraft({ ...draft, priority: e.target.value })}><option value="low">Faible</option><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></div></div>
      </>}
      <div className="flex flex-wrap gap-2"><Button onClick={() => void submit(true)} disabled={!draft.title.trim()}>{label}</Button><Button variant="outline" onClick={() => void submit(false)}>Rejeter</Button></div>
    </fieldset>
    <p className="text-xs text-muted-foreground">Référence Zoho : {proposal.zohoMessageId}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </article>;
}
export default function MailReviewPanel({ onTasksChanged }: { onTasksChanged: () => void }) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [messages, setMessages] = useState<History[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const [p, h] = await Promise.all([api.get<{ proposals: Proposal[] }>('/integrations/zoho/proposals'), api.get<{ messages: History[] }>('/integrations/zoho/messages')]);
      setProposals(p.proposals); setMessages(h.messages); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Chargement impossible.'); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 60000);
    return () => window.clearInterval(timer);
  }, [load]);
  return <details className="mb-6 rounded-xl border border-border bg-card p-4">
    <summary className="cursor-pointer font-medium">Mails Zoho · À vérifier ({proposals.length})</summary>
    <div className="mt-4 flex flex-wrap items-center gap-3"><Button size="sm" variant="outline" onClick={() => { void load(); onTasksChanged(); }}>Actualiser</Button><a className="text-sm text-primary underline" href="/account?tab=integrations">Configurer Zoho et l’analyse IA</a></div>
    {loading ? <p className="mt-3 text-sm text-muted-foreground">Chargement…</p> : !proposals.length && <p className="mt-3 text-sm text-muted-foreground">Aucune demande à vérifier.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {proposals.map(p => <ProposalEditor key={p.id} proposal={p} onDone={() => { void load(); onTasksChanged(); }} />)}
    {messages.length > 0 && <details className="mt-4 border-t pt-4"><summary className="cursor-pointer text-sm font-medium">Historique des 100 derniers messages</summary><ul className="mt-3 divide-y">{messages.map(m => <li key={m.id} className="space-y-1 py-3 text-sm"><p>{m.subject} <span className="text-muted-foreground">· {decisions[m.decision || m.status] || m.status}</span></p>{m.error && <p className="text-destructive">{m.error}</p>}{m.status === 'failed' && <Button size="sm" variant="outline" onClick={() => void api.post(`/integrations/zoho/messages/${m.id}/retry`).then(load).catch(e => setError(e instanceof Error ? e.message : 'Nouvelle tentative impossible.'))}>Réessayer</Button>}</li>)}</ul></details>}
  </details>;
}
