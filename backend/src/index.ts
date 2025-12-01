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

const app = express();
const PORT = process.env.PORT || 1400;

// Middleware
app.use(cors());
app.use(express.json());

// Initialiser la base de données
initializeDatabase();
initializeDefaultSnippets();

// Routes
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
});

