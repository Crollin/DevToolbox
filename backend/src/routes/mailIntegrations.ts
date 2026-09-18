import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import db from '../db/database';
import { authenticateToken } from '../middleware/auth';
import { aiReady, encryptMailSecret, getAiConfig, safeMailError, testAi, type AiConfig } from '../lib/mailAi';
import { clearZohoAccess, finishZohoOAuth, getConnection, mappingSchema, startZohoOAuth, zohoConfigured } from '../lib/zohoMail';
import { acceptProposal } from '../lib/mailWorker';

const router = Router();
const wrap = (fn: (req: Request, res: Response) => Promise<unknown> | unknown) => (req: Request, res: Response) => {
  Promise.resolve().then(() => fn(req, res)).catch(error => res.status(error instanceof z.ZodError ? 400 : 422)
    .json({ error: error instanceof z.ZodError ? 'Données invalides.' : safeMailError(error) }));
};
export function isMailAdmin(userId: string) {
  return (process.env.MAIL_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(userId);
}
function admin(req: Request, res: Response, next: NextFunction) {
  if (!isMailAdmin(req.user!.id)) return res.status(403).json({ error: 'Configuration réservée aux administrateurs de l’instance.' });
  next();
}

router.get('/zoho/callback', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const home = new URL('/account', process.env.FRONTEND_URL || 'http://localhost:8080');
  home.searchParams.set('tab', 'integrations');
  try {
    const query = z.object({ state: z.string().length(64), code: z.string().min(1).max(2000), location: z.literal('eu').optional() }).parse(req.query);
    await finishZohoOAuth(query.state, query.code);
    home.searchParams.set('zoho', 'connected');
  } catch { home.searchParams.set('zoho', 'error'); }
  res.redirect(home.toString());
});
router.use(authenticateToken);
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

router.get('/zoho', wrap((req, res) => {
  const connection = getConnection(req.user!.id);
  const { refresh_token: _token, lease_owner: _owner, ...safe } = connection || {};
  res.json({ configured: zohoConfigured(), aiReady: aiReady(), isAdmin: isMailAdmin(req.user!.id),
    connection: connection ? { ...safe, mappings: JSON.parse(connection.mappings), exclusions: JSON.parse(connection.exclusions) } : null });
}));
router.post('/zoho/connect', wrap((req, res) => res.json({ url: startZohoOAuth(req.user!.id) })));
router.put('/zoho', wrap((req, res) => {
  const input = z.object({ paused: z.boolean(), mappings: mappingSchema, exclusions: z.array(z.string().trim().toLowerCase().min(1).max(254)).max(100) }).strict().parse(req.body);
  for (const mapping of input.mappings) {
    if (!db.prepare('SELECT id FROM task_clients WHERE user_id=? AND name=?').get(req.user!.id, mapping.client)) return res.status(400).json({ error: `Client inconnu : ${mapping.client}` });
  }
  const result = db.prepare('UPDATE zoho_connections SET paused=?,mappings=?,exclusions=?,next_sync=0,lease_owner=NULL,lease_until=0 WHERE user_id=?')
    .run(input.paused ? 1 : 0, JSON.stringify(input.mappings), JSON.stringify(input.exclusions), req.user!.id);
  if (!result.changes) return res.status(404).json({ error: 'Boîte non connectée.' });
  res.json({ success: true });
}));
router.delete('/zoho', wrap((req, res) => {
  const current = getConnection(req.user!.id);
  db.transaction(() => {
    db.prepare('DELETE FROM zoho_connections WHERE user_id=?').run(req.user!.id);
    db.prepare('DELETE FROM zoho_oauth_states WHERE user_id=?').run(req.user!.id);
    db.prepare("UPDATE mail_messages SET status='cancelled',lease_owner=NULL,lease_until=0 WHERE user_id=? AND status IN ('queued','processing','failed')").run(req.user!.id);
  })();
  if (current) clearZohoAccess(current.generation);
  res.json({ success: true });
}));

router.get('/zoho/messages', wrap((req, res) => {
  const messages = db.prepare(`SELECT id,subject,sender,received_at,status,decision,error,provider,model,attempts FROM mail_messages WHERE user_id=? ORDER BY received_at DESC LIMIT 100`).all(req.user!.id);
  res.json({ messages });
}));
router.post('/zoho/messages/:id/retry', wrap((req, res) => {
  if (!getConnection(req.user!.id)) return res.status(409).json({ error: 'Reconnectez votre boîte.' });
  const result = db.prepare(`UPDATE mail_messages SET status='queued',attempts=0,next_attempt=0,error=NULL
    WHERE id=? AND user_id=? AND account_id=(SELECT account_id FROM zoho_connections WHERE user_id=?) AND status='failed'`)
    .run(req.params.id, req.user!.id, req.user!.id);
  if (!result.changes) return res.status(409).json({ error: 'Message non disponible pour une nouvelle tentative.' });
  db.prepare('UPDATE zoho_connections SET next_sync=0 WHERE user_id=?').run(req.user!.id);
  res.json({ success: true });
}));
router.get('/zoho/proposals', wrap((req, res) => {
  const rows = db.prepare(`SELECT p.*,m.subject,m.sender,m.message_id AS zohoMessageId FROM mail_proposals p JOIN mail_messages m ON m.id=p.message_id
    WHERE p.user_id=? AND p.status='pending' ORDER BY p.created_at DESC LIMIT 100`).all(req.user!.id) as { payload: string }[];
  res.json({ proposals: rows.map(r => ({ ...r, payload: JSON.parse(r.payload) })) });
}));
router.post('/zoho/proposals/:id/accept', wrap((req, res) => res.json({ taskId: acceptProposal(req.user!.id, req.params.id, req.body) })));
router.post('/zoho/proposals/:id/reject', wrap((req, res) => {
  const row = db.prepare('SELECT status FROM mail_proposals WHERE id=? AND user_id=?').get(req.params.id, req.user!.id) as { status: string } | undefined;
  if (!row) return res.status(404).json({ error: 'Proposition introuvable.' });
  if (row.status === 'accepted') return res.status(409).json({ error: 'Proposition déjà acceptée.' });
  db.prepare("UPDATE mail_proposals SET status='rejected' WHERE id=? AND user_id=?").run(req.params.id, req.user!.id);
  res.json({ success: true });
}));

function publicConfig(config: AiConfig) {
  return { provider: config.provider,
    openrouter: { model: config.openrouter_model, configured: Boolean(config.openrouter_key), tested: Boolean(config.openrouter_tested) },
    deepseek: { model: config.deepseek_model, configured: Boolean(config.deepseek_key), tested: Boolean(config.deepseek_tested) } };
}
router.get('/mail-ai', admin, wrap((_req, res) => res.json(publicConfig(getAiConfig()))));
router.put('/mail-ai', admin, wrap((req, res) => {
  const input = z.object({ provider: z.enum(['openrouter','deepseek']), openrouterModel: z.string().trim().min(1).max(200), deepseekModel: z.string().trim().min(1).max(200),
    openrouterKey: z.string().max(1000).optional(), deepseekKey: z.string().max(1000).optional() }).strict().parse(req.body);
  const config = getAiConfig();
  const openrouterKey = input.openrouterKey ? encryptMailSecret(input.openrouterKey.trim()) : config.openrouter_key;
  const deepseekKey = input.deepseekKey ? encryptMailSecret(input.deepseekKey.trim()) : config.deepseek_key;
  db.prepare(`UPDATE mail_ai_config SET provider=?,openrouter_key=?,deepseek_key=?,openrouter_model=?,deepseek_model=?,openrouter_tested=?,deepseek_tested=? WHERE id=1`)
    .run(input.provider,openrouterKey,deepseekKey,input.openrouterModel,input.deepseekModel,
      input.openrouterKey || input.openrouterModel !== config.openrouter_model ? 0 : config.openrouter_tested,
      input.deepseekKey || input.deepseekModel !== config.deepseek_model ? 0 : config.deepseek_tested);
  res.json(publicConfig(getAiConfig()));
}));
router.post('/mail-ai/test', admin, wrap(async (req, res) => {
  const { provider } = z.object({ provider: z.enum(['openrouter','deepseek']) }).strict().parse(req.body);
  const config = { ...getAiConfig(), provider };
  await testAi(config);
  // A concurrent configuration change must not be validated by this test.
  db.prepare(`UPDATE mail_ai_config SET ${provider}_tested=1 WHERE id=1 AND ${provider}_key=? AND ${provider}_model=?`)
    .run(config[`${provider}_key`], config[`${provider}_model`]);
  res.json(publicConfig(getAiConfig()));
}));
router.get('/mail-ai/usage', admin, wrap((_req, res) => res.json({ usage: db.prepare(`SELECT provider,model,SUM(input_tokens) AS inputTokens,SUM(output_tokens) AS outputTokens,
    SUM(cost) AS cost,COUNT(*) AS calls,SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) AS errors FROM mail_ai_usage GROUP BY provider,model`).all() })));

export default router;
