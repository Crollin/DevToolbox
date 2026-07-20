import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db/database';

// Étendre l'interface Request pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        preferences?: Record<string, unknown>;
      };
    }
  }
}

const _jwtSecret = process.env.NODE_ENV === 'production'
  ? process.env.JWT_SECRET
  : (process.env.JWT_SECRET || 'dev-secret-change-in-production');

if (!_jwtSecret) {
  throw new Error('JWT_SECRET is required');
}

const JWT_SECRET: string = _jwtSecret;

export interface JWTPayload {
  userId: string;
  email: string;
}

export const PERSONAL_ACCESS_TOKEN_SCOPES = ['licences', 'tasks', 'knowledge_base'] as const;
export type PersonalAccessTokenScope = (typeof PERSONAL_ACCESS_TOKEN_SCOPES)[number];

function getBearerToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader) return undefined;
  const [scheme, token] = authHeader.split(' ');
  return scheme?.toLowerCase() === 'bearer' ? token : undefined;
}

export function hashTokenForStorage(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function authenticatePersonalAccessToken(req: Request, token: string, requiredScope: string): boolean {
  const record = db.prepare(`
    SELECT pat.scope, pat.expires_at, pat.revoked_at,
           users.id, users.email, users.name, users.preferences
    FROM personal_access_tokens pat
    INNER JOIN users ON users.id = pat.user_id
    WHERE pat.token_hash = ?
  `).get(hashTokenForStorage(token)) as {
    scope: string;
    expires_at: string | null;
    revoked_at: string | null;
    id: string;
    email: string;
    name: string;
    preferences?: string | null;
  } | undefined;

  if (!record || record.revoked_at || (record.expires_at && new Date(record.expires_at) <= new Date())) return false;
  if (!record.scope.split(/\s+/).includes(requiredScope)) return false;

  let preferences: Record<string, unknown> | undefined;
  if (record.preferences) {
    try { preferences = JSON.parse(record.preferences) as Record<string, unknown>; } catch { preferences = {}; }
  }
  req.user = { id: record.id, email: record.email, name: record.name, preferences };
  return true;
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Token d\'authentification manquant' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Vérifier que l'utilisateur existe toujours
    const user = db.prepare('SELECT id, email, name, preferences FROM users WHERE id = ?').get(decoded.userId) as {
      id: string;
      email: string;
      name: string;
      preferences?: string | null;
    } | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    let preferences: Record<string, unknown> | undefined;
    if (user.preferences) {
      try {
        preferences = JSON.parse(user.preferences) as Record<string, unknown>;
      } catch {
        preferences = {};
      }
    }

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      preferences,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expiré' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    return res.status(500).json({ error: 'Erreur lors de la vérification du token' });
  }
}

export function authenticateTokenOrPersonalAccessToken(requiredScope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "Token d'authentification manquant" });
    if (token.startsWith('dt_')) {
      if (authenticatePersonalAccessToken(req, token, requiredScope)) return next();
      return res.status(401).json({ error: 'Token personnel invalide, expiré ou révoqué' });
    }
    return authenticateToken(req, res, next);
  };
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Token valide 7 jours
  });
}

