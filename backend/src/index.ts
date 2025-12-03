import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/database';
import { initializeDefaultSnippets } from './db/initSnippets';
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
import { checkAndSendReminders } from './lib/licenceReminders';

const app = express();
const PORT = process.env.PORT || 1400;

// Middleware
app.use(cors());
app.use(express.json());

// Initialiser la base de données
initializeDatabase();
initializeDefaultSnippets();

// Routes
app.use('/api/auth', authRoutes);
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

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
  
  // Démarrer le système de rappels automatiques pour les licences
  // Vérification toutes les heures (3600000 ms)
  const REMINDER_CHECK_INTERVAL = 60 * 60 * 1000; // 1 heure
  
  // Exécuter immédiatement au démarrage (après un court délai pour laisser la DB s'initialiser)
  setTimeout(() => {
    console.log('🔔 Vérification initiale des rappels de licences...');
    checkAndSendReminders().catch((error) => {
      console.error('Erreur lors de la vérification initiale des rappels:', error);
    });
  }, 5000); // 5 secondes après le démarrage
  
  // Puis exécuter périodiquement
  setInterval(() => {
    console.log('🔔 Vérification périodique des rappels de licences...');
    checkAndSendReminders().catch((error) => {
      console.error('Erreur lors de la vérification périodique des rappels:', error);
    });
  }, REMINDER_CHECK_INTERVAL);
  
  console.log(`⏰ Système de rappels automatiques activé (vérification toutes les heures)`);
});

