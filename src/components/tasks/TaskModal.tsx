import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Link, List, Eye, Pencil, X, Plus } from "lucide-react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { Task, CreateTaskInput } from "@/types/task";
import api from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Channel = 'ntfy' | 'email' | 'telegram';
const CHANNELS: Array<{ id: Channel; label: string }> = [
  { id: 'email', label: 'Email' }, { id: 'telegram', label: 'Telegram' }, { id: 'ntfy', label: 'Ntfy' },
];
const PRIORITIES = [{ id: 'low', label: 'Faible' }, { id: 'normal', label: 'Normale' }, { id: 'high', label: 'Haute' }, { id: 'urgent', label: 'Urgente' }] as const;

export interface ClientInfo { id: string; name: string; color: string | null; }

export const CLIENT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
] as const;

interface TaskModalProps { isOpen: boolean; onClose: () => void; onSave: (task: CreateTaskInput) => void; editTask?: Task | null; }

const fieldClass = "w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

const TaskModal = ({ isOpen, onClose, onSave, editTask }: TaskModalProps) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  const [preview, setPreview] = useState(false); const [dueDate, setDueDate] = useState("");
  const [client, setClient] = useState(""); const [clientList, setClientList] = useState<ClientInfo[]>([]); const [newClient, setNewClient] = useState("");
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const [link, setLink] = useState(""); const [tags, setTags] = useState<string[]>([]); const [tagInput, setTagInput] = useState("");
  const [priority, setPriority] = useState<CreateTaskInput['priority']>('normal');
  const [notificationChannels, setNotificationChannels] = useState<Channel[]>([]);
  const [reminderDays, setReminderDays] = useState<number[]>([]); const [reminderDatetime, setReminderDatetime] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    api.get<{ clients: ClientInfo[] }>('/tasks/clients/list').then((data) => setClientList(data.clients)).catch(() => undefined);
    if (editTask) {
      setTitle(editTask.title); setDescription(editTask.description || ""); setDueDate(editTask.dueDate.split('T')[0]); setClient(editTask.client || "");
      setLink(editTask.link || ""); setTags(editTask.tags || []); setPriority(editTask.priority || 'normal'); setNotificationChannels(editTask.notificationChannels || []);
      setReminderDays(editTask.reminderDays || []); setReminderDatetime(editTask.reminderDatetime ? new Date(editTask.reminderDatetime).toISOString().slice(0, 16) : "");
    } else {
      setTitle(""); setDescription(""); const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); setDueDate(tomorrow.toISOString().split('T')[0]);
      setClient(""); setLink(""); setTags([]); setPriority('normal'); setReminderDays([]); setReminderDatetime("");
      api.get<{ notificationChannels?: Channel[] }>('/account/ntfy-config').then((data) => {
        setNotificationChannels(data.notificationChannels?.filter((c): c is Channel => ['ntfy', 'email', 'telegram'].includes(c)) || []);
      }).catch(() => setNotificationChannels([]));
    }
    setPreview(false); setTagInput(""); setNewClient("");
  }, [editTask, isOpen]);

  const insertMarkdown = (before: string, after = before) => {
    const editor = editorRef.current; if (!editor) return;
    const start = editor.selectionStart; const end = editor.selectionEnd; const selected = description.slice(start, end) || 'texte';
    setDescription(description.slice(0, start) + before + selected + after + description.slice(end));
    requestAnimationFrame(() => { editor.focus(); editor.setSelectionRange(start + before.length, start + before.length + selected.length); });
  };
  const addTag = () => { const value = tagInput.trim().replace(/^#/, ''); if (value && !tags.includes(value)) setTags([...tags, value]); setTagInput(""); };
  const addClient = async () => { const value = newClient.trim(); if (!value) return; try { const res = await api.post<{ client: ClientInfo }>('/tasks/clients', { name: value }); setClientList((current) => [...current, res.client].sort((a, b) => a.name.localeCompare(b.name))); setClient(value); setNewClient(""); } catch { /* un client existant peut être sélectionné */ } };
  const updateClientColor = async (clientId: string, color: string) => {
    try {
      await api.put(`/tasks/clients/${clientId}`, { color });
      setClientList((current) => current.map((c) => c.id === clientId ? { ...c, color } : c));
    } catch { /* silently fail */ }
    setColorPickerFor(null);
  };
  const getClientColor = (name: string) => clientList.find((c) => c.name === name)?.color || null;
  const toggle = (channel: Channel) => setNotificationChannels((current) => current.includes(channel) ? current.filter((c) => c !== channel) : [...current, channel]);
  const submit = (event: React.FormEvent) => { event.preventDefault(); onSave({ title, description: description || undefined, dueDate: new Date(dueDate).toISOString(), client: client || undefined, link: link || undefined, tags, priority, notificationChannels: notificationChannels.length ? notificationChannels : undefined, reminderDays: reminderDays.length ? reminderDays : undefined, reminderDatetime: reminderDatetime ? new Date(reminderDatetime).toISOString() : undefined }); onClose(); };
  if (!isOpen) return null;
  const PreviewIcon = preview ? Pencil : Eye;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} /><div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card shadow-xl">
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 p-5 backdrop-blur"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Rappel de travail</p><h2 className="text-xl font-semibold">{editTask ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button></div>
    <form onSubmit={submit} className="space-y-5 p-5"><div><Label>Titre de la tâche *</Label><input className={fieldClass + " mt-1.5 text-base"} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex. Valider la maquette d'accueil" /></div>
      <div><div className="mb-1.5 flex items-center justify-between"><Label>Description</Label><div className="flex gap-1 rounded-md border border-border bg-muted/50 p-1"><button type="button" onClick={() => insertMarkdown('**')} title="Gras" className="rounded p-1.5 hover:bg-background"><Bold className="h-3.5 w-3.5" /></button><button type="button" onClick={() => insertMarkdown('*')} title="Italique" className="rounded p-1.5 hover:bg-background"><Italic className="h-3.5 w-3.5" /></button><button type="button" onClick={() => insertMarkdown('- ', '')} title="Liste" className="rounded p-1.5 hover:bg-background"><List className="h-3.5 w-3.5" /></button><button type="button" onClick={() => insertMarkdown('[', '](https://)')} title="Lien" className="rounded p-1.5 hover:bg-background"><Link className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setPreview(!preview)} title="Prévisualiser" className="rounded p-1.5 hover:bg-background"><PreviewIcon className="h-3.5 w-3.5" /></button></div></div>{preview ? <div className="prose prose-sm min-h-[130px] max-w-none rounded-lg border border-border bg-input p-3 dark:prose-invert" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(description || '_Aucune description_') as string) }} /> : <textarea ref={editorRef} className={fieldClass + " min-h-[140px] resize-y font-mono text-sm"} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes, contexte, checklist… Markdown accepté." />}</div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label>Date d'échéance *</Label><input className={fieldClass + " mt-1.5"} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required /></div><div><Label>Priorité</Label><select className={fieldClass + " mt-1.5"} value={priority} onChange={(e) => setPriority(e.target.value as CreateTaskInput['priority'])}>{PRIORITIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div></div>
      <div><Label>Client</Label><div className="mt-1.5 flex gap-2 items-center">{client && getClientColor(client) && <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: getClientColor(client)! }} />}<select className={fieldClass} value={client} onChange={(e) => setClient(e.target.value)}><option value="">Sans client</option>{clientList.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select>{client && (() => { const ci = clientList.find((c) => c.name === client); return ci ? <div className="relative"><button type="button" onClick={() => setColorPickerFor(colorPickerFor === ci.id ? null : ci.id)} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted shrink-0" title="Couleur du client"><span className="h-3.5 w-3.5 rounded-full border border-border/50" style={{ backgroundColor: ci.color || '#6b7280' }} /></button>{colorPickerFor === ci.id && <div className="absolute right-0 top-10 z-20 flex gap-1.5 rounded-lg border border-border bg-card p-2 shadow-lg">{CLIENT_COLORS.map((color) => <button key={color} type="button" onClick={() => updateClientColor(ci.id, color)} className="h-5 w-5 rounded-full border border-border/50 transition-transform hover:scale-125" style={{ backgroundColor: color }} />)}</div>}</div> : null; })()}<input className={fieldClass} value={newClient} onChange={(e) => setNewClient(e.target.value)} placeholder="Nouveau client" /><button type="button" onClick={addClient} className="rounded-lg border border-border px-3 hover:bg-muted" title="Ajouter le client"><Plus className="h-4 w-4" /></button></div></div>
      <div><Label>Tags</Label><div className="mt-1.5 flex flex-wrap gap-2 rounded-lg border border-border bg-input p-2">{tags.map((tag) => <button type="button" key={tag} onClick={() => setTags(tags.filter((item) => item !== tag))} className="rounded-md bg-primary/15 px-2 py-1 text-xs text-primary">#{tag} ×</button>)}<input className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-sm outline-none" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }} onBlur={addTag} placeholder="Ajouter un tag puis Entrée" /></div></div>
      <div><Label>Canaux de notification pour cette tâche</Label><p className="mb-2 mt-1 text-xs text-muted-foreground">Pré-rempli avec vos canaux par défaut. Modifiez si besoin pour cette tâche.</p><div className="flex flex-wrap gap-3">{CHANNELS.map((channel) => <label key={channel.id} className="flex items-center gap-2 text-sm"><Checkbox checked={notificationChannels.includes(channel.id)} onCheckedChange={() => toggle(channel.id)} />{channel.label}</label>)}</div></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label>Lien / URL</Label><input className={fieldClass + " mt-1.5"} type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" /></div><div><Label>Rappel précis</Label><input className={fieldClass + " mt-1.5"} type="datetime-local" value={reminderDatetime} onChange={(e) => setReminderDatetime(e.target.value)} /></div></div>
      <div><Label>Rappels avant l'échéance</Label><div className="mt-2 flex flex-wrap gap-4">{[7, 3, 1, 0].map((days) => <label key={days} className="flex items-center gap-2 text-sm"><Checkbox checked={reminderDays.includes(days)} onCheckedChange={() => setReminderDays((current) => current.includes(days) ? current.filter((d) => d !== days) : [...current, days].sort((a, b) => b - a))} /><span>{days === 0 ? 'Le jour même' : `${days} jour${days > 1 ? 's' : ''} avant`}</span></label>)}</div></div>
      <div className="flex justify-end gap-2 border-t border-border pt-4"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted">Annuler</button><button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">{editTask ? 'Enregistrer' : 'Créer la tâche'}</button></div>
    </form></div></div>;
};
export default TaskModal;
