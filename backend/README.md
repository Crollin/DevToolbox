# DevToolbox Backend API

Backend API REST pour DevToolbox utilisant Express.js et SQLite avec authentification JWT.

## Installation

```bash
npm install
```

## Développement

```bash
# Démarrer en mode développement avec rechargement automatique
npm run dev

# Le serveur démarre sur http://localhost:1400
```

## Production

```bash
# Builder l'application
npm run build

# Démarrer en production
npm start
```

## Base de données

### Initialisation

La base de données SQLite est initialisée automatiquement au démarrage du serveur.

### Migration manuelle

```bash
npm run db:migrate
```

### Emplacement

Par défaut, la base de données est créée dans `./data/devtoolbox.db`.

Pour changer l'emplacement, définissez la variable d'environnement `DB_PATH`.

## API Endpoints

### Authentification

Toutes les routes d'authentification sont publiques (pas d'authentification requise pour s'inscrire/se connecter).

- `POST /api/auth/register` - Créer un compte utilisateur
  - Body: `{ email: string, password: string, name: string }`
  - Retourne: `{ token: string, user: { id, email, name }, emailSent: boolean }`
  - Envoie un email de confirmation si SMTP configuré

- `POST /api/auth/login` - Se connecter
  - Body: `{ email: string, password: string }`
  - Retourne: `{ token: string, user: { id, email, name } }`

- `GET /api/auth/me` - Récupérer l'utilisateur actuel
  - Headers: `Authorization: Bearer <token>`
  - Retourne: `{ user: { id, email, name } }`

- `PUT /api/auth/change-password` - Changer le mot de passe (authentification requise)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ currentPassword: string, newPassword: string }`
  - Retourne: `{ success: true, message: string }`

- `POST /api/auth/personal-tokens` - Créer un Personal Access Token pour une intégration (Raycast, Hermes, scripts…)
  - Headers: `Authorization: Bearer <JWT de session>`
  - Body: `{ name: string, expiresAt?: string | null, scopes?: ('licences' | 'tasks' | 'knowledge_base')[] }`
  - Par défaut : `scopes: ['licences']` si omis
  - Le token brut est retourné une seule fois dans `token`
  - Le token est hashé côté serveur et peut être révoqué
- `GET /api/auth/personal-tokens` - Lister les tokens de l'utilisateur
- `DELETE /api/auth/personal-tokens/:id` - Révoquer un token (soft delete)
- `DELETE /api/auth/personal-tokens/:id/permanent` - Supprimer définitivement un token déjà révoqué

**Note** : Toutes les autres routes nécessitent une authentification via le header `Authorization: Bearer <token>`. Les routes `/api/licences`, `/api/tasks` et `/api/kb` acceptent également un Personal Access Token `dt_...` si le scope correspondant est présent.

### Snippets
- `GET /api/snippets` - Liste tous les snippets
- `GET /api/snippets/:id` - Récupère un snippet
- `POST /api/snippets` - Crée un snippet
- `PUT /api/snippets/:id` - Met à jour un snippet
- `DELETE /api/snippets/:id` - Supprime un snippet
- `POST /api/snippets/folders` - Ajoute un dossier
- `POST /api/snippets/tags` - Ajoute un tag personnalisé

### Hooks WordPress
- `GET /api/hooks` - Liste tous les hooks
- `POST /api/hooks` - Crée un hook
- `PUT /api/hooks/:id` - Met à jour un hook
- `DELETE /api/hooks/:id` - Supprime un hook
- `POST /api/hooks/categories` - Ajoute une catégorie

### Queries WordPress
- `GET /api/queries` - Liste toutes les queries
- `POST /api/queries` - Crée une query
- `PUT /api/queries/:id` - Met à jour une query
- `DELETE /api/queries/:id` - Supprime une query

### Palettes de couleurs
- `GET /api/palettes` - Liste toutes les palettes
- `POST /api/palettes` - Crée une palette
- `PUT /api/palettes/:id` - Met à jour une palette
- `DELETE /api/palettes/:id` - Supprime une palette

### Scripts WordPress
- `GET /api/scripts` - Liste tous les scripts
- `POST /api/scripts` - Crée un script
- `PUT /api/scripts/:id` - Met à jour un script
- `DELETE /api/scripts/:id` - Supprime un script

### Commandes WP-CLI
- `GET /api/wpcli` - Liste toutes les commandes
- `POST /api/wpcli` - Crée une commande
- `PUT /api/wpcli/:id` - Met à jour une commande
- `DELETE /api/wpcli/:id` - Supprime une commande

### Commandes Docker
- `GET /api/docker` - Liste toutes les commandes
- `POST /api/docker` - Crée une commande
- `PUT /api/docker/:id` - Met à jour une commande
- `DELETE /api/docker/:id` - Supprime une commande

### Commandes Git
- `GET /api/git` - Liste toutes les commandes
- `POST /api/git` - Crée une commande
- `PUT /api/git/:id` - Met à jour une commande
- `DELETE /api/git/:id` - Supprime une commande

### Icônes SVG
- `GET /api/icons` - Liste toutes les icônes
- `POST /api/icons` - Crée une icône
- `PUT /api/icons/:id` - Met à jour une icône
- `DELETE /api/icons/:id` - Supprime une icône

### Licences (Authentification requise)
- `GET /api/licences` - Liste toutes les licences de l'utilisateur connecté
- `POST /api/licences` - Crée une licence pour l'utilisateur connecté
  - Body: `{ name: string, key: string, type: string, isLifetime: boolean, renewalDate?: string, notes?: string, notificationsEnabled?: boolean }`
- `PUT /api/licences/:id` - Met à jour une licence (si elle appartient à l'utilisateur)
  - Body: `{ name: string, key: string, type: string, isLifetime: boolean, renewalDate?: string, notes?: string, notificationsEnabled?: boolean }`
- `DELETE /api/licences/:id` - Supprime une licence (si elle appartient à l'utilisateur)
- `GET /api/licences/ntfy-config` - Récupère la configuration de notifications de l'utilisateur
  - Retourne: `{ enabled: boolean, serverUrl: string, topic: string, token?: string, notificationType: 'ntfy'|'email'|'both', autoRemindersEnabled: boolean, reminderFrequency: 'daily'|'weekly', lastReminderSentAt?: string, emailConfigured: boolean }`
- `PUT /api/licences/ntfy-config` - Met à jour la configuration de notifications
  - Body: `{ enabled: boolean, serverUrl: string, topic: string, token?: string, notificationType: 'ntfy'|'email'|'both', autoRemindersEnabled: boolean, reminderFrequency: 'daily'|'weekly' }`
- `POST /api/licences/test-notifications` - Teste les configurations de notifications (Ntfy et/ou Email)
  - Body (optionnel): `{ notificationType?: 'ntfy'|'email'|'both', serverUrl?: string, topic?: string, token?: string }`
  - Si les paramètres sont fournis, utilise ceux-ci pour le test, sinon utilise la config sauvegardée
  - Retourne: `{ message: string, results: { ntfy?: boolean, email?: boolean }, errors?: { ntfy?: string, email?: string } }`
- `POST /api/licences/send-notifications` - Envoie manuellement les notifications pour les licences expirantes
  - Body (optionnel): `{ notificationType?: 'ntfy'|'email'|'both', serverUrl?: string, topic?: string, token?: string }`
  - Si les paramètres sont fournis, utilise ceux-ci pour l'envoi, sinon utilise la config sauvegardée
  - Retourne: `{ message: string, sent: boolean, results: { ntfy?: boolean, email?: boolean }, licencesCount: number }`
- `POST /api/licences/check-expiring` - Déclenche manuellement la vérification et l'envoi des rappels automatiques
  - Retourne: `{ message: string }`

### Health Check
- `GET /health` - Vérifie l'état du serveur

## Variables d'environnement

### Obligatoires

- `JWT_SECRET` - Secret pour signer les tokens JWT (⚠️ **OBLIGATOIRE en production**)
  - Générer un secret fort : `openssl rand -base64 32`
  - Ne jamais commiter ce secret dans le code

### Optionnelles

- `PORT` - Port du serveur (défaut: 1400)
- `NODE_ENV` - Environnement (development/production)
- `DB_PATH` - Chemin vers le fichier SQLite (défaut: ./data/devtoolbox.db)

### Configuration Email (Optionnelle)

Pour activer l'envoi d'emails de confirmation à l'inscription :

- `SMTP_HOST` - Serveur SMTP (ex: smtp.gmail.com, smtp.sendgrid.net)
- `SMTP_PORT` - Port SMTP (généralement 587 pour TLS ou 465 pour SSL)
- `SMTP_USER` - Nom d'utilisateur SMTP
- `SMTP_PASS` - Mot de passe SMTP
- `SMTP_FROM` - Adresse email expéditrice (défaut: SMTP_USER)
- `FRONTEND_URL` - URL du frontend pour les liens dans les emails (ex: https://devtoolbox.example.com)

**Note** : Si les variables SMTP ne sont pas configurées, l'inscription fonctionnera toujours mais aucun email ne sera envoyé.

## Structure du projet

```
backend/
├── src/
│   ├── db/
│   │   ├── database.ts      # Configuration SQLite
│   │   └── migrate.ts        # Script de migration
│   ├── lib/
│   │   └── email.ts          # Service d'envoi d'emails (Nodemailer)
│   ├── middleware/
│   │   └── auth.ts           # Middleware d'authentification JWT
│   ├── routes/
│   │   ├── auth.ts           # Routes d'authentification
│   │   ├── snippets.ts       # Routes pour les snippets
│   │   ├── hooks.ts          # Routes pour les hooks
│   │   ├── queries.ts        # Routes pour les queries
│   │   ├── palettes.ts       # Routes pour les palettes
│   │   ├── scripts.ts        # Routes pour les scripts
│   │   ├── wpcli.ts          # Routes pour WP-CLI
│   │   ├── docker.ts         # Routes pour Docker
│   │   ├── git.ts            # Routes pour Git
│   │   ├── icons.ts          # Routes pour les icônes
│   │   ├── licences.ts       # Routes pour les licences et notifications (authentification requise)
│   │   └── ...
│   ├── lib/
│   │   ├── email.ts          # Service d'envoi d'emails (Nodemailer) et notifications de licences
│   │   └── licenceReminders.ts  # Logique de vérification et envoi des rappels automatiques
│   └── index.ts              # Point d'entrée du serveur
├── data/                     # Dossier pour la base de données
├── dist/                     # Fichiers compilés
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Authentification

### Système JWT

L'application utilise JSON Web Tokens (JWT) pour l'authentification :

- **Expiration** : Tokens valides 7 jours
- **Format** : `Authorization: Bearer <token>`
- **Sécurité** : Mots de passe hashés avec bcrypt (10 rounds)

### Base de données

Le système d'authentification utilise les tables suivantes :

- `users` - Comptes utilisateurs (id, email, password_hash, name)
- `sessions` - Blacklist de tokens (optionnel)
- `ntfy_configs` - Configurations de notifications par utilisateur
  - Colonnes: `id`, `user_id`, `enabled`, `server_url`, `topic`, `token`, `notification_type` ('ntfy'|'email'|'both'), `auto_reminders_enabled`, `reminder_frequency` ('daily'|'weekly'), `last_reminder_sent_at`, `created_at`, `updated_at`
- `licences` - Licences associées aux utilisateurs
  - Colonnes: `id`, `user_id`, `name`, `key`, `type`, `status`, `expires_at`, `notes`, `notifications_enabled` (toggle par licence), `created_at`, `updated_at`

### Middleware d'authentification

Le middleware `authenticateToken` vérifie le token JWT et ajoute les informations utilisateur à la requête :

```typescript
// Utilisation dans les routes
import { authenticateToken } from '../middleware/auth';

router.use(authenticateToken); // Protège toutes les routes du router
```

## Configuration Email

### Service Email

Le service email utilise Nodemailer avec configuration SMTP. Voir `src/lib/email.ts` pour plus de détails.

### Template d'email

L'email de confirmation inclut :
- Message de bienvenue personnalisé
- Lien vers l'application
- Design HTML responsive

### Exemple de configuration

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
SMTP_FROM=noreply@devtoolbox.com
FRONTEND_URL=https://devtoolbox.example.com
```

## Docker

Voir le fichier `DOCKER.md` à la racine du projet pour les instructions Docker complètes.
