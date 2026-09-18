import { createHash, randomBytes, randomUUID } from 'crypto';
import { z } from 'zod';
import db from '../db/database';
import { decryptMailSecret, encryptMailSecret, MailError } from './mailAi';

export interface ZohoConnection {
  user_id: string; generation: string; account_id: string; email: string; refresh_token: string;
  activated_at: number; paused: number; last_sync: number | null; last_error: string | null;
  next_sync: number; lease_until: number; lease_owner: string | null; mappings: string; exclusions: string;
}
export const mappingSchema = z.array(z.object({ match: z.string().trim().toLowerCase().min(1).max(254), client: z.string().trim().min(1).max(200) }).strict()).max(100);
const idSchema = z.string().regex(/^\d+$/);
export const folderSchema = z.object({ folderId: idSchema, folderType: z.string(), folderName: z.string() });
export const messageSchema = z.object({
  messageId: idSchema, folderId: idSchema, threadId: z.string().optional(),
  subject: z.string().max(2000), fromAddress: z.string().max(1000), toAddress: z.string().max(10000).optional(), ccAddress: z.string().max(10000).optional(),
  receivedTime: z.union([z.string(), z.number()]).transform(Number).refine(Number.isFinite),
  hasAttachment: z.union([z.string(), z.number(), z.boolean()]).optional(),
});
const accessTokens = new Map<string, { token: string; expiresAt: number }>();
export function clearZohoAccess(generation: string) { accessTokens.delete(generation); }
export function getConnection(userId: string) {
  return db.prepare('SELECT * FROM zoho_connections WHERE user_id=?').get(userId) as ZohoConnection | undefined;
}
export function zohoConfigured() {
  return Boolean(process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET && process.env.ZOHO_REDIRECT_URI && process.env.MAIL_ENCRYPTION_KEY);
}
function oauthConfig() {
  if (!zohoConfigured()) throw new MailError('Connexion Zoho non configurée sur le serveur.');
  return { client_id: process.env.ZOHO_CLIENT_ID!, client_secret: process.env.ZOHO_CLIENT_SECRET!, redirect_uri: process.env.ZOHO_REDIRECT_URI! };
}
export function startZohoOAuth(userId: string) {
  const config = oauthConfig();
  const state = randomBytes(32).toString('hex');
  db.prepare('DELETE FROM zoho_oauth_states WHERE expires_at < ? OR user_id=?').run(Date.now(), userId);
  db.prepare('INSERT INTO zoho_oauth_states(hash,user_id,expires_at) VALUES(?,?,?)').run(createHash('sha256').update(state).digest('hex'), userId, Date.now() + 600000);
  return 'https://accounts.zoho.eu/oauth/v2/auth?' + new URLSearchParams({ client_id: config.client_id, redirect_uri: config.redirect_uri,
    response_type: 'code', access_type: 'offline', prompt: 'consent', state,
    scope: 'ZohoMail.accounts.READ,ZohoMail.folders.READ,ZohoMail.messages.READ',
  });
}
async function tokenRequest(params: Record<string, string>) {
  const response = await fetch('https://accounts.zoho.eu/oauth/v2/token', { method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ ...oauthConfig(), ...params }), signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new MailError(`Zoho OAuth : HTTP ${response.status}.`);
  const result = z.object({ access_token: z.string(), refresh_token: z.string().optional(), expires_in: z.number().optional() }).safeParse(await response.json());
  if (!result.success) throw new MailError('Accès Zoho refusé ou révoqué ; reconnectez la boîte.');
  return result.data;
}
export async function zohoGet<T>(token: string, path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch('https://mail.zoho.eu/api' + path, { headers: { Authorization: `Zoho-oauthtoken ${token}` }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new MailError(`Zoho Mail : HTTP ${response.status}.`);
  const envelope = z.object({ status: z.object({ code: z.number() }), data: schema }).safeParse(await response.json());
  if (!envelope.success || envelope.data.status.code !== 200) throw new MailError('Réponse Zoho Mail invalide ou accès refusé.');
  return envelope.data.data;
}
export async function finishZohoOAuth(state: string, code: string) {
  const stateHash = createHash('sha256').update(state).digest('hex');
  const entry = db.transaction(() => {
    const record = db.prepare('SELECT user_id FROM zoho_oauth_states WHERE hash=? AND expires_at>?').get(stateHash, Date.now()) as { user_id: string } | undefined;
    if (record) db.prepare('UPDATE zoho_oauth_states SET expires_at=0 WHERE hash=?').run(stateHash);
    return record;
  })();
  if (!entry) throw new MailError('Autorisation expirée ou déjà utilisée.');
  const token = await tokenRequest({ grant_type: 'authorization_code', code });
  if (!token.refresh_token) throw new MailError('Zoho ne fournit pas de jeton hors ligne ; réautorisez la connexion.');
  const accounts = await zohoGet(token.access_token, '/accounts', z.array(z.object({ accountId: idSchema, type: z.string().optional(),
    primaryEmailAddress: z.string().optional(), mailboxAddress: z.string().optional() })));
  const account = accounts.find(a => a.type === 'ZOHO_ACCOUNT') || accounts[0];
  const email = account?.primaryEmailAddress || account?.mailboxAddress;
  if (!account || !email) throw new MailError('Aucune boîte Zoho principale trouvée.');
  // Verify folder/message access before activation; no historical mail content is read.
  await zohoGet(token.access_token, `/accounts/${account.accountId}/folders`, z.array(folderSchema));
  await zohoGet(token.access_token, `/accounts/${account.accountId}/messages/view?limit=1&status=all`, z.array(messageSchema));
  if (!db.prepare('DELETE FROM zoho_oauth_states WHERE hash=? AND user_id=? AND expires_at=0').run(stateHash, entry.user_id).changes) throw new MailError('Autorisation annulée.');
  const old = getConnection(entry.user_id);
  if (old) clearZohoAccess(old.generation);
  const generation = randomUUID();
  db.prepare(`INSERT INTO zoho_connections(user_id,generation,account_id,email,refresh_token,activated_at) VALUES(?,?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET generation=excluded.generation,account_id=excluded.account_id,email=excluded.email,
    refresh_token=excluded.refresh_token,activated_at=CASE WHEN account_id=excluded.account_id THEN activated_at ELSE excluded.activated_at END,
    paused=0,last_error=NULL,next_sync=0,lease_until=0,lease_owner=NULL`)
    .run(entry.user_id, generation, account.accountId, email, encryptMailSecret(token.refresh_token), Date.now());
  accessTokens.set(generation, { token: token.access_token, expiresAt: Date.now() + 3000000 });
}
export async function getZohoAccess(connection: ZohoConnection) {
  const cached = accessTokens.get(connection.generation);
  if (cached && cached.expiresAt > Date.now()) return cached.token;
  const result = await tokenRequest({ grant_type: 'refresh_token', refresh_token: decryptMailSecret(connection.refresh_token) });
  accessTokens.set(connection.generation, { token: result.access_token, expiresAt: Date.now() + Math.max(60, (result.expires_in || 3600) - 120) * 1000 });
  return result.access_token;
}
export function allowedFolder(folder: z.infer<typeof folderSchema>) {
  return !['spam', 'trash', 'drafts', 'sent', 'outbox', 'templates', 'junk'].includes(folder.folderType.toLowerCase());
}
export function addressOf(value: string) {
  return (value.match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+/i)?.[0] || '').toLowerCase();
}
export function matchesSender(sender: string, pattern: string) {
  const address = addressOf(sender);
  const normalized = pattern.toLowerCase().replace(/^@/, '');
  return address === normalized || address.split('@')[1] === normalized;
}
