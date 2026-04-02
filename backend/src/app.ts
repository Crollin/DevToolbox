import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import db from './db/database';
import { initializeDatabase } from './db/database';
import { initializeDefaultSnippets } from './db/initSnippets';
import { validateEnv } from './lib/env';
import snippetsRoutes from './routes/snippets';
import hooksRoutes from './routes/hooks';
import queriesRoutes from './routes/queries';
import palettesRoutes from './routes/palettes';
import scriptsRoutes from './routes/scripts';
import wpcliRoutes from './routes/wpcli';
import dockerRoutes from './routes/docker';
import gitRoutes from './routes/git';
import iconsRoutes from './routes/icons';
import licencesRoutes from './routes/licences';
import electricalcRoutes from './routes/electricalc';
import authRoutes from './routes/auth';
import accountRoutes from './routes/account';
import tasksRoutes from './routes/tasks';
import toolsRoutes from './routes/tools';
import kbRoutes from './routes/kb';

validateEnv();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());

// Rate limiting global sur l'API (200 requêtes / 15 min par IP, plus permissif en test)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 200,
  message: { error: 'Trop de requêtes. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Initialiser la base de données
initializeDatabase();
initializeDefaultSnippets();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/snippets', snippetsRoutes);
app.use('/api/hooks', hooksRoutes);
app.use('/api/queries', queriesRoutes);
app.use('/api/palettes', palettesRoutes);
app.use('/api/scripts', scriptsRoutes);
app.use('/api/wpcli', wpcliRoutes);
app.use('/api/docker', dockerRoutes);
app.use('/api/git', gitRoutes);
app.use('/api/icons', iconsRoutes);
app.use('/api/licences', licencesRoutes);
app.use('/api/electricalc', electricalcRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/kb', kbRoutes);

// Route de santé (vérifie la connexion à la base de données)
app.get('/health', (_req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), db: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      db: 'disconnected',
      error: 'Service temporairement indisponible',
    });
  }
});

// Gestionnaire d'erreurs global (doit être après toutes les routes)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Une erreur interne est survenue.'
      : err.message || 'Une erreur interne est survenue.',
  });
});

export default app;
