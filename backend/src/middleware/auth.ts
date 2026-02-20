import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

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

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Token valide 7 jours
  });
}



