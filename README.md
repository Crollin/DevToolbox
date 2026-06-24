# DevToolbox — Boîte à outils développeur

## À propos du projet

DevToolbox est une plateforme personnelle développée par **Creactiveweb** pour centraliser, organiser et lancer rapidement tous vos outils de développement web.

Cette application regroupe une collection d'outils pratiques pour les développeurs, incluant :
- **Gestionnaire de commandes Git** - Collection de commandes Git avancées
- **Gestionnaire de commandes Docker** - Glossaire complet des commandes Docker
- **Bibliothèque de snippets de code** - Snippets avec import/export WPCodeBox
- **Générateur de palettes de couleurs** - Palettes harmonieuses pour vos projets
- **Bibliothèque d'icônes SVG** - Édition et export en SVG/JSX
- **Outils WordPress** - WP-CLI, scripts, hooks, queries
- **Image Resizer** - Redimensionnement et optimisation d'images pour WordPress (WebP, traitement par lots)
- **Calculateur électrique** - Consommation énergétique et estimation des coûts
- **Gestionnaire de clés de licence** - Centralisation des licences SaaS
- **Éditeur Markdown** - Éditeur WYSIWYG avec prévisualisation
- **CSV Preview Pro** - Visualisation et manipulation de fichiers CSV
- Et bien plus encore...

## Architecture

DevToolbox utilise comme architecture :
- **Frontend** : Application React/Vite avec TypeScript
- **Backend** : API REST Node.js/Express
- **Base de données** : SQLite (légère et performante)
- **Authentification** : JWT (JSON Web Tokens) avec système de comptes utilisateurs
- **Déploiement** : Docker Compose pour un déploiement facile

## Démarrage rapide

### Option 1 : Avec Docker (Recommandé)

La méthode la plus simple pour démarrer DevToolbox est d'utiliser Docker Compose.

**Prérequis** : Docker et Docker Compose installés

```sh
# Cloner le dépôt
git clone https://github.com/Crollin/DevToolbox
cd DevToolbox

# Configurer l'environnement
cp .env.example .env
# Éditer .env : JWT_SECRET obligatoire (openssl rand -base64 32)

# Démarrer (build local ou pull GHCR selon IMAGE_TAG)
docker compose up -d

# Voir les logs
docker compose logs -f
```

Images pré-construites : `ghcr.io/crollin/devtoolbox-frontend` et `ghcr.io/crollin/devtoolbox-backend` (voir [DOCKER.md](DOCKER.md)).

L'application sera accessible sur :
- **Frontend** : http://localhost:14001
- **Backend API** : http://localhost:1400

Pour plus de détails, consultez le [Guide Docker](DOCKER.md).

### Option 2 : Développement local

Pour développer localement sans Docker :

**Prérequis** : Node.js 20+ et npm installés - [installer avec nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# 1. Cloner le dépôt
git clone https://github.com/Crollin/DevToolbox
cd DevToolbox

# 2. Installer les dépendances du frontend
npm install

# 3. Installer les dépendances du backend
cd backend
npm install
cd ..

# 4. Démarrer le backend (dans un terminal)
cd backend
npm run dev  # Démarre sur http://localhost:1400

# 5. Démarrer le frontend (dans un autre terminal)
npm run dev  # Démarre sur http://localhost:14001
```

Le frontend est configuré pour proxy les requêtes `/api` vers le backend.

## Authentification

### Première utilisation

**Important** : Tous les outils nécessitent une authentification. Lors de votre première visite, vous devrez créer un compte pour accéder aux fonctionnalités.

1. Accédez à n'importe quel outil depuis la page d'accueil
2. Un formulaire d'authentification s'affichera automatiquement
3. Créez un compte avec votre email, nom et mot de passe (minimum 6 caractères)
4. Une fois connecté, vous aurez accès à tous les outils

### Fonctionnalités

- **Comptes utilisateurs** : Chaque utilisateur a son propre espace de données
- **Synchronisation multi-appareils** : Vos données sont stockées sur le serveur et accessibles depuis n'importe quel navigateur/appareil
- **Changement de mot de passe** : Modifiez votre mot de passe depuis le menu utilisateur (icône en haut à droite)
- **Email de confirmation** : Un email de bienvenue est envoyé lors de l'inscription (si SMTP configuré)

### Protection des routes

- **Page d'accueil** (`/`) : Accessible sans authentification
- **Tous les outils** (`/tools/*`) : Nécessitent une authentification
- Redirection automatique vers le formulaire de connexion si non authentifié

## Structure du projet

```
DevToolbox/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── db/             # Configuration base de données
│   │   ├── routes/         # Routes API
│   │   └── index.ts        # Point d'entrée
│   ├── data/               # Base de données SQLite
│   └── Dockerfile
├── src/                     # Frontend React
│   ├── components/         # Composants React
│   │   ├── imageresizer/  # Composants Image Resizer
│   │   └── ...
│   ├── hooks/              # Hooks personnalisés
│   │   ├── useImageResizer.ts  # Hook pour Image Resizer
│   │   └── ...
│   ├── lib/                # Utilitaires (API client, etc.)
│   │   ├── imagePresets.ts  # Présets WordPress pour images
│   │   └── ...
│   ├── pages/              # Pages de l'application
│   │   ├── tools/
│   │   │   ├── ImageResizer.tsx  # Page Image Resizer
│   │   │   └── ...
│   │   └── ...
│   └── types/              # Types TypeScript
│       ├── image-resizer.ts  # Types pour Image Resizer
│       └── ...
├── docker/                  # Configuration Docker
│   └── nginx.conf          # Configuration Nginx
├── docker-compose.yml       # Orchestration Docker
├── Dockerfile              # Image frontend
└── DOCKER.md               # Documentation Docker
```

## Outils disponibles

### Utilitaires
- **Image Resizer** - Redimensionnement et optimisation d'images pour WordPress
  - Support de tous les formats d'images (JPG, PNG, GIF, WebP, SVG)
  - Présets WordPress (Hero, Banner, Container, Thumbnail, etc.)
  - Redimensionnement manuel avec ratio d'aspect
  - Conversion WebP avec qualité ajustable (50-100%)
  - **Traitement par lots** : plusieurs images avec les mêmes paramètres, export ZIP ou individuel
  - Prévisualisation avant/après avec statistiques
  - Traitement 100% côté client (pas de backend requis)
- **Licence Key Hub** - Gestionnaire centralisé de clés de licence
  - Gestion complète des licences (WordPress, SaaS, API, etc.)
  - Notifications d'expiration via Ntfy et/ou Email (SMTP)
  - Rappels automatiques configurable (quotidien/hebdomadaire)
  - Toggle par licence pour activer/désactiver les notifications
  - Test de notifications pour valider les configurations
- **Mon Calcul Énergie** - Calculateur de consommation énergétique
- **SVG Icon Library** - Bibliothèque d'icônes SVG
- **WP Hook Reference** - Référence complète des hooks WordPress
- **Markdown Editor** - Éditeur Markdown WYSIWYG

### Scripts
- **WP Script Library** - Bibliothèque de scripts PHP/Shell WordPress
- **Code Snippet Library** - Snippets avec import/export WPCodeBox
- **WP Query Builder** - Constructeur visuel de requêtes WP_Query

### Commandes
- **WP-CLI Glossary** - Glossaire de commandes WP-CLI
- **Git Commander** - Collection de commandes Git avancées
- **Docker Commander** - Glossaire complet des commandes Docker

### Convertisseurs
- **CSV Preview Pro** - Visualisation et manipulation de fichiers CSV

### Génération
- **Color Palette Gen** - Générateur de palettes de couleurs harmonieuses

## API Backend

Le backend expose une API REST complète pour tous les modules. Consultez le [README du backend](backend/README.md) pour la documentation complète des endpoints.

### Endpoints principaux

#### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Récupérer l'utilisateur actuel
- `PUT /api/auth/change-password` - Changer le mot de passe (authentification requise)

#### Données utilisateur
- `/api/snippets` - Gestion des snippets de code (authentification requise)
- `/api/hooks` - Gestion des hooks WordPress (authentification requise)
- `/api/queries` - Gestion des queries WordPress (authentification requise)
- `/api/palettes` - Gestion des palettes de couleurs (authentification requise)
- `/api/scripts` - Gestion des scripts WordPress (authentification requise)
- `/api/wpcli` - Gestion des commandes WP-CLI (authentification requise)
- `/api/docker` - Gestion des commandes Docker (authentification requise)
- `/api/git` - Gestion des commandes Git (authentification requise)
- `/api/icons` - Gestion des icônes SVG (authentification requise)
- `/api/licences` - Gestion des licences et notifications (authentification requise)
- `/api/electricalc` - Calculateur électrique (authentification requise)
- `/health` - Health check (public)

**Note** : 
- L'outil Image Resizer fonctionne entièrement côté client et n'utilise pas l'API backend
- Toutes les routes de données nécessitent une authentification JWT (sauf `/health`)

## Commandes utiles

### Développement

```sh
# Frontend - Mode développement
npm run dev

# Backend - Mode développement
cd backend && npm run dev

# Build frontend
npm run build

# Build backend
cd backend && npm run build
```

### Docker

```sh
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Voir les logs
docker-compose logs -f

# Rebuild après modifications
docker-compose up -d --build

# Accéder au shell du backend
docker-compose exec backend sh
```

Voir [DOCKER.md](DOCKER.md) pour plus de commandes.

## Mise à jour du projet

### Mise à jour avec le script automatisé (Recommandé)

Pour mettre à jour le projet sans conflits avec les fichiers locaux (base de données, etc.) :

```bash
# Exécuter le script de mise à jour
./scripts/git-update.sh
```

Ce script :
- Sauvegarde automatiquement la base de données
- Sauvegarde vos modifications locales (stash)
- Retire les fichiers ignorés du suivi Git
- Fait le pull des modifications distantes
- Récupère vos modifications locales
- Gère les conflits automatiquement

### Mise à jour manuelle

Si vous préférez mettre à jour manuellement :

```bash
# 1. Sauvegarder la base de données (optionnel mais recommandé)
cp data/devtoolbox.db data/devtoolbox.db.backup

# 2. Sauvegarder vos modifications locales
git stash push -m "Modifications locales avant pull"

# 3. Retirer les fichiers ignorés du suivi Git (si nécessaire)
git rm -r --cached data/*.db 2>/dev/null || true

# 4. Faire le pull
git pull origin main  # ou votre branche

# 5. Récupérer vos modifications locales
git stash pop
```

### Fichiers ignorés par Git

Les fichiers suivants sont automatiquement ignorés et ne causeront pas de conflits :
- `data/devtoolbox.db` - Base de données SQLite
- `data/*.backup` - Fichiers de sauvegarde
- `*.db`, `*.db-journal` - Tous les fichiers de base de données
- `.env` - Variables d'environnement (utilisez `.env.example` comme modèle)

**Note** : Le dossier `data/` est conservé dans Git grâce au fichier `data/.gitkeep`, mais les fichiers de base de données ne sont pas versionnés.

## Technologies utilisées

### Frontend
- **Vite** - Build tool et serveur de développement
- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **shadcn-ui** - Composants UI
- **Tailwind CSS** - Framework CSS
- **React Router** - Routing
- **browser-image-compression** - Compression et redimensionnement d'images côté client
- **JSZip** - Création d'archives ZIP côté client (export batch Image Resizer)

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Typage statique
- **SQLite** - Base de données légère
- **better-sqlite3** - Driver SQLite performant

### Infrastructure
- **Docker** - Conteneurisation
- **Docker Compose** - Orchestration
- **Nginx** - Serveur web pour le frontend

## Déploiement

### Déploiement avec Docker (Production)

Pour déployer en production avec Docker :

```sh
# Sur votre serveur
git clone <YOUR_GIT_URL>
cd DevToolbox

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env selon vos besoins (OBLIGATOIRE : générer un JWT_SECRET fort)
# Générer un secret : openssl rand -base64 32

# Démarrer les services
docker-compose up -d

# Vérifier le statut
docker-compose ps
```

### ⚠️ Configuration pour serveurs distants Linux

Si vous déployez sur un serveur Linux distant et rencontrez l'erreur `keychain cannot be accessed`, exécutez ce script **une seule fois** :

```bash
# Sur le serveur distant Linux
./scripts/setup-docker-remote.sh
```

Ce script configure Docker pour fonctionner sans keychain macOS. Voir [docker/SETUP-REMOTE.md](docker/SETUP-REMOTE.md) pour plus de détails.

### Déploiement Frontend uniquement (Netlify/Vercel)

Pour déployer uniquement le frontend sur Netlify ou Vercel (sans backend) :

**Note** : En mode frontend uniquement, l'application utilisera `localStorage` au lieu de l'API backend.

1. **Netlify**
   - Connectez votre dépôt GitHub à Netlify
   - Build command : `npm run build`
   - Publish directory : `dist`
   - Le fichier `netlify.toml` contient la configuration

2. **Vercel**
   - Connectez votre dépôt GitHub à Vercel
   - Build command : `npm run build`
   - Output directory : `dist`

### Configuration pour production

Pour utiliser l'API backend en production, vous devez :
1. Déployer le backend sur un serveur (avec Docker ou directement)
2. Configurer la variable d'environnement `VITE_API_URL` pointant vers votre API
3. Configurer les variables d'environnement du backend (voir section ci-dessous)
4. Déployer le frontend avec cette configuration

### Variables d'environnement

#### Configuration avec fichier .env

Pour configurer les variables d'environnement, utilisez le fichier `.env` :

```bash
# 1. Copier le fichier d'exemple
cp .env.example .env

# 2. Éditer .env avec vos valeurs
nano .env  # ou votre éditeur préféré
```

Le fichier `.env.example` contient toutes les variables nécessaires avec des commentaires explicatifs.

**Important** : Le fichier `.env` est ignoré par Git et ne sera pas commité. Ne partagez jamais vos secrets !

#### Backend

**Obligatoires** :
- `JWT_SECRET` - Secret pour signer les tokens JWT (à générer pour la production)
  - Générer un secret fort : `openssl rand -base64 32`
  - **⚠️ Obligatoire en production** : Ne jamais utiliser le secret par défaut en production

**Optionnelles** :
- `PORT` - Port du serveur (défaut: 1400)
- `NODE_ENV` - Environnement (development/production)
- `DB_PATH` - Chemin vers le fichier SQLite (défaut: ./data/devtoolbox.db)

**Configuration Email (optionnelle)** :
- `SMTP_HOST` - Serveur SMTP (ex: smtp.gmail.com, smtp.sendgrid.net)
- `SMTP_PORT` - Port SMTP (généralement 587 ou 465)
- `SMTP_USER` - Utilisateur SMTP
- `SMTP_PASS` - Mot de passe SMTP (ou clé API pour SendGrid)
- `SMTP_FROM` - Adresse email expéditrice (défaut: SMTP_USER)
- `FRONTEND_URL` - URL du frontend pour les liens dans les emails

**Note** : L'envoi d'emails est optionnel. L'inscription fonctionne même sans configuration SMTP, mais aucun email de confirmation ne sera envoyé.

**Exemples de configuration SMTP** :
- **Gmail** : Utilisez un "Mot de passe d'application" (pas votre mot de passe principal)
- **SendGrid** : Utilisez `apikey` comme `SMTP_USER` et votre clé API comme `SMTP_PASS`
- **Mailgun** : Utilisez les identifiants fournis par Mailgun

#### Frontend

- `VITE_API_URL` - URL de l'API backend (défaut: /api)

## Base de données

La base de données SQLite est stockée dans `./data/devtoolbox.db` (ou dans le volume Docker).

**Important** : Le fichier de base de données n'est **pas versionné** dans Git pour éviter les conflits. Chaque environnement (développement, production) a sa propre base de données.

### Sauvegarde

```sh
# Avec Docker
docker-compose exec backend cp /app/data/devtoolbox.db /app/data/devtoolbox.db.backup

# Localement
cp data/devtoolbox.db data/devtoolbox.db.backup
```

### Migration

La base de données est initialisée automatiquement au démarrage. Pour une migration manuelle :

```sh
# Avec Docker
docker-compose exec backend npm run db:migrate

# Localement
cd backend && npm run db:migrate
```

## Fonctionnalités récentes

### Licence Key Hub - Notifications améliorées (Nouveau)
Système complet de notifications pour les licences expirantes :

- **Types de notifications** : Choix entre Ntfy uniquement, Email uniquement (SMTP), ou les deux
- **Rappels automatiques** : Notifications automatiques à 30 jours, 7 jours et 1 jour avant expiration
- **Fréquence configurable** : Rappels quotidiens ou hebdomadaires
- **Toggle par licence** : Activer/désactiver les notifications individuellement pour chaque licence
- **Test de notifications** : Validation des configurations Ntfy et SMTP avant utilisation
- **Envoi manuel** : Possibilité d'envoyer immédiatement les notifications pour les licences expirantes
- **Configuration flexible** : Test et envoi utilisent les valeurs du formulaire sans nécessiter de sauvegarde préalable

**Configuration requise** :
- Pour Ntfy : Serveur Ntfy (par défaut https://ntfy.sh), topic et optionnellement un token d'authentification
- Pour Email : Configuration SMTP dans les variables d'environnement (voir section Configuration Email)

### Système d'authentification
Système complet de gestion des utilisateurs avec synchronisation multi-appareils :

- **Comptes utilisateurs** : Création de compte obligatoire pour accéder aux outils
- **Authentification JWT** : Tokens sécurisés avec expiration de 7 jours
- **Synchronisation** : Données stockées sur le serveur, accessibles depuis tous les navigateurs/appareils
- **Changement de mot de passe** : Modification depuis le menu utilisateur
- **Email de confirmation** : Envoi automatique d'un email de bienvenue à l'inscription (si SMTP configuré)
- **Protection des routes** : Tous les outils nécessitent une authentification (sauf page d'accueil)
- **Migration automatique** : Les données localStorage sont automatiquement migrées vers l'API lors de la première connexion

### Image Resizer
Outil complet de redimensionnement et d'optimisation d'images pour WordPress :

- **Présets WordPress** : Hero (1920x1080), Banner (1200x630), Container, Thumbnail, Medium, Large, Full
- **Redimensionnement manuel** : Dimensions personnalisables avec conservation du ratio d'aspect
- **Conversion WebP** : Export optimisé avec qualité ajustable (50-100%, défaut 75%)
- **Traitement par lots** : Mode "Lots" pour traiter plusieurs images avec les mêmes paramètres, export ZIP ou téléchargements individuels
- **Prévisualisation** : Comparaison avant/après avec statistiques détaillées
- **Traitement côté client** : Aucun backend requis, traitement dans le navigateur
- **Support multi-formats** : JPG, PNG, GIF, WebP, SVG

### Améliorations Docker
- Script de vérification avant build (`scripts/verify-docker-build.sh`)
- Support WebP dans la configuration Nginx
- Optimisation du Dockerfile pour le cache

## Documentation

- [Guide Docker](DOCKER.md) - Instructions complètes pour Docker
- [Backend API](backend/README.md) - Documentation de l'API backend
- [Base de données](backend/src/db/README.md) - Structure de la base de données

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

Ce projet est distribué sous la licence **GNU General Public License v3.0 (GPL-3.0) avec clause additionnelle non-commerciale**.

Voir le fichier [LICENSE](LICENSE) pour le texte complet de la licence.

### Droits accordés

Cette licence vous permet de :
- **Forker** le projet sur GitHub
- **Modifier** le code source
- **Distribuer** le code original ou modifié
- **Utiliser** le projet à des fins **non commerciales** (usage personnel, éducatif, ou par des organisations à but non lucratif)

### Restrictions

**Usage commercial interdit** : L'utilisation de ce projet à des fins commerciales est strictement interdite sans autorisation écrite explicite du détenteur du copyright. Cela inclut :
- Toute utilisation pour laquelle des frais sont facturés ou reçus
- Toute utilisation par une entité ou organisation commerciale
- Toute utilisation qui génère des revenus ou des profits
- Toute utilisation dans un produit ou service vendu

Pour obtenir une licence commerciale, veuillez contacter le détenteur du copyright.

### Conditions (Copyleft)

La GPL v3 est une licence copyleft, ce qui signifie que :
- Toute modification ou distribution du code doit également être sous licence GPL v3 (avec la même clause non-commerciale)
- Vous devez fournir le code source avec toute distribution
- Vous devez conserver les notices de copyright et de licence

### Copyright

Copyright (C) 2024 Creactiveweb

Ce projet est développé et maintenu par **Creactiveweb**.
