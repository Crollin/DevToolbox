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
- **Image Resizer** - Redimensionnement et optimisation d'images pour WordPress (WebP)
- **Calculateur électrique** - Consommation énergétique et estimation des coûts
- **Gestionnaire de clés de licence** - Centralisation des licences SaaS
- **Éditeur Markdown** - Éditeur WYSIWYG avec prévisualisation
- **CSV Preview Pro** - Visualisation et manipulation de fichiers CSV
- Et bien plus encore...

## Architecture

DevToolbox utilise une architecture moderne avec :
- **Frontend** : Application React/Vite avec TypeScript
- **Backend** : API REST Node.js/Express
- **Base de données** : SQLite (légère et performante)
- **Déploiement** : Docker Compose pour un déploiement facile

## Démarrage rapide

### Option 1 : Avec Docker (Recommandé)

La méthode la plus simple pour démarrer DevToolbox est d'utiliser Docker Compose.

**Prérequis** : Docker et Docker Compose installés

```sh
# Cloner le dépôt
git clone <YOUR_GIT_URL>
cd DevToolbox

# Démarrer tous les services (frontend + backend + base de données)
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

L'application sera accessible sur :
- **Frontend** : http://localhost
- **Backend API** : http://localhost:3000

Pour plus de détails, consultez le [Guide Docker](DOCKER.md).

### Option 2 : Développement local

Pour développer localement sans Docker :

**Prérequis** : Node.js 20+ et npm installés - [installer avec nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# 1. Cloner le dépôt
git clone <YOUR_GIT_URL>
cd DevToolbox

# 2. Installer les dépendances du frontend
npm install

# 3. Installer les dépendances du backend
cd backend
npm install
cd ..

# 4. Démarrer le backend (dans un terminal)
cd backend
npm run dev  # Démarre sur http://localhost:3000

# 5. Démarrer le frontend (dans un autre terminal)
npm run dev  # Démarre sur http://localhost:8080
```

Le frontend est configuré pour proxy les requêtes `/api` vers le backend.

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
  - Prévisualisation avant/après avec statistiques
  - Traitement 100% côté client (pas de backend requis)
- **Licence Key Hub** - Gestionnaire centralisé de clés de licence
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

- `/api/snippets` - Gestion des snippets de code
- `/api/hooks` - Gestion des hooks WordPress
- `/api/queries` - Gestion des queries WordPress
- `/api/palettes` - Gestion des palettes de couleurs
- `/api/scripts` - Gestion des scripts WordPress
- `/api/wpcli` - Gestion des commandes WP-CLI
- `/api/docker` - Gestion des commandes Docker
- `/api/git` - Gestion des commandes Git
- `/api/icons` - Gestion des icônes SVG
- `/api/licences` - Gestion des licences
- `/api/electricalc` - Calculateur électrique
- `/health` - Health check

**Note** : L'outil Image Resizer fonctionne entièrement côté client et n'utilise pas l'API backend.

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

## Technologies utilisées

### Frontend
- **Vite** - Build tool et serveur de développement
- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **shadcn-ui** - Composants UI
- **Tailwind CSS** - Framework CSS
- **React Router** - Routing
- **browser-image-compression** - Compression et redimensionnement d'images côté client

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
# Éditer .env selon vos besoins

# Démarrer les services
docker-compose up -d

# Vérifier le statut
docker-compose ps
```

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
3. Déployer le frontend avec cette configuration

## Base de données

La base de données SQLite est stockée dans `./data/devtoolbox.db` (ou dans le volume Docker).

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

### Image Resizer (Nouveau)
Outil complet de redimensionnement et d'optimisation d'images pour WordPress :

- **Présets WordPress** : Hero (1920x1080), Banner (1200x630), Container, Thumbnail, Medium, Large, Full
- **Redimensionnement manuel** : Dimensions personnalisables avec conservation du ratio d'aspect
- **Conversion WebP** : Export optimisé avec qualité ajustable (50-100%, défaut 75%)
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

Ce projet est développé et maintenu par **Creactiveweb**.
