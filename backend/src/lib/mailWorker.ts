import { randomUUID } from 'crypto';
import { z } from 'zod';
import db from '../db/database';
import { aiReady, cleanMailText, extractMail, getAiConfig, MailError, needsReview, safeMailError, type Extraction, type MailContext, type MailProposal } from './mailAi';
import { allowedFolder, addressOf, clearZohoAccess, folderSchema, getConnection, getZohoAccess, mappingSchema, matchesSender, messageSchema, zohoConfigured, zohoGet, type ZohoConnection } from './zohoMail';
import { createTask, isKnownTaskClient, taskInputSchema } from './taskService';

export interface MailMessage {
  id: string; user_id: string; account_id: string; message_id: string; folder_id: string; thread_id: string | null;
  subject: string; sender: string; recipients: string; received_at: number; has_attachment: number;
  status: string; attempts: number; provider: 'openrouter' | 'deepseek' | null; model: string | null; lease_owner: string | null;
}
function renew(connection: ZohoConnection, owner: string) {
  const result = db.prepare('UPDATE zoho_connections SET lease_until=? WHERE user_id=? AND generation=? AND paused=0 AND lease_owner=?')
    .run(Date.now() + 120000, connection.user_id, connection.generation, owner);
  if (!result.changes) throw new MailError('Connexion interrompue.');
}
export function enqueueMessage(connection: ZohoConnection, mail: z.infer<typeof messageSchema>) {
  if (mail.receivedTime < connection.activated_at || addressOf(mail.fromAddress) === connection.email.toLowerCase()) return;
  const exclusions = JSON.parse(connection.exclusions) as string[];
  if (exclusions.some(pattern => matchesSender(mail.fromAddress, pattern))) return;
  db.prepare(`INSERT INTO mail_messages(id,user_id,account_id,message_id,folder_id,thread_id,subject,sender,recipients,received_at,has_attachment,created_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,account_id,message_id) DO UPDATE SET folder_id=excluded.folder_id`)
    .run(randomUUID(), connection.user_id, connection.account_id, mail.messageId, mail.folderId, mail.threadId || null,
      mail.subject, mail.fromAddress, [mail.toAddress, mail.ccAddress].filter(Boolean).join(', '), mail.receivedTime,
      ['1', 'true'].includes(String(mail.hasAttachment)) ? 1 : 0, new Date().toISOString());
}
async function collect(connection: ZohoConnection, owner: string, token: string) {
  const folders = await zohoGet(token, `/accounts/${connection.account_id}/folders`, z.array(folderSchema));
  // Scan back to activation in each folder. This also catches older, newly moved messages.
  // No checkpoint is advanced until all pages have been persisted successfully.
  for (const folder of folders.filter(allowedFolder)) {
    let start = 1;
    while (true) {
      renew(connection, owner);
      const query = new URLSearchParams({ folderId: folder.folderId, start: String(start), limit: '200', status: 'all', sortBy: 'date', sortorder: 'false', includeto: 'true', includesent: 'false', includearchive: 'true' });
      const messages = await zohoGet(token, `/accounts/${connection.account_id}/messages/view?${query}`, z.array(messageSchema));
      renew(connection, owner);
      db.transaction(() => { for (const message of messages) enqueueMessage(connection, message); })();
      if (messages.length < 200 || messages.some(m => m.receivedTime < connection.activated_at)) break;
      start += 180; // overlapping pages tolerate concurrent arrivals during pagination
    }
  }
}
export function existingThreadTasks(message: MailMessage) {
  if (!message.thread_id) return [];
  return db.prepare(`SELECT DISTINCT t.id,t.title,t.due_date AS dueDate,t.status FROM tasks t
    JOIN task_mail_sources s ON s.task_id=t.id JOIN mail_messages m ON m.id=s.message_id
    WHERE t.user_id=? AND m.account_id=? AND m.thread_id=? LIMIT 50`).all(message.user_id, message.account_id, message.thread_id) as MailContext['existingTasks'];
}
function clientFor(connection: ZohoConnection, sender: string) {
  const mappings = mappingSchema.parse(JSON.parse(connection.mappings));
  const exact = mappings.filter(m => m.match.includes('@') && !m.match.startsWith('@') && matchesSender(sender, m.match));
  const matches = exact.length ? exact : mappings.filter(m => matchesSender(sender, m.match));
  const clients = [...new Set(matches.map(m => m.client))];
  return clients.length === 1 && isKnownTaskClient(connection.user_id, clients[0]) ? clients[0] : undefined;
}
function taskInput(proposal: MailProposal, connection: ZohoConnection, message: MailMessage) {
  return { title: proposal.title, description: proposal.description, dueDate: proposal.dueDate,
    client: clientFor(connection, message.sender), priority: proposal.priority, tags: ['zoho'] };
}
function attach(taskId: string, messageId: string) {
  db.prepare('INSERT OR IGNORE INTO task_mail_sources(task_id,message_id) VALUES(?,?)').run(taskId, messageId);
}

export function applyExtraction(message: MailMessage, connection: ZohoConnection, context: MailContext, result: Extraction, owner: string) {
  db.transaction(() => {
    const current = getConnection(message.user_id);
    const job = db.prepare("SELECT id FROM mail_messages WHERE id=? AND status='processing' AND lease_owner=?").get(message.id, owner);
    if (!current || current.generation !== connection.generation || current.paused || !job) return;
    let hasReview = false;
    // Incomplete content cannot be silently ignored.
    const proposals = result.proposals.length ? result.proposals : context.incomplete ? [{ action: 'create', title: message.subject || 'Mail à examiner', description: '', dueDate: null,
      priority: 'normal', evidence: '', priorityEvidence: '', dueDateEvidence: '', explicitForUser: false, ambiguous: true, requiresAttachment: false, existingTaskId: null } as MailProposal] : [];
    const seen = new Set<string>();
    for (const original of proposals) {
      const existing = context.existingTasks.find(t => t.id === original.existingTaskId);
      const proposal = original.action === 'followup' && existing && original.dueDate !== null && original.dueDate !== existing.dueDate?.slice(0, 10)
        ? { ...original, action: 'update' as const } : original;
      const fingerprint = JSON.stringify([proposal.action, proposal.existingTaskId, proposal.title.trim().toLowerCase(), proposal.dueDate]);
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      const payload = taskInput(proposal, connection, message);
      const review = needsReview(proposal, context, result.decision);
      if (review) {
        hasReview = true;
        db.prepare('INSERT INTO mail_proposals(id,message_id,user_id,payload,reason,created_at) VALUES(?,?,?,?,?,?)')
          .run(randomUUID(), message.id, message.user_id, JSON.stringify({ ...proposal, existingTaskId: context.existingTasks.some(t => t.id === proposal.existingTaskId) ? proposal.existingTaskId : null, client: payload.client }), result.reason || 'Demande à vérifier', new Date().toISOString());
      } else if (proposal.action === 'followup' && proposal.existingTaskId) {
        attach(proposal.existingTaskId, message.id);
      } else {
        attach(createTask(message.user_id, payload), message.id);
      }
    }
    db.prepare("UPDATE mail_messages SET status='done',decision=?,error=NULL,lease_owner=NULL,lease_until=0 WHERE id=?")
      .run(hasReview ? 'review' : result.decision, message.id);
  })();
}

export function acceptProposal(userId: string, id: string, edits: unknown) {
  return db.transaction(() => {
    const row = db.prepare('SELECT * FROM mail_proposals WHERE id=? AND user_id=?').get(id, userId) as { status: string; task_id: string | null; payload: string; message_id: string } | undefined;
    if (!row) throw new MailError('Proposition introuvable.');
    if (row.status === 'accepted') return row.task_id;
    if (row.status !== 'pending') throw new MailError('Proposition déjà rejetée.');
    const original = JSON.parse(row.payload) as MailProposal & { client?: string };
    const input = taskInputSchema.parse({ ...original, ...z.object({ title: z.string().optional(), description: z.string().optional(), dueDate: z.string().nullable().optional(), client: z.string().optional(), priority: z.enum(['low','normal','high','urgent']).optional() }).strict().parse(edits || {}) });
    let taskId: string;
    if (original.action !== 'create' && original.existingTaskId) {
      const target = db.prepare('SELECT id FROM tasks WHERE id=? AND user_id=?').get(original.existingTaskId, userId);
      if (!target) throw new MailError('La tâche liée n’existe plus. Rejetez cette proposition.');
      taskId = original.existingTaskId;
      if (original.action === 'update') db.prepare('UPDATE tasks SET title=?,description=?,due_date=?,client=?,priority=?,updated_at=? WHERE id=? AND user_id=?')
        .run(input.title,input.description || null,input.dueDate ?? null,input.client || null,input.priority,new Date().toISOString(),taskId,userId);
      if (original.action === 'complete') db.prepare("UPDATE tasks SET status='completed',updated_at=? WHERE id=? AND user_id=?").run(new Date().toISOString(),taskId,userId);
    } else {
      taskId = createTask(userId, { ...input, tags: ['zoho'] });
    }
    attach(taskId, row.message_id);
    db.prepare("UPDATE mail_proposals SET status='accepted',task_id=? WHERE id=?").run(taskId, id);
    return taskId;
  })();
}

async function processQueue(connection: ZohoConnection, owner: string, token: string) {
  for (let i = 0; i < 20; i++) {
    renew(connection, owner);
    const config = getAiConfig();
    if (!aiReady(config)) return;
    const message = db.transaction(() => {
      const row = db.prepare(`SELECT * FROM mail_messages WHERE user_id=? AND account_id=? AND
        ((status='queued' AND next_attempt<=?) OR (status='processing' AND lease_until<?)) ORDER BY received_at LIMIT 1`)
        .get(connection.user_id, connection.account_id, Date.now(), Date.now()) as MailMessage | undefined;
      if (!row) return;
      const provider = row.provider || config.provider;
      const model = row.model || config[`${provider}_model`];
      db.prepare("UPDATE mail_messages SET status='processing',attempts=attempts+1,lease_until=?,lease_owner=?,provider=?,model=? WHERE id=?")
        .run(Date.now() + 120000, owner, provider, model, row.id);
      return { ...row, attempts: row.attempts + 1, provider, model, lease_owner: owner };
    })();
    if (!message) return;
    try {
      const content = await zohoGet(token, `/accounts/${connection.account_id}/folders/${message.folder_id}/messages/${message.message_id}/content?includeBlockContent=false`, z.object({ content: z.string() }));
      renew(connection, owner);
      const cleaned = cleanMailText(content.content);
      const context: MailContext = { subject: message.subject, sender: message.sender, recipients: message.recipients, userEmail: connection.email,
        receivedAt: new Date(message.received_at).toISOString(), ...cleaned, hasAttachment: Boolean(message.has_attachment), existingTasks: existingThreadTasks(message) };
      const result = await extractMail(context, { ...config, provider: message.provider, [`${message.provider}_model`]: message.model }, message.user_id);
      renew(connection, owner);
      applyExtraction(message, connection, context, result, owner);
    } catch (e) {
      db.prepare(`UPDATE mail_messages SET status=?,next_attempt=?,lease_owner=NULL,lease_until=0,error=? WHERE id=? AND lease_owner=?`)
        .run(message.attempts >= 5 ? 'failed' : 'queued', Date.now() + Math.min(3600000, 30000 * 2 ** message.attempts), safeMailError(e), message.id, owner);
    }
  }
}

let running = false;
export async function runMailWorker() {
  if (running || !zohoConfigured() || !aiReady()) return;
  running = true;
  try {
    const connections = db.prepare('SELECT * FROM zoho_connections WHERE paused=0 AND next_sync<=? AND lease_until<?').all(Date.now(), Date.now()) as ZohoConnection[];
    for (const connection of connections) {
      const owner = randomUUID();
      if (!db.prepare('UPDATE zoho_connections SET lease_owner=?,lease_until=? WHERE user_id=? AND generation=? AND lease_until<? AND paused=0')
        .run(owner, Date.now() + 120000, connection.user_id, connection.generation, Date.now()).changes) continue;
      try {
        const token = await getZohoAccess(connection);
        await collect(connection, owner, token);
        renew(connection, owner);
        db.prepare('UPDATE zoho_connections SET last_sync=?,last_error=NULL WHERE user_id=? AND lease_owner=?').run(Date.now(), connection.user_id, owner);
        await processQueue(connection, owner, token);
      } catch (e) {
        if (e instanceof MailError && e.message.includes('HTTP 401')) clearZohoAccess(connection.generation);
        db.prepare('UPDATE zoho_connections SET last_error=? WHERE user_id=? AND lease_owner=?').run(safeMailError(e), connection.user_id, owner);
      } finally {
        db.prepare('UPDATE zoho_connections SET next_sync=?,lease_until=0,lease_owner=NULL WHERE user_id=? AND lease_owner=?').run(Date.now() + 180000, connection.user_id, owner);
      }
    }
  } finally { running = false; }
}
