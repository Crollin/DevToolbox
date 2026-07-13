import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { authenticateTokenOrPersonalAccessToken } from '../middleware/auth';
import { ExpiringLicence } from '../lib/email';
import { checkAndSendReminders } from '../lib/licenceReminders';
import {
  formatNtfyConfigResponse,
  normalizeNotificationChannels,
  channelsToLegacyType,
  serializeNotificationChannels,
  parseNotificationChannels,
} from '../lib/notificationChannels';
import { sendLicenceNotifications, testNotifications, NotificationDispatchConfig } from '../lib/notificationDispatch';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateTokenOrPersonalAccessToken('licences'));

type SavedNotificationConfig = {
  notification_type: string | null;
  notification_channels: string | null;
  server_url: string;
  topic: string;
  token: string | null;
  telegram_chat_id: string | null;
};

function resolveNotificationConfig(
  userId: string,
  body: {
    notificationChannels?: unknown;
    notificationType?: string;
    serverUrl?: string;
    topic?: string;
    token?: string;
    telegramChatId?: string;
  }
): SavedNotificationConfig | null {
  if (
    body.notificationChannels !== undefined ||
    body.notificationType !== undefined ||
    body.serverUrl !== undefined ||
    body.topic !== undefined ||
    body.token !== undefined ||
    body.telegramChatId !== undefined
  ) {
    const channels = normalizeNotificationChannels(body.notificationChannels, body.notificationType);
    return {
      notification_type: channelsToLegacyType(channels),
      notification_channels: serializeNotificationChannels(channels),
      server_url: body.serverUrl || 'https://ntfy.sh',
      topic: body.topic || '',
      token: body.token || null,
      telegram_chat_id: body.telegramChatId || null,
    };
  }

  const savedConfig = db.prepare('SELECT * FROM ntfy_configs WHERE user_id = ?').get(userId) as SavedNotificationConfig | undefined;
  return savedConfig ?? null;
}

function toDispatchConfig(config: SavedNotificationConfig): NotificationDispatchConfig {
  return {
    channels: parseNotificationChannels(config.notification_type, config.notification_channels),
    serverUrl: config.server_url || 'https://ntfy.sh',
    topic: config.topic || '',
    token: config.token,
    telegramChatId: config.telegram_chat_id,
  };
}

// Fonction helper pour convertir backend (status, expires_at) vers frontend (isLifetime, renewalDate)
function convertBackendToFrontend(licence: {
  id: string;
  name: string;
  key: string;
  type: string;
  seat_count: number | null;
  status: string;
  expires_at: string | null;
  notes: string | null;
  notifications_enabled: number | null;
  created_at: string;
  updated_at: string;
}) {
  const isLifetime = licence.status === 'lifetime' || licence.status === 'active' && !licence.expires_at;
  const renewalDate = licence.expires_at && licence.status !== 'lifetime' ? licence.expires_at : undefined;

  return {
    id: licence.id,
    name: licence.name,
    key: licence.key,
    type: licence.type as "wordpress" | "saas" | "api" | "autre",
    seatCount: licence.seat_count ?? undefined,
    isLifetime,
    renewalDate,
    notes: licence.notes || undefined,
    notificationsEnabled: licence.notifications_enabled === null || licence.notifications_enabled === 1,
    createdAt: licence.created_at,
  };
}

// Fonction helper pour convertir frontend (isLifetime, renewalDate) vers backend (status, expires_at)
function convertFrontendToBackend(data: {
  name: string;
  key: string;
  type: string;
  seatCount?: number;
  isLifetime: boolean;
  renewalDate?: string;
  notes?: string;
  notificationsEnabled?: boolean;
}) {
  const status = data.isLifetime ? 'lifetime' : (data.renewalDate ? 'active' : 'active');
  const expiresAt = data.isLifetime ? null : (data.renewalDate || null);
  const notificationsEnabled = data.notificationsEnabled !== false ? 1 : 0;
  const seatCount = Number.isInteger(data.seatCount) && (data.seatCount as number) > 0
    ? (data.seatCount as number)
    : null;

  return {
    status,
    expiresAt,
    notificationsEnabled,
    seatCount,
  };
}

// GET /api/licences - Récupérer toutes les licences de l'utilisateur
router.get('/', (req, res) => {
  try {
    const userId = req.user!.id;
    const licences = db.prepare('SELECT * FROM licences WHERE user_id = ? ORDER BY created_at DESC').all(userId) as {
      id: string;
      name: string;
      key: string;
      type: string;
      seat_count: number | null;
      status: string;
      expires_at: string | null;
      notes: string | null;
      notifications_enabled: number | null;
      created_at: string;
      updated_at: string;
    }[];

    const formattedLicences = licences.map(convertBackendToFrontend);

    res.json({ licences: formattedLicences });
  } catch (error) {
    console.error('Erreur lors de la récupération des licences:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des licences' });
  }
});

// POST /api/licences - Créer une licence
router.post('/', (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, key, type, seatCount, isLifetime, renewalDate, notes, notificationsEnabled } = req.body;

    if (!name || !key || !type) {
      return res.status(400).json({ error: 'Nom, clé et type sont requis' });
    }

    const { status, expiresAt, notificationsEnabled: notificationsEnabledValue, seatCount: seatCountValue } = convertFrontendToBackend({
      name,
      key,
      type,
      seatCount,
      isLifetime,
      renewalDate,
      notes,
      notificationsEnabled,
    });
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO licences (id, user_id, name, key, type, seat_count, status, expires_at, notes, notifications_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, userId, name, key, type, seatCountValue, status, expiresAt, notes || null, notificationsEnabledValue, now, now
    );

    const licence = db.prepare('SELECT * FROM licences WHERE id = ?').get(id) as {
      id: string;
      name: string;
      key: string;
      type: string;
      seat_count: number | null;
      status: string;
      expires_at: string | null;
      notes: string | null;
      notifications_enabled: number | null;
      created_at: string;
      updated_at: string;
    };

    res.status(201).json(convertBackendToFrontend(licence));
  } catch (error) {
    console.error('Erreur lors de la création de la licence:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la licence' });
  }
});

// GET /api/licences/ntfy-config - Récupérer la configuration de notifications de l'utilisateur
router.get('/ntfy-config', (req, res) => {
  try {
    const userId = req.user!.id;
    const config = db.prepare('SELECT * FROM ntfy_configs WHERE user_id = ?').get(userId) as {
      enabled: number;
      server_url: string;
      topic: string;
      token: string | null;
      notification_type: string | null;
      auto_reminders_enabled: number | null;
      reminder_frequency: string | null;
      last_reminder_sent_at: string | null;
    } | undefined;

    if (!config) {
      // Créer une configuration par défaut si elle n'existe pas
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
    console.error('Erreur lors de la récupération de la config de notifications:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la configuration de notifications' });
  }
});

// PUT /api/licences/ntfy-config - Mettre à jour la configuration de notifications
router.put('/ntfy-config', (req, res) => {
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
    console.error('Erreur lors de la mise à jour de la config de notifications:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration de notifications' });
  }
});

// POST /api/licences/send-notifications - Envoyer manuellement les notifications
router.post('/send-notifications', async (req, res) => {
  try {
    const userId = req.user!.id;
    const savedConfig = resolveNotificationConfig(userId, req.body);

    if (!savedConfig) {
      return res.status(400).json({ error: 'Configuration de notifications non trouvée' });
    }

    const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId) as {
      email: string;
      name: string;
    } | undefined;

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const licences = db.prepare(`
      SELECT id, name, expires_at, status, notifications_enabled
      FROM licences
      WHERE user_id = ? AND status != 'lifetime' AND (notifications_enabled IS NULL OR notifications_enabled = 1)
    `).all(userId) as Array<{
      id: string;
      name: string;
      expires_at: string | null;
      status: string;
      notifications_enabled: number | null;
    }>;

    const licencesToNotify: ExpiringLicence[] = [];
    for (const licence of licences) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = licence.expires_at ? new Date(licence.expires_at) : null;
      if (expiry) {
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - today.getTime();
        const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 30) {
          licencesToNotify.push({
            name: licence.name,
            daysUntilExpiry,
            isExpired: daysUntilExpiry < 0,
          });
        }
      }
    }

    if (licencesToNotify.length === 0) {
      return res.json({ message: 'Aucune licence nécessitant une notification', sent: false });
    }

    const results = await sendLicenceNotifications(toDispatchConfig(savedConfig), user, licencesToNotify);

    res.json({
      message: 'Notifications envoyées',
      sent: true,
      results,
      licencesCount: licencesToNotify.length,
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi des notifications:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi des notifications' });
  }
});

// POST /api/licences/test-notifications - Tester les configurations de notifications
router.post('/test-notifications', async (req, res) => {
  try {
    const userId = req.user!.id;
    const savedConfig = resolveNotificationConfig(userId, req.body);

    if (!savedConfig) {
      return res.status(400).json({ error: 'Configuration de notifications non trouvée' });
    }

    const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId) as {
      email: string;
      name: string;
    } | undefined;

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const results = await testNotifications(toDispatchConfig(savedConfig), user);

    res.json({
      message: 'Test de notifications effectué',
      results,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Erreur lors du test des notifications:', error);
    res.status(500).json({ error: 'Erreur lors du test des notifications' });
  }
});

// POST /api/licences/check-expiring - Vérifier et envoyer les rappels automatiques
router.post('/check-expiring', async (req, res) => {
  try {
    await checkAndSendReminders();
    res.json({ message: 'Vérification des rappels effectuée' });
  } catch (error) {
    console.error('Erreur lors de la vérification des rappels:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification des rappels' });
  }
});

// PUT /api/licences/:id - Mettre à jour une licence
router.put('/:id', (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, key, type, seatCount, isLifetime, renewalDate, notes, notificationsEnabled } = req.body;

    // Vérifier que la licence appartient à l'utilisateur
    const existing = db.prepare('SELECT * FROM licences WHERE id = ? AND user_id = ?').get(req.params.id, userId) as {
      id: string;
    } | undefined;

    if (!existing) {
      return res.status(404).json({ error: 'Licence non trouvée' });
    }

    const { status, expiresAt, notificationsEnabled: notificationsEnabledValue, seatCount: seatCountValue } = convertFrontendToBackend({
      name,
      key,
      type,
      seatCount,
      isLifetime,
      renewalDate,
      notes,
      notificationsEnabled,
    });
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE licences
      SET name = ?, key = ?, type = ?, seat_count = ?, status = ?, expires_at = ?, notes = ?, notifications_enabled = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name, key, type, seatCountValue, status, expiresAt, notes || null, notificationsEnabledValue, now, req.params.id, userId
    ) as { changes: number };

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Licence non trouvée' });
    }

    const updated = db.prepare('SELECT * FROM licences WHERE id = ?').get(req.params.id) as {
      id: string;
      name: string;
      key: string;
      type: string;
      seat_count: number | null;
      status: string;
      expires_at: string | null;
      notes: string | null;
      notifications_enabled: number | null;
      created_at: string;
      updated_at: string;
    };

    res.json(convertBackendToFrontend(updated));
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la licence:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la licence' });
  }
});

// DELETE /api/licences/:id - Supprimer une licence
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user!.id;
    const result = db.prepare('DELETE FROM licences WHERE id = ? AND user_id = ?').run(req.params.id, userId) as { changes: number };
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Licence non trouvée' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la licence:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la licence' });
  }
});

export default router;
