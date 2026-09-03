import express, { Request, Response } from 'express';
import db from '../db/database';
import { authenticateToken } from '../middleware/auth';
import {
  sendTestEmail,
  isEmailConfigured,
  loadEmailPreferencesForUser,
} from '../lib/email';
import { parseNotificationChannels } from '../lib/notificationChannels';
import { getOrCreateNtfyConfig, upsertNtfyConfig } from '../lib/ntfyConfig';
import { testNotifications, NotificationDispatchConfig } from '../lib/notificationDispatch';
import { isDomainHubEnabled } from '../lib/features';
import {
  getCredentialsRow,
  toPublic,
  upsertCredentials,
} from '../lib/domainHubCredentials';
import {
  countPushSubscriptions,
  deleteAllPushSubscriptions,
  deletePushSubscription,
  getVapidPublicKey,
  isWebPushConfigured,
  sendWebPushToUser,
  upsertPushSubscription,
} from '../lib/webPush';

const router = express.Router();
router.use(authenticateToken);

// GET /api/account/smtp-config - Récupérer la configuration SMTP (pass masqué)
router.get('/smtp-config', (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT host, port, user, pass, from_email FROM smtp_config WHERE id = 1').get() as {
      host: string | null;
      port: number | null;
      user: string | null;
      pass: string | null;
      from_email: string | null;
    } | undefined;

    if (!row || !row.host) {
      return res.json({
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS ? '***' : '',
        fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || '',
        source: 'env',
      });
    }

    res.json({
      host: row.host,
      port: row.port || 587,
      user: row.user,
      pass: row.pass ? '***' : '',
      fromEmail: row.from_email || row.user || '',
      source: 'db',
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la config SMTP:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la configuration SMTP' });
  }
});

// PUT /api/account/smtp-config - Mettre à jour la configuration SMTP
router.put('/smtp-config', (req: Request, res: Response) => {
  try {
    const { host, port, user, pass, fromEmail } = req.body;

    if (!host || !user) {
      return res.status(400).json({ error: 'Host et user sont requis' });
    }

    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id, pass FROM smtp_config WHERE id = 1').get() as {
      id: number;
      pass: string | null;
    } | undefined;

    const passToUse = pass && pass !== '***' ? pass : (existing?.pass ?? null);
    const portNum = port ? parseInt(String(port), 10) : 587;

    if (existing) {
      db.prepare(`
        UPDATE smtp_config
        SET host = ?, port = ?, user = ?, pass = ?, from_email = ?, updated_at = ?
        WHERE id = 1
      `).run(host, portNum, user, passToUse, fromEmail || user || null, now);
    } else {
      db.prepare(`
        INSERT INTO smtp_config (id, host, port, user, pass, from_email, updated_at)
        VALUES (1, ?, ?, ?, ?, ?, ?)
      `).run(host, portNum, user, passToUse, fromEmail || user || null, now);
    }

    res.json({
      host,
      port: portNum,
      user,
      pass: passToUse ? '***' : '',
      fromEmail: fromEmail || user || '',
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la config SMTP:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration SMTP' });
  }
});

// POST /api/account/smtp-config/test - Envoyer un email de test
router.post('/smtp-config/test', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId) as {
      email: string;
      name: string;
    } | undefined;

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const prefs = loadEmailPreferencesForUser(userId);
    const sent = await sendTestEmail(user.email, user.name, prefs);

    if (sent) {
      res.json({ success: true, message: 'Email de test envoyé' });
    } else {
      res.status(500).json({ error: 'Échec de l\'envoi. Vérifiez votre configuration SMTP.' });
    }
  } catch (error) {
    console.error('Erreur lors du test SMTP:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de test' });
  }
});

// GET /api/account/ntfy-config
router.get('/ntfy-config', (req: Request, res: Response) => {
  try {
    res.json(getOrCreateNtfyConfig(req.user!.id));
  } catch (error) {
    console.error('Erreur lors de la récupération de la config ntfy:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la configuration' });
  }
});

// PUT /api/account/ntfy-config
router.put('/ntfy-config', (req: Request, res: Response) => {
  try {
    res.json(upsertNtfyConfig(req.user!.id, req.body));
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la config ntfy:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration' });
  }
});

// POST /api/account/ntfy-config/test
router.post('/ntfy-config/test', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { notificationChannels, notificationType, serverUrl, topic, token, telegramChatId } = req.body;

    const savedConfig = db.prepare('SELECT * FROM ntfy_configs WHERE user_id = ?').get(userId) as {
      notification_type: string | null;
      notification_channels: string | null;
      server_url: string;
      topic: string;
      token: string | null;
      telegram_chat_id: string | null;
    } | undefined;

    const channels =
      notificationChannels !== undefined || notificationType !== undefined
        ? parseNotificationChannels(notificationChannels, notificationType)
        : parseNotificationChannels(
            savedConfig?.notification_channels ?? null,
            savedConfig?.notification_type
          );

    const dispatchConfig: NotificationDispatchConfig = {
      channels,
      serverUrl: serverUrl ?? savedConfig?.server_url ?? 'https://ntfy.sh',
      topic: topic ?? savedConfig?.topic ?? '',
      token: token ?? savedConfig?.token ?? null,
      telegramChatId: telegramChatId ?? savedConfig?.telegram_chat_id ?? null,
    };

    const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId) as
      | { email: string; name: string }
      | undefined;
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const prefs = loadEmailPreferencesForUser(userId);
    const results = await testNotifications(dispatchConfig, user, prefs, userId);

    res.json({
      message: 'Test effectué',
      results,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Erreur lors du test des notifications:', error);
    res.status(500).json({ error: 'Erreur lors du test des notifications' });
  }
});

// GET /api/account/push/vapid-public-key
router.get('/push/vapid-public-key', (_req: Request, res: Response) => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return res.status(503).json({ error: 'Web Push non configuré (VAPID manquant)' });
  }
  res.json({ publicKey });
});

// GET /api/account/push/subscriptions
router.get('/push/subscriptions', (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const count = countPushSubscriptions(userId);
    res.json({
      count,
      enabled: count > 0,
      configured: isWebPushConfigured(),
    });
  } catch (error) {
    console.error('Erreur push subscriptions GET:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des abonnements push' });
  }
});

// POST /api/account/push/subscriptions
router.post('/push/subscriptions', (req: Request, res: Response) => {
  try {
    if (!isWebPushConfigured()) {
      return res.status(503).json({ error: 'Web Push non configuré (VAPID manquant)' });
    }

    const userId = req.user!.id;
    const { endpoint, keys } = req.body as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Subscription invalide (endpoint, keys.p256dh, keys.auth requis)' });
    }

    upsertPushSubscription(
      userId,
      { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
      req.get('user-agent')
    );

    res.status(201).json({
      message: 'Abonnement enregistré',
      count: countPushSubscriptions(userId),
      enabled: true,
    });
  } catch (error) {
    console.error('Erreur push subscriptions POST:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'abonnement' });
  }
});

// DELETE /api/account/push/subscriptions
router.delete('/push/subscriptions', (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const endpoint = (req.body as { endpoint?: string } | undefined)?.endpoint;

    if (endpoint) {
      const deleted = deletePushSubscription(userId, endpoint);
      return res.json({
        message: deleted ? 'Abonnement supprimé' : 'Abonnement introuvable',
        count: countPushSubscriptions(userId),
        enabled: countPushSubscriptions(userId) > 0,
      });
    }

    const removed = deleteAllPushSubscriptions(userId);
    res.json({
      message: `${removed} abonnement(s) supprimé(s)`,
      count: 0,
      enabled: false,
    });
  } catch (error) {
    console.error('Erreur push subscriptions DELETE:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'abonnement' });
  }
});

// POST /api/account/push/test — test Web Push seul
router.post('/push/test', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    if (!isWebPushConfigured()) {
      return res.status(503).json({ error: 'Web Push non configuré (VAPID manquant)' });
    }

    const result = await sendWebPushToUser(userId, {
      title: 'Test DevToolbox',
      body: 'Ceci est un test de notification navigateur (PWA). ✅',
      url: '/account',
    });

    if (result.count === 0 && !result.sent) {
      return res.status(400).json({
        error: result.error || 'Aucun appareil abonné',
        results: { webpush: false },
      });
    }

    res.json({
      message: 'Notification push envoyée',
      results: { webpush: result.sent },
      count: result.count,
      errors: result.error ? { webpush: result.error } : undefined,
    });
  } catch (error) {
    console.error('Erreur push test:', error);
    res.status(500).json({ error: 'Erreur lors du test Web Push' });
  }
});

// GET /api/account/email-preferences
router.get('/email-preferences', (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const row = db.prepare('SELECT * FROM user_email_preferences WHERE user_id = ?').get(userId) as {
      company_name: string | null;
      signature: string | null;
      primary_color: string | null;
      secondary_color: string | null;
      logo_url: string | null;
      welcome_text: string | null;
      licences_text: string | null;
      tasks_text: string | null;
    } | undefined;

    if (!row) {
      return res.json({
        companyName: '',
        signature: '',
        primaryColor: '#0066CC',
        secondaryColor: '#004499',
        logoUrl: '',
        welcomeText: '',
        licencesText: '',
        tasksText: '',
      });
    }

    res.json({
      companyName: row.company_name || '',
      signature: row.signature || '',
      primaryColor: row.primary_color || '#0066CC',
      secondaryColor: row.secondary_color || '#004499',
      logoUrl: row.logo_url || '',
      welcomeText: row.welcome_text || '',
      licencesText: row.licences_text || '',
      tasksText: row.tasks_text || '',
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des préférences email:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des préférences' });
  }
});

// PUT /api/account/email-preferences
router.put('/email-preferences', (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      companyName,
      signature,
      primaryColor,
      secondaryColor,
      logoUrl,
      welcomeText,
      licencesText,
      tasksText,
    } = req.body;

    const now = new Date().toISOString();
    const existing = db.prepare('SELECT user_id FROM user_email_preferences WHERE user_id = ?').get(userId);

    if (existing) {
      db.prepare(`
        UPDATE user_email_preferences
        SET company_name = ?, signature = ?, primary_color = ?, secondary_color = ?, logo_url = ?,
            welcome_text = ?, licences_text = ?, tasks_text = ?, updated_at = ?
        WHERE user_id = ?
      `).run(
        companyName || null,
        signature || null,
        primaryColor || '#0066CC',
        secondaryColor || '#004499',
        logoUrl || null,
        welcomeText || null,
        licencesText || null,
        tasksText || null,
        now,
        userId
      );
    } else {
      db.prepare(`
        INSERT INTO user_email_preferences (user_id, company_name, signature, primary_color, secondary_color, logo_url, welcome_text, licences_text, tasks_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        companyName || null,
        signature || null,
        primaryColor || '#0066CC',
        secondaryColor || '#004499',
        logoUrl || null,
        welcomeText || null,
        licencesText || null,
        tasksText || null,
        now,
        now
      );
    }

    res.json({
      companyName: companyName || '',
      signature: signature || '',
      primaryColor: primaryColor || '#0066CC',
      secondaryColor: secondaryColor || '#004499',
      logoUrl: logoUrl || '',
      welcomeText: welcomeText || '',
      licencesText: licencesText || '',
      tasksText: tasksText || '',
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences email:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des préférences' });
  }
});

function requireDomainHub(_req: Request, res: Response): boolean {
  if (!isDomainHubEnabled()) {
    res.status(404).json({ error: 'Domain Hub désactivé' });
    return false;
  }
  return true;
}

router.get('/domain-hub-credentials', (req, res) => {
  if (!requireDomainHub(req, res)) return;
  try {
    res.json(toPublic(getCredentialsRow(req.user!.id)));
  } catch (error) {
    console.error('Erreur domain-hub-credentials GET:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des clés Domain Hub' });
  }
});

router.put('/domain-hub-credentials', (req, res) => {
  if (!requireDomainHub(req, res)) return;
  try {
    res.json(upsertCredentials(req.user!.id, req.body || {}));
  } catch (error) {
    console.error('Erreur domain-hub-credentials PUT:', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde des clés Domain Hub' });
  }
});

export default router;
