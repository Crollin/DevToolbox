import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { generateToken, authenticateToken, hashTokenForStorage, PERSONAL_ACCESS_TOKEN_SCOPES, PersonalAccessTokenScope } from '../middleware/auth';
import { sendConfirmationEmail, sendPasswordResetEmail, isEmailConfigured } from '../lib/email';

const router = express.Router();

function serializePersonalAccessToken(row: { id: string; name: string; scope: string; expires_at: string | null; revoked_at: string | null; created_at: string }) {
  return { id: row.id, name: row.name, scope: row.scope.split(/\s+/).filter(Boolean), expiresAt: row.expires_at, revokedAt: row.revoked_at, createdAt: row.created_at };
}

// Rate limiter pour login et register : 10 requêtes / 15 min par IP (désactivé en test)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/register - Inscription
router.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, mot de passe et nom sont requis' });
    }

    // Vérifier le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }

    // Vérifier la longueur du mot de passe
    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Vérifier si l'email existe déjà
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
    if (existingUser) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, email, passwordHash, name, now, now);

    // Générer le token JWT
    const token = generateToken({ userId: id, email });

    // Créer la configuration Ntfy par défaut
    const ntfyConfigId = uuidv4();
    db.prepare(`
      INSERT INTO ntfy_configs (id, user_id, enabled, server_url, topic, token, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ntfyConfigId,
      id,
      0,
      'https://ntfy.sh',
      '',
      null,
      now,
      now
    );

    // Envoyer l'email de confirmation (ne pas bloquer l'inscription si ça échoue)
    let emailSent = false;
    if (process.env.NODE_ENV !== 'test') {
      try {
        emailSent = await sendConfirmationEmail(email, name);
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email de confirmation (non bloquant):', emailError);
      }
    }

    res.status(201).json({
      token,
      user: {
        id,
        email,
        name,
        preferences: {},
      },
      emailSent,
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// POST /api/auth/login - Connexion
router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe sont requis' });
    }

    // Récupérer l'utilisateur
    const user = db.prepare('SELECT id, email, password_hash, name, preferences FROM users WHERE email = ?').get(email) as {
      id: string;
      email: string;
      password_hash: string;
      name: string;
      preferences?: string | null;
    } | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    let preferences: Record<string, unknown> | undefined;
    if (user.preferences) {
      try {
        preferences = JSON.parse(user.preferences) as Record<string, unknown>;
      } catch {
        preferences = {};
      }
    }

    // Générer le token JWT
    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

router.post('/personal-tokens', authenticateToken, (req: Request, res: Response) => {
  const { name, expiresAt, scopes } = req.body as { name?: string; expiresAt?: string | null; scopes?: unknown };
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) return res.status(400).json({ error: 'Le nom du token est requis' });
  if (trimmedName.length > 100) return res.status(400).json({ error: 'Le nom du token est trop long' });

  let normalizedExpiry: string | null = null;
  if (expiresAt !== undefined && expiresAt !== null && expiresAt !== '') {
    const expiry = new Date(expiresAt);
    if (Number.isNaN(expiry.getTime()) || expiry <= new Date()) return res.status(400).json({ error: "La date d'expiration est invalide" });
    normalizedExpiry = expiry.toISOString();
  }

  const requestedScopes = Array.isArray(scopes) ? scopes : ['licences'];
  const normalizedScopes = [...new Set(
    requestedScopes.filter((scope): scope is PersonalAccessTokenScope =>
      typeof scope === 'string' && PERSONAL_ACCESS_TOKEN_SCOPES.includes(scope as PersonalAccessTokenScope)
    )
  )];
  if (normalizedScopes.length === 0) {
    return res.status(400).json({ error: 'Sélectionnez au moins un périmètre pour le token' });
  }
  const scope = normalizedScopes.join(' ');

  const id = uuidv4();
  const rawToken = `dt_${crypto.randomBytes(32).toString('hex')}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO personal_access_tokens (id, user_id, name, token_hash, scope, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.id, trimmedName, hashTokenForStorage(rawToken), scope, normalizedExpiry, now);

  res.status(201).json({ token: rawToken, personalAccessToken: { id, name: trimmedName, scope: normalizedScopes, expiresAt: normalizedExpiry, revokedAt: null, createdAt: now } });
});

router.get('/personal-tokens', authenticateToken, (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT id, name, scope, expires_at, revoked_at, created_at
    FROM personal_access_tokens WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user!.id) as Array<{ id: string; name: string; scope: string; expires_at: string | null; revoked_at: string | null; created_at: string }>;
  res.json({ personalAccessTokens: rows.map(serializePersonalAccessToken) });
});

router.delete('/personal-tokens/:id/permanent', authenticateToken, (req: Request, res: Response) => {
  const result = db.prepare(`
    DELETE FROM personal_access_tokens
    WHERE id = ? AND user_id = ? AND revoked_at IS NOT NULL
  `).run(req.params.id, req.user!.id) as { changes: number };
  if (result.changes === 0) return res.status(404).json({ error: 'Token révoqué non trouvé' });
  res.json({ success: true });
});

router.delete('/personal-tokens/:id', authenticateToken, (req: Request, res: Response) => {
  const result = db.prepare(`
    UPDATE personal_access_tokens SET revoked_at = ?
    WHERE id = ? AND user_id = ? AND revoked_at IS NULL
  `).run(new Date().toISOString(), req.params.id, req.user!.id) as { changes: number };
  if (result.changes === 0) return res.status(404).json({ error: 'Token non trouvé' });
  res.json({ success: true });
});

const VALID_THEMES = ['light', 'dark', 'system'];

// PUT /api/auth/profile - Mettre à jour le profil (nom, préférences)
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, preferences } = req.body;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (typeof name === 'string') {
      const trimmed = name.trim();
      if (!trimmed) {
        return res.status(400).json({ error: 'Le nom ne peut pas être vide' });
      }
      updates.push('name = ?');
      values.push(trimmed);
    }

    if (typeof preferences === 'object' && preferences !== null) {
      const currentUser = db.prepare('SELECT preferences FROM users WHERE id = ?').get(userId) as { preferences?: string | null } | undefined;
      let mergedPrefs: Record<string, unknown> = {};
      if (currentUser?.preferences) {
        try {
          mergedPrefs = JSON.parse(currentUser.preferences) as Record<string, unknown>;
        } catch {
          mergedPrefs = {};
        }
      }
      mergedPrefs = { ...mergedPrefs, ...preferences };
      if (typeof mergedPrefs.theme === 'string' && !VALID_THEMES.includes(mergedPrefs.theme)) {
        return res.status(400).json({ error: 'Thème invalide. Valeurs acceptées: light, dark, system' });
      }
      updates.push('preferences = ?');
      values.push(JSON.stringify(mergedPrefs));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour (name ou preferences requis)' });
    }

    const now = new Date().toISOString();
    updates.push('updated_at = ?');
    values.push(now);
    values.push(userId);

    const result = db.prepare(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values) as { changes: number };

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const updated = db.prepare('SELECT id, email, name, preferences FROM users WHERE id = ?').get(userId) as {
      id: string;
      email: string;
      name: string;
      preferences?: string | null;
    };
    let prefs: Record<string, unknown> | undefined;
    if (updated.preferences) {
      try {
        prefs = JSON.parse(updated.preferences) as Record<string, unknown>;
      } catch {
        prefs = {};
      }
    }

    res.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        preferences: prefs,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// PUT /api/auth/change-password - Changer le mot de passe
router.put('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Le mot de passe actuel et le nouveau mot de passe sont requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as {
      password_hash: string;
    } | undefined;

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = ?
      WHERE id = ?
    `).run(passwordHash, now, userId);

    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email) as {
      id: string;
      email: string;
      name: string;
    } | undefined;

    // Réponse générique pour ne pas révéler si l'email existe
    if (!user || !isEmailConfigured()) {
      return res.json({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
    db.prepare(`
      INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), user.id, tokenHash, expiresAt, now);

    await sendPasswordResetEmail(user.email, user.name, rawToken);

    res.json({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (error) {
    console.error('Erreur forgot-password:', error);
    res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const row = db.prepare(`
      SELECT user_id, expires_at FROM password_reset_tokens WHERE token_hash = ?
    `).get(tokenHash) as { user_id: string; expires_at: string } | undefined;

    if (!row || new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Lien invalide ou expiré' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(passwordHash, now, row.user_id);
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(row.user_id);

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur reset-password:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
});

// GET /api/auth/me - Récupérer l'utilisateur actuel (utilise le middleware authenticateToken)
router.get('/me', authenticateToken, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;
