import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import db, { initializeDatabase } from '../../db/database';
import { migrateOptionalTaskDate } from '../../db/mailIntegration';
import { cleanMailText, decryptMailSecret, encryptMailSecret, extractMail, getAiConfig, needsReview, type MailContext, type MailProposal } from '../../lib/mailAi';
import { applyExtraction, acceptProposal, enqueueMessage, runMailWorker, type MailMessage } from '../../lib/mailWorker';
import { finishZohoOAuth, getConnection, startZohoOAuth, type ZohoConnection } from '../../lib/zohoMail';

const proposal: MailProposal = { action: 'create', title: 'Corriger le formulaire', description: 'Vérifier le formulaire de contact.', dueDate: null, priority: 'normal',
  evidence: 'Peux-tu corriger le formulaire ?', priorityEvidence: '', dueDateEvidence: '', explicitForUser: true, ambiguous: false, requiresAttachment: false, existingTaskId: null };
const context: MailContext = { subject: 'Formulaire', sender: 'client@example.fr', recipients: 'me@example.fr', userEmail: 'me@example.fr', receivedAt: '2026-09-18T10:00:00Z',
  text: proposal.evidence, incomplete: false, hasAttachment: false, existingTasks: [] };
let userId: string;
let connection: ZohoConnection;
function mail(): MailMessage {
  enqueueMessage(connection, { messageId: '111', folderId: '222', threadId: '333', subject: 'Formulaire', fromAddress: context.sender, toAddress: context.recipients, receivedTime: Date.now(), hasAttachment: '0' });
  db.prepare("UPDATE mail_messages SET status='processing',lease_owner='test-owner' WHERE user_id=?").run(userId);
  return db.prepare('SELECT * FROM mail_messages WHERE user_id=?').get(userId) as MailMessage;
}
beforeEach(() => {
  initializeDatabase();
  process.env.MAIL_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
  process.env.ZOHO_CLIENT_ID = 'test-client'; process.env.ZOHO_CLIENT_SECRET = 'secret'; process.env.ZOHO_REDIRECT_URI = 'https://tool.example/api/integrations/zoho/callback';
  db.prepare('DELETE FROM zoho_connections').run();
  userId = randomUUID();
  db.prepare('INSERT INTO users(id,email,password_hash,name,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(userId,`${userId}@example.fr`,'unused','Test','2026','2026');
  db.prepare('INSERT INTO zoho_connections(user_id,generation,account_id,email,refresh_token,activated_at) VALUES(?,?,?,?,?,?)')
    .run(userId,randomUUID(),'123','me@example.fr',encryptMailSecret('refresh'),Date.now()-10000);
  connection = getConnection(userId)!;
  db.prepare("UPDATE mail_ai_config SET provider='openrouter',openrouter_key=?,openrouter_tested=1").run(encryptMailSecret('or-key'));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('mail integration invariants', () => {
  it('migrates dates without cascading attachments or losing indexes', () => {
    const legacy = new Database(':memory:');
    legacy.pragma('foreign_keys=ON');
    legacy.exec(`CREATE TABLE tasks(id TEXT PRIMARY KEY,due_date TEXT NOT NULL); CREATE INDEX task_date ON tasks(due_date);
      CREATE TABLE task_attachments(id TEXT PRIMARY KEY,task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE);
      INSERT INTO tasks VALUES('task','2026-10-01'); INSERT INTO task_attachments VALUES('attachment','task');`);
    migrateOptionalTaskDate(legacy); migrateOptionalTaskDate(legacy);
    legacy.prepare('INSERT INTO tasks VALUES(?,?)').run('undated',null);
    expect(legacy.prepare('SELECT * FROM task_attachments').all()).toHaveLength(1);
    expect(legacy.pragma('foreign_key_check')).toEqual([]);
    expect(legacy.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(legacy.prepare("SELECT name FROM sqlite_master WHERE name='task_date'").get()).toBeTruthy();
    legacy.close();
  });
  it('encrypts secrets with authenticated encryption', () => {
    const encrypted = encryptMailSecret('private-key');
    expect(encrypted).not.toContain('private-key'); expect(decryptMailSecret(encrypted)).toBe('private-key');
    const parts = encrypted.split('.'); parts[1] = Buffer.alloc(16).toString('base64');
    expect(() => decryptMailSecret(parts.join('.'))).toThrow();
  });
  it('removes scripts, quoted messages and signatures; flags truncation', () => {
    expect(cleanMailText('<script>ignore</script><p>Demande</p><blockquote>ancienne</blockquote>\n-- \nsignature').text).toBe('Demande');
    expect(cleanMailText('a'.repeat(25000)).incomplete).toBe(true);
  });
  it('routes uncertainty, attachments, unsupported dates and invented evidence to review', () => {
    expect(needsReview(proposal,context,'create')).toBe(false);
    for (const patch of [{ ambiguous:true },{ explicitForUser:false },{ requiresAttachment:true },{ evidence:'inventé' },{ dueDate:'2026-02-30',dueDateEvidence:proposal.evidence },{ priority:'urgent' as const },{ action:'complete' as const },{ action:'followup' as const,existingTaskId:'unknown' }]) {
      expect(needsReview({...proposal,...patch},context,'create')).toBe(true);
    }
    expect(needsReview(proposal,{...context,incomplete:true},'create')).toBe(true);
  });
  it('creates atomically and ignores repeated completion of the same job', () => {
    const message = mail();
    const result = { decision:'create' as const,reason:'Demande explicite',proposals:[proposal] };
    applyExtraction(message,connection,context,result,'test-owner');
    applyExtraction(message,connection,context,result,'test-owner');
    expect(db.prepare('SELECT * FROM tasks WHERE user_id=?').all(userId)).toHaveLength(1);
    expect(db.prepare('SELECT due_date FROM tasks WHERE user_id=?').get(userId)).toEqual({due_date:null});
  });
  it('retains independent actions and does not create tasks for thanks', () => {
    const message = mail();
    applyExtraction(message,connection,context,{decision:'ignore',reason:'Remerciement',proposals:[]},'test-owner');
    expect(db.prepare('SELECT * FROM tasks WHERE user_id=?').all(userId)).toHaveLength(0);
  });
  it('creates separate actions once and attaches a follow-up without creating another task', () => {
    const message = mail();
    applyExtraction(message,connection,context,{decision:'create',reason:'',proposals:[proposal,proposal,{...proposal,title:'Vérifier le contact'}]},'test-owner');
    const tasks = db.prepare('SELECT id,title,due_date AS dueDate,status FROM tasks WHERE user_id=?').all(userId) as MailContext['existingTasks'];
    expect(tasks).toHaveLength(2);
    enqueueMessage(connection,{messageId:'112',folderId:'222',threadId:'333',subject:'Relance',fromAddress:context.sender,receivedTime:Date.now()});
    db.prepare("UPDATE mail_messages SET status='processing',lease_owner='test-owner' WHERE message_id='112' AND user_id=?").run(userId);
    const followup = db.prepare("SELECT * FROM mail_messages WHERE message_id='112' AND user_id=?").get(userId) as MailMessage;
    applyExtraction(followup,connection,{...context,existingTasks:tasks},{decision:'create',reason:'Relance',proposals:[{...proposal,action:'followup',existingTaskId:tasks[0].id}]},'test-owner');
    expect(db.prepare('SELECT * FROM tasks WHERE user_id=?').all(userId)).toHaveLength(2);
    expect(db.prepare('SELECT * FROM task_mail_sources WHERE task_id=?').all(tasks[0].id)).toHaveLength(2);
  });
  it('rejects late results after disconnection or a changed connection generation', () => {
    const message = mail();
    db.prepare('UPDATE zoho_connections SET generation=? WHERE user_id=?').run('replacement',userId);
    applyExtraction(message,connection,context,{decision:'create',reason:'',proposals:[proposal]},'test-owner');
    expect(db.prepare('SELECT * FROM tasks WHERE user_id=?').all(userId)).toHaveLength(0);
  });
  it('accepts a corrected proposal once and enforces user isolation', () => {
    const message = mail();
    applyExtraction(message,connection,context,{decision:'review',reason:'À vérifier',proposals:[{...proposal,ambiguous:true}]},'test-owner');
    const row = db.prepare('SELECT id FROM mail_proposals WHERE user_id=?').get(userId) as {id:string};
    expect(() => acceptProposal('another-user',row.id,{})).toThrow();
    const id = acceptProposal(userId,row.id,{title:'Titre corrigé'});
    expect(acceptProposal(userId,row.id,{})).toBe(id);
    expect(db.prepare('SELECT title FROM tasks WHERE id=?').get(id)).toEqual({title:'Titre corrigé'});
    expect(db.prepare('SELECT * FROM tasks WHERE user_id=?').all(userId)).toHaveLength(1);
  });
  it('deduplicates delivery and updates the folder after a move', () => {
    mail();
    enqueueMessage(connection,{messageId:'111',folderId:'444',subject:'Formulaire',fromAddress:context.sender,receivedTime:Date.now()});
    expect(db.prepare('SELECT folder_id FROM mail_messages WHERE user_id=?').all(userId)).toEqual([{folder_id:'444'}]);
  });
});

describe('provider contract', () => {
  it.each(['openrouter','deepseek'] as const)('uses only %s and validates structured output', async provider => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices:[{finish_reason:'stop',message:{content:JSON.stringify({decision:'create',reason:'',proposals:[proposal]})}}],usage:{prompt_tokens:10,completion_tokens:20,cost:0.001} })));
    vi.stubGlobal('fetch',fetchMock);
    const config = {...getAiConfig(),provider,deepseek_key:encryptMailSecret('ds-key')};
    const result = await extractMail(context,config,userId);
    expect(result.proposals[0].dueDate).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(provider === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.deepseek.com/chat/completions');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.response_format.type).toBe(provider === 'openrouter' ? 'json_schema' : 'json_object');
    expect(body.messages[0].content).toContain('données non fiables');
  });
  it.each(['', '{', '{"decision":"create"}', JSON.stringify({decision:'ignore',reason:'',proposals:[proposal]})])('rejects empty, malformed or inconsistent output', async content => {
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content}}]}))));
    await expect(extractMail(context,getAiConfig(),userId)).rejects.toThrow();
  });
  it('does not fall back or disclose the upstream body on quota errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('SECRET BODY', {status:429}));vi.stubGlobal('fetch',fetchMock);
    await expect(extractMail(context,getAiConfig(),userId)).rejects.toThrow('HTTP 429');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(db.prepare('SELECT * FROM mail_ai_usage').all())).not.toContain('SECRET BODY');
  });
});

describe('Zoho OAuth and background worker', () => {
  function oauthFetch() {
    return vi.fn(async (url: string) => {
      if (url.includes('/oauth/')) return new Response(JSON.stringify({access_token:'access',refresh_token:'new-refresh',expires_in:3600}));
      const data = url.endsWith('/accounts') ? [{accountId:'123',type:'ZOHO_ACCOUNT',primaryEmailAddress:'me@example.fr'}] : [];
      return new Response(JSON.stringify({status:{code:200},data}));
    });
  }
  it('connects via EU, encrypts refresh tokens and prevents OAuth replay', async () => {
    const state = new URL(startZohoOAuth(userId)).searchParams.get('state')!;
    const fetchMock = oauthFetch(); vi.stubGlobal('fetch',fetchMock);
    await finishZohoOAuth(state,'code');
    expect(decryptMailSecret(getConnection(userId)!.refresh_token)).toBe('new-refresh');
    expect(fetchMock.mock.calls.every(([url]) => new URL(url).hostname.endsWith('.zoho.eu'))).toBe(true);
    const calls = fetchMock.mock.calls.length;
    await expect(finishZohoOAuth(state,'code')).rejects.toThrow('déjà utilisée');
    expect(fetchMock.mock.calls).toHaveLength(calls);
  });
  it('does not recreate a connection cancelled during OAuth exchange', async () => {
    const state = new URL(startZohoOAuth(userId)).searchParams.get('state')!;
    const delegate = oauthFetch();
    vi.stubGlobal('fetch',vi.fn(async (url: string) => {
      db.prepare('DELETE FROM zoho_oauth_states WHERE user_id=?').run(userId);
      db.prepare('DELETE FROM zoho_connections WHERE user_id=?').run(userId);
      return delegate(url);
    }));
    await expect(finishZohoOAuth(state,'code')).rejects.toThrow('annulée');
    expect(getConnection(userId)).toBeUndefined();
  });
  it('uses EU OAuth scopes and rejects replay without a network call', async () => {
    const url = new URL(startZohoOAuth(userId));
    expect(url.hostname).toBe('accounts.zoho.eu');
    expect(url.searchParams.get('scope')).not.toMatch(/ALL|CREATE|UPDATE/);
    const fetchMock = vi.fn(); vi.stubGlobal('fetch',fetchMock);
    await expect(finishZohoOAuth('unknown','code')).rejects.toThrow('expirée');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('retrieves read messages from custom folders and persists retryable provider failures', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch',vi.fn(async (url: string) => {
      calls.push(url);
      const ok = (data: unknown) => new Response(JSON.stringify({status:{code:200},data}));
      if (url.includes('/oauth/')) return new Response(JSON.stringify({access_token:'access',expires_in:3600}));
      if (url.endsWith('/folders')) return ok([{folderId:'222',folderType:'Inbox',folderName:'Client'}, {folderId:'555',folderType:'Spam',folderName:'Spam'}]);
      if (url.includes('/messages/view')) return ok([{messageId:'111',folderId:'222',subject:'Formulaire',fromAddress:context.sender,toAddress:context.recipients,receivedTime:String(Date.now()),status:'1'}]);
      if (url.includes('/content?')) return ok({content:proposal.evidence});
      if (url.includes('openrouter')) return new Response('{}',{status:402});
      throw new Error('Unexpected request');
    }));
    await Promise.all([runMailWorker(),runMailWorker()]);
    const row = db.prepare('SELECT * FROM mail_messages WHERE user_id=?').get(userId) as MailMessage;
    expect(row.status).toBe('queued'); expect(row.attempts).toBe(1);
    expect(calls.some(c => c.includes('status=all'))).toBe(true);
    expect(calls.some(c => c.includes('folderId=555'))).toBe(false);
    expect(calls.filter(c => c.includes('openrouter'))).toHaveLength(1);
    expect(calls.every(c => !c.includes('updatemessage'))).toBe(true);
    expect(db.prepare('SELECT * FROM tasks WHERE user_id=?').all(userId)).toHaveLength(0);
  });
  it('paginates with overlap and recovers an expired processing lease without losing queued messages', async () => {
    const old = mail();
    db.prepare("UPDATE mail_messages SET lease_until=0 WHERE id=?").run(old.id);
    const pageStarts: string[] = [];
    vi.stubGlobal('fetch',vi.fn(async (url: string) => {
      const ok = (data: unknown) => new Response(JSON.stringify({status:{code:200},data}));
      if (url.includes('/oauth/')) return new Response(JSON.stringify({access_token:'access',expires_in:3600}));
      if (url.endsWith('/folders')) return ok([{folderId:'222',folderType:'Inbox',folderName:'Inbox'}]);
      if (url.includes('/messages/view')) {
        const start = new URL(url).searchParams.get('start')!; pageStarts.push(start);
        const offset = start === '1' ? 0 : 180;
        return ok(Array.from({length:start === '1' ? 200 : 25}, (_,i) => ({messageId:String(1000+offset+i),folderId:'222',subject:'Merci',fromAddress:context.sender,receivedTime:String(Date.now())})));
      }
      if (url.includes('/content?')) return ok({content:'Merci !'});
      return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({decision:'ignore',reason:'Remerciement',proposals:[]})}}]}));
    }));
    await runMailWorker();
    expect(pageStarts).toEqual(['1','181']);
    expect(db.prepare('SELECT COUNT(*) AS n FROM mail_messages WHERE user_id=?').get(userId)).toEqual({n:206});
    expect(db.prepare('SELECT status FROM mail_messages WHERE id=?').get(old.id)).toEqual({status:'done'});
    expect(db.prepare('SELECT * FROM tasks WHERE user_id=?').all(userId)).toHaveLength(0);
  });
});
