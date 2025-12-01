# DevToolbox — Boîte à outils développeur

## À propos du projet

DevToolbox est une plateforme personnelle développée par **Creactiveweb** pour centraliser, organiser et lancer rapidement tous vos outils de développement web.

Cette application regroupe une collection d'outils pratiques pour les développeurs, incluant :
- Gestionnaire de commandes Git
- Gestionnaire de commandes Docker
- Bibliothèque de snippets de code
- Générateur de palettes de couleurs
- Bibliothèque d'icônes SVG
- Outils WordPress (WP-CLI, scripts, hooks, queries)
- Calculateur électrique
- Gestionnaire de clés de licence
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
│   ├── hooks/              # Hooks personnalisés
│   ├── lib/                # Utilitaires (API client, etc.)
│   ├── pages/              # Pages de l'application
│   └── types/              # Types TypeScript
├── docker/                  # Configuration Docker
│   └── nginx.conf          # Configuration Nginx
├── docker-compose.yml       # Orchestration Docker
├── Dockerfile              # Image frontend
└── DOCKER.md               # Documentation Docker
```

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

## Documentation

- [Guide Docker](DOCKER.md) - Instructions complètes pour Docker
- [Backend API](backend/README.md) - Documentation de l'API backend
- [Base de données](backend/src/db/README.md) - Structure de la base de données

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

Ce projet est développé et maintenu par **Creactiveweb**.
