import app from './app';
import { checkAndSendReminders } from './lib/licenceReminders';
import { checkAndSendTaskReminders } from './lib/taskReminders';

const PORT = process.env.PORT || 1400;

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
    
    console.log('📋 Vérification initiale des rappels de tâches...');
    checkAndSendTaskReminders().catch((error) => {
      console.error('Erreur lors de la vérification initiale des rappels de tâches:', error);
    });
  }, 5000); // 5 secondes après le démarrage
  
  // Puis exécuter périodiquement
  setInterval(() => {
    console.log('🔔 Vérification périodique des rappels de licences...');
    checkAndSendReminders().catch((error) => {
      console.error('Erreur lors de la vérification périodique des rappels:', error);
    });
    
    console.log('📋 Vérification périodique des rappels de tâches...');
    checkAndSendTaskReminders().catch((error) => {
      console.error('Erreur lors de la vérification périodique des rappels de tâches:', error);
    });
  }, REMINDER_CHECK_INTERVAL);
  
  console.log(`⏰ Système de rappels automatiques activé (vérification toutes les heures)`);
});

