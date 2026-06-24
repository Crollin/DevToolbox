import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { authenticateToken } from '../middleware/auth';
import {
  sendTestEmail,
  isEmailConfigured,
  loadEmailPreferencesForUser,
} from '../lib/email';
import {
  formatNtfyConfigResponse,
  normalizeNotificationChannels,
  channelsToLegacyType,
  serializeNotificationChannels,
  parseNotificationChannels,
} from '../lib/notificationChannels';
import { testNotifications, NotificationDispatchConfig } from '../lib/notificationDispatch';

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

// GET /api/account/ntfy-config - Alias vers la config ntfy
router.get('/ntfy-config', (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const config = db.prepare('SELECT * FROM ntfy_configs WHERE user_id = ?').get(userId) as {
      enabled: number;
      server_url: string;
      topic: string;
      token: string | null;
      notification_type: string | null;
      notification_channels: string | null;
      telegram_chat_id: string | null;
      auto_reminders_enabled: number | null;
      reminder_frequency: string | null;
      last_reminder_sent_at: string | null;
    } | undefined;

    if (!config) {
      const id = uuidv4();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO ntfy_configs (id, user_id, enabled, server_url, topic, token, notification_type, notification_channels, telegram_chat_id, auto_reminders_enabled, reminder_frequency, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, userId, 0, 'https://ntfy.sh', '', null, 'ntfy', '["ntfy"]', null, 0, 'daily', now, now);

      return res.json(formatNtfyConfigResponse({
        enabled: 0,
        server_url: 'https://ntfy.sh',
        topic: '',
        token: null,
        notification_type: 'ntfy',
        notification_channels: '["ntfy"]',
        telegram_chat_id: null,
        auto_reminders_enabled: 0,
        reminder_frequency: 'daily',
        last_reminder_sent_at: null,
      }));
    }

    res.json(formatNtfyConfigResponse(config));
  } catch (error) {
    console.error('Erreur lors de la récupération de la config ntfy:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la configuration' });
  }
});

// PUT /api/account/ntfy-config - Mettre à jour la config ntfy
router.put('/ntfy-config', (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      enabled,
      serverUrl,
      topic,
      token,
      notificationType,
      notificationChannels,
      telegramChatId,
      autoRemindersEnabled,
      reminderFrequency,
    } = req.body;

    const channels = normalizeNotificationChannels(notificationChannels, notificationType);
    const channelsJson = serializeNotificationChannels(channels);
    const legacyType = channelsToLegacyType(channels);

    const existing = db.prepare('SELECT id FROM ntfy_configs WHERE user_id = ?').get(userId) as { id: string } | undefined;
    const now = new Date().toISOString();

    if (existing) {
      db.prepare(`
        UPDATE ntfy_configs
        SET enabled = ?, server_url = ?, topic = ?, token = ?, notification_type = ?, notification_channels = ?, telegram_chat_id = ?, auto_reminders_enabled = ?, reminder_frequency = ?, updated_at = ?
        WHERE user_id = ?
      `).run(
        enabled ? 1 : 0,
        serverUrl || 'https://ntfy.sh',
        topic || '',
        token || null,
        legacyType,
        channelsJson,
        telegramChatId || null,
        autoRemindersEnabled ? 1 : 0,
        reminderFrequency || 'daily',
        now,
        userId
      );
    } else {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO ntfy_configs (id, user_id, enabled, server_url, topic, token, notification_type, notification_channels, telegram_chat_id, auto_reminders_enabled, reminder_frequency, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        userId,
        enabled ? 1 : 0,
        serverUrl || 'https://ntfy.sh',
        topic || '',
        token || null,
        legacyType,
        channelsJson,
        telegramChatId || null,
        autoRemindersEnabled ? 1 : 0,
        reminderFrequency || 'daily',
        now,
        now
      );
    }

    res.json(formatNtfyConfigResponse({
      enabled: enabled ? 1 : 0,
      server_url: serverUrl || 'https://ntfy.sh',
      topic: topic || '',
      token: token || null,
      notification_type: legacyType,
      notification_channels: channelsJson,
      telegram_chat_id: telegramChatId || null,
      auto_reminders_enabled: autoRemindersEnabled ? 1 : 0,
      reminder_frequency: reminderFrequency || 'daily',
      last_reminder_sent_at: null,
    }));
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la config ntfy:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration' });
  }
});

// POST /api/account/ntfy-config/test - Test des notifications
router.post('/ntfy-config/test', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { notificationType, notificationChannels, serverUrl, topic, token, telegramChatId } = req.body;

    const savedConfig = db.prepare('SELECT * FROM ntfy_configs WHERE user_id = ?').get(userId) as {
      notification_type: string | null;
      notification_channels: string | null;
      server_url: string;
      topic: string;
      token: string | null;
      telegram_chat_id: string | null;
    } | undefined;

    const channels = notificationChannels !== undefined
      ? normalizeNotificationChannels(notificationChannels, notificationType)
      : parseNotificationChannels(
          savedConfig?.notification_type,
          savedConfig?.notification_channels ?? null
        );

    const dispatchConfig: NotificationDispatchConfig = {
      channels,
      serverUrl: serverUrl ?? savedConfig?.server_url ?? 'https://ntfy.sh',
      topic: topic ?? savedConfig?.topic ?? '',
      token: token ?? savedConfig?.token ?? null,
      telegramChatId: telegramChatId ?? savedConfig?.telegram_chat_id ?? null,
    };

    const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId) as { email: string; name: string } | undefined;
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const prefs = loadEmailPreferencesForUser(userId);
    const results = await testNotifications(dispatchConfig, user, prefs);

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

export default router;
