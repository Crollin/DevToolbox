import express from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { sendLicenceExpirationEmail, ExpiringLicence } from '../lib/email';
import { checkAndSendReminders } from '../lib/licenceReminders';
import { isEmailConfigured } from '../lib/email';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Fonction helper pour convertir backend (status, expires_at) vers frontend (isLifetime, renewalDate)
function convertBackendToFrontend(licence: {
  id: string;
  name: string;
  key: string;
  type: string;
  status: string;
  expires_at: string | null;
  notes: string | null;
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
    isLifetime,
    renewalDate,
    notes: licence.notes || undefined,
    createdAt: licence.created_at,
  };
}

// Fonction helper pour convertir frontend (isLifetime, renewalDate) vers backend (status, expires_at)
function convertFrontendToBackend(data: {
  name: string;
  key: string;
  type: string;
  isLifetime: boolean;
  renewalDate?: string;
  notes?: string;
}) {
  const status = data.isLifetime ? 'lifetime' : (data.renewalDate ? 'active' : 'active');
  const expiresAt = data.isLifetime ? null : (data.renewalDate || null);

  return {
    status,
    expiresAt,
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
      status: string;
      expires_at: string | null;
      notes: string | null;
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
    const { name, key, type, isLifetime, renewalDate, notes } = req.body;

    if (!name || !key || !type) {
      return res.status(400).json({ error: 'Nom, clé et type sont requis' });
    }

    const { status, expiresAt } = convertFrontendToBackend({ name, key, type, isLifetime, renewalDate, notes });
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO licences (id, user_id, name, key, type, status, expires_at, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, userId, name, key, type, status, expiresAt, notes || null, now, now
    );

    const licence = db.prepare('SELECT * FROM licences WHERE id = ?').get(id) as {
      id: string;
      name: string;
      key: string;
      type: string;
      status: string;
      expires_at: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
    };

    res.status(201).json(convertBackendToFrontend(licence));
  } catch (error) {
    console.error('Erreur lors de la création de la licence:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la licence' });
  }
});

// PUT /api/licences/:id - Mettre à jour une licence
router.put('/:id', (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, key, type, isLifetime, renewalDate, notes } = req.body;

    // Vérifier que la licence appartient à l'utilisateur
    const existing = db.prepare('SELECT * FROM licences WHERE id = ? AND user_id = ?').get(req.params.id, userId) as {
      id: string;
    } | undefined;

    if (!existing) {
      return res.status(404).json({ error: 'Licence non trouvée' });
    }

    const { status, expiresAt } = convertFrontendToBackend({ name, key, type, isLifetime, renewalDate, notes });
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE licences
      SET name = ?, key = ?, type = ?, status = ?, expires_at = ?, notes = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name, key, type, status, expiresAt, notes || null, now, req.params.id, userId
    ) as { changes: number };

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Licence non trouvée' });
    }

    const updated = db.prepare('SELECT * FROM licences WHERE id = ?').get(req.params.id) as {
      id: string;
      name: string;
      key: string;
      type: string;
      status: string;
      expires_at: string | null;
      notes: string | null;
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
        INSERT INTO ntfy_configs (id, user_id, enabled, server_url, topic, token, notification_type, auto_reminders_enabled, reminder_frequency, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, userId, 0, 'https://ntfy.sh', '', null, 'ntfy', 0, 'daily', now, now);

      return res.json({
        enabled: false,
        serverUrl: 'https://ntfy.sh',
        topic: '',
        token: undefined,
        notificationType: 'ntfy',
        autoRemindersEnabled: false,
        reminderFrequency: 'daily',
        lastReminderSentAt: undefined,
        emailConfigured: isEmailConfigured(),
      });
    }

    res.json({
      enabled: config.enabled === 1,
      serverUrl: config.server_url,
      topic: config.topic,
      token: config.token || undefined,
      notificationType: config.notification_type || 'ntfy',
      autoRemindersEnabled: config.auto_reminders_enabled === 1,
      reminderFrequency: config.reminder_frequency || 'daily',
      lastReminderSentAt: config.last_reminder_sent_at || undefined,
      emailConfigured: isEmailConfigured(),
    });
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
      autoRemindersEnabled,
      reminderFrequency,
    } = req.body;

    const existing = db.prepare('SELECT id FROM ntfy_configs WHERE user_id = ?').get(userId) as { id: string } | undefined;
    const now = new Date().toISOString();

    if (existing) {
      db.prepare(`
        UPDATE ntfy_configs
        SET enabled = ?, server_url = ?, topic = ?, token = ?, notification_type = ?, auto_reminders_enabled = ?, reminder_frequency = ?, updated_at = ?
        WHERE user_id = ?
      `).run(
        enabled ? 1 : 0,
        serverUrl || 'https://ntfy.sh',
        topic || '',
        token || null,
        notificationType || 'ntfy',
        autoRemindersEnabled ? 1 : 0,
        reminderFrequency || 'daily',
        now,
        userId
      );
    } else {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO ntfy_configs (id, user_id, enabled, server_url, topic, token, notification_type, auto_reminders_enabled, reminder_frequency, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        userId,
        enabled ? 1 : 0,
        serverUrl || 'https://ntfy.sh',
        topic || '',
        token || null,
        notificationType || 'ntfy',
        autoRemindersEnabled ? 1 : 0,
        reminderFrequency || 'daily',
        now,
        now
      );
    }

    res.json({
      enabled: enabled || false,
      serverUrl: serverUrl || 'https://ntfy.sh',
      topic: topic || '',
      token: token || undefined,
      notificationType: notificationType || 'ntfy',
      autoRemindersEnabled: autoRemindersEnabled || false,
      reminderFrequency: reminderFrequency || 'daily',
      emailConfigured: isEmailConfigured(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la config de notifications:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration de notifications' });
  }
});

// POST /api/licences/send-notifications - Envoyer manuellement les notifications
router.post('/send-notifications', async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Récupérer la configuration
    const config = db.prepare('SELECT * FROM ntfy_configs WHERE user_id = ?').get(userId) as {
      notification_type: string;
      server_url: string;
      topic: string;
      token: string | null;
    } | undefined;

    if (!config) {
      return res.status(400).json({ error: 'Configuration de notifications non trouvée' });
    }

    // Récupérer l'utilisateur
    const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId) as {
      email: string;
      name: string;
    } | undefined;

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Récupérer les licences expirantes
    const licences = db.prepare(`
      SELECT id, name, expires_at, status
      FROM licences
      WHERE user_id = ? AND status != 'lifetime'
    `).all(userId) as Array<{
      id: string;
      name: string;
      expires_at: string | null;
      status: string;
    }>;

    // Calculer les jours jusqu'à expiration
    const licencesToNotify: ExpiringLicence[] = [];
    for (const licence of licences) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = licence.expires_at ? new Date(licence.expires_at) : null;
      if (expiry) {
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - today.getTime();
        const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Inclure les licences expirées ou expirant dans moins de 30 jours
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

    const results: { ntfy?: boolean; email?: boolean } = {};

    // Envoyer Ntfy si configuré
    if (config.notification_type === 'ntfy' || config.notification_type === 'both') {
      if (!config.topic) {
        results.ntfy = false;
      } else {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'text/plain',
            Title: `🔑 Licences à renouveler (${licencesToNotify.length})`,
            Priority: licencesToNotify.some((l) => l.isExpired) ? 'high' : 'default',
            Tags: licencesToNotify.some((l) => l.isExpired) ? 'warning,key' : 'key',
          };

          if (config.token) {
            headers['Authorization'] = `Bearer ${config.token}`;
          }

          const message = licencesToNotify
            .map((l) => {
              if (l.isExpired) {
                return `❌ ${l.name} - Expirée depuis ${Math.abs(l.daysUntilExpiry)} jours`;
              }
              return `⚠️ ${l.name} - ${l.daysUntilExpiry} jours restants`;
            })
            .join('\n');

          const response = await fetch(`${config.server_url}/${config.topic}`, {
            method: 'POST',
            headers,
            body: message,
          });

          results.ntfy = response.ok;
        } catch (error) {
          console.error('Erreur lors de l\'envoi Ntfy:', error);
          results.ntfy = false;
        }
      }
    }

    // Envoyer Email si configuré
    if (config.notification_type === 'email' || config.notification_type === 'both') {
      results.email = await sendLicenceExpirationEmail(user.email, user.name, licencesToNotify);
    }

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

export default router;

