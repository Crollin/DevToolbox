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
  - Body: `{ newPassword: string }`
  - Retourne: `{ success: true, message: string }`

**Note** : Toutes les autres routes nécessitent une authentification via le header `Authorization: Bearer <token>`.

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
- `PUT /api/licences/:id` - Met à jour une licence (si elle appartient à l'utilisateur)
- `DELETE /api/licences/:id` - Supprime une licence (si elle appartient à l'utilisateur)
- `GET /api/licences/ntfy-config` - Récupère la configuration Ntfy de l'utilisateur
- `PUT /api/licences/ntfy-config` - Met à jour la configuration Ntfy de l'utilisateur

### Calculateur électrique
- `GET /api/electricalc/settings` - Récupère les paramètres
- `PUT /api/electricalc/settings` - Met à jour les paramètres
- `GET /api/electricalc/history` - Récupère l'historique
- `POST /api/electricalc/history` - Ajoute un calcul à l'historique

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
│   │   ├── licences.ts       # Routes pour les licences (authentification requise)
│   │   └── electricalc.ts    # Routes pour le calculateur
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
- `ntfy_configs` - Configurations Ntfy par utilisateur
- `licences` - Modifiée pour inclure `user_id` (association aux utilisateurs)

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

