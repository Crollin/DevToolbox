# Guide Docker - DevToolbox

Ce guide explique comment utiliser Docker pour déployer DevToolbox avec son backend API et sa base de données SQLite.

## Prérequis

- Docker (version 20.10 ou supérieure)
- Docker Compose (version 2.0 ou supérieure)

## Structure

Le projet utilise une architecture multi-conteneurs :

- **Frontend** : Application React/Vite servie par Nginx (port 14001)
- **Backend** : API REST Node.js/Express (port 1400)
- **Base de données** : SQLite (fichier persistant dans `./data`)

## Démarrage rapide

### 1. Cloner et préparer le projet

```bash
# Cloner le dépôt (si nécessaire)
git clone https://github.com/Crollin/DevToolbox
cd DevToolbox

# Fichier d'environnement (JWT_SECRET est obligatoire pour le backend)
cp backend/.env.example .env
# Éditer .env et définir JWT_SECRET (ex: openssl rand -base64 32)
```

### 2. Démarrer les services

```bash
# Construire et démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 3. Accéder à l'application

- **Frontend** : http://localhost:14001
- **API** : via le frontend (ex. http://localhost:14001/api/…)
- **Health check frontend** : http://localhost:14001/health

## Commandes utiles

### Gestion des conteneurs

```bash
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v

# Redémarrer un service
docker-compose restart backend
docker-compose restart frontend

# Rebuild après modifications
docker-compose up -d --build

# Rebuild un service spécifique
docker-compose build backend
docker-compose up -d backend
```

### Logs et débogage

```bash
# Voir tous les logs
docker-compose logs -f

# Logs d'un service
docker-compose logs -f backend
docker-compose logs -f frontend

# Dernières 100 lignes
docker-compose logs --tail=100

# Exécuter une commande dans un conteneur
docker-compose exec backend sh
docker-compose exec frontend sh

# Vérifier le statut
docker-compose ps
```

### Base de données

```bash
# Accéder à la base de données SQLite
docker-compose exec backend sh
cd /app/data
sqlite3 devtoolbox.db

# Sauvegarder la base de données
docker-compose exec backend cp /app/data/devtoolbox.db /app/data/devtoolbox.db.backup

# Restaurer depuis un backup
docker-compose exec backend cp /app/data/devtoolbox.db.backup /app/data/devtoolbox.db
```

## Configuration

### Variables d'environnement

#### Configuration avec fichier .env

Les variables du backend sont définies dans la section `environment` du `docker-compose.yml`. Docker Compose charge le fichier `.env` à la racine du projet pour la substitution des variables (${VAR}). Aucun `env_file` n’est utilisé dans le Compose, ce qui permet un déploiement sur Coolify sans fichier .env sur le serveur.

**Étapes de configuration (en local)** :

```bash
# 1. Copier le fichier d'exemple
cp .env.example .env

# 2. Éditer .env avec vos valeurs
nano .env  # ou votre éditeur préféré
```

Le fichier `.env.example` contient toutes les variables nécessaires avec des commentaires explicatifs et des exemples pour différents providers SMTP (Gmail, SendGrid, Mailgun).

**Variables disponibles** :

```env
# ============================================
# Authentification JWT (OBLIGATOIRE en production)
# ============================================
# Générez un secret fort avec : openssl rand -base64 32
JWT_SECRET=dev-secret-change-in-production

# ============================================
# Configuration Backend
# ============================================
NODE_ENV=production
PORT=1400
DB_PATH=/app/data/devtoolbox.db

# ============================================
# Configuration SMTP (Optionnel)
# ============================================
# Si ces variables ne sont pas définies, l'application fonctionnera
# mais aucun email de confirmation ne sera envoyé à l'inscription.

# Exemple avec Gmail :
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=votre-email@gmail.com
# SMTP_PASS=votre-mot-de-passe-app
# Note : Pour Gmail, utilisez un "Mot de passe d'application"

# Exemple avec SendGrid :
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASS=votre-cle-api-sendgrid

# Configuration SMTP (décommentez et remplissez selon votre provider)
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# SMTP_FROM=noreply@devtoolbox.com

# URL du frontend (pour les liens dans les emails)
FRONTEND_URL=http://localhost:14001
```

**Important** :
- Le fichier `.env` est ignoré par Git (ne sera pas commité)
- `JWT_SECRET` est **obligatoire** : le Compose refuse de démarrer s’il est vide. Générez un secret fort avec : `openssl rand -base64 32`
- Ne jamais utiliser le secret par défaut en production
- Les variables SMTP sont optionnelles. L’application fonctionne sans elles, mais aucun email de confirmation ne sera envoyé
- En local, vous pouvez aussi lancer avec `docker-compose --env-file .env up` pour charger explicitement le .env

### Ports

Par défaut :
- **Frontend** : port 14001 (seul service exposé sur l’hôte)
- **Backend** : non exposé ; l’API est accessible uniquement via le frontend (chemin `/api`)

Pour changer le port du frontend, modifiez `docker-compose.yml` :

```yaml
services:
  frontend:
    ports:
      - "14001:80"  # Changer 14001 selon vos besoins
```

### Volumes

Les données sont persistées dans le volume nommé **devtoolbox_data** (monté sur `/app/data` dans le backend) :

- Base de données SQLite : dans le volume `devtoolbox_data`
- Les données sont conservées après `docker-compose down` ; pour tout supprimer : `docker-compose down -v`

## Développement

### Mode développement local

Pour développer sans Docker :

```bash
# Backend
cd backend
npm install
npm run dev  # Port 1400

# Frontend
npm install
npm run dev  # Port 8080
```

### Développement avec Docker

Pour développer avec Docker en mode watch :

1. Modifier `docker-compose.yml` pour monter les volumes en développement
2. Utiliser `docker-compose -f docker-compose.dev.yml up` (si créé)

## Production

### Optimisations pour la production

1. **Variables d'environnement** : Utilisez des secrets Docker ou un gestionnaire de secrets
2. **HTTPS** : Configurez un reverse proxy (Traefik, Nginx) avec SSL
3. **Backup** : Automatisez les sauvegardes de la base de données
4. **Monitoring** : Ajoutez des outils de monitoring (Prometheus, Grafana)

### Images GHCR (recommandé en production)

Les images Docker sont publiées sur GitHub Container Registry à chaque release :

| Service | Image |
|---------|-------|
| Frontend | `ghcr.io/crollin/devtoolbox-frontend:<tag>` |
| Backend | `ghcr.io/crollin/devtoolbox-backend:<tag>` |

```bash
# Tirer une version précise
docker pull ghcr.io/crollin/devtoolbox-frontend:1.0.0
docker pull ghcr.io/crollin/devtoolbox-backend:1.0.0

# Démarrer avec le compose (latest par défaut, ou une version précise)
IMAGE_TAG=latest docker compose up -d
```

**Publier une nouvelle version** : créer un tag Git `vX.Y.Z` — le workflow `.github/workflows/docker-release.yml` build, push sur GHCR et crée la release GitHub.

Rendre les packages publics (une fois) : GitHub → Packages → devtoolbox-frontend → Package settings → Change visibility.

### Déploiement local ou build à la volée

```bash
# Build des images localement
docker compose build

# Démarrer
docker compose up -d
```

### Déploiement Coolify (recommandé : images GHCR)

Coolify **ne doit pas recompiler** l'application sur le serveur (risque OOM / timeout sur `npm ci` + `better-sqlite3`). Le `docker-compose.yml` tire les images pré-construites depuis GHCR.

1. **Créer une ressource**  
   Projet → **Create New Resource** → dépôt `Crollin/DevToolbox`.

2. **Build Pack**  
   **Docker Compose** — fichier `docker-compose.yml` (sans section `build`).

3. **Registry GHCR** (si les packages sont privés)  
   Coolify → **Settings** → **Docker Registries** → ajouter `ghcr.io` avec un PAT GitHub (`read:packages`).

4. **Domaine**  
   Assigner un domaine au service **`frontend`** uniquement.

5. **Variables d'environnement — toutes en « Runtime only »**  
   Ne cocher **aucune** variable en « Available at Buildtime » (y compris `NODE_ENV`, `JWT_SECRET`, `PORT`, etc.).  
   Variables minimales :

   | Variable | Exemple | Buildtime |
   |----------|---------|-----------|
   | `IMAGE_TAG` | `latest` | Non |
   | `JWT_SECRET` | `openssl rand -base64 32` | Non |
   | `CORS_ORIGIN` | `https://devtoolbox.example.com` | Non |
   | `FRONTEND_URL` | idem | Non |

   Optionnel : `SMTP_*`, `PORT`, `DB_PATH`, `FRONTEND_PORT`.

6. **Stockage**  
   Volume `devtoolbox_data` — la base SQLite est conservée entre déploiements. **Ne jamais** lancer `docker compose down -v` en production.

7. **Déployer**  
   Le déploiement fait un `docker pull` + `up` (quelques secondes), pas un build complet.

**Build local** (développement) :

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up --build
```

## Dépannage

### Le backend ne démarre pas

```bash
# Vérifier les logs
docker-compose logs backend

# Vérifier que JWT_SECRET est défini (obligatoire)
# En local : créer .env depuis .env.example et y mettre JWT_SECRET

# Rebuild le conteneur
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Échec du build Coolify (exit 127, « command not found »)

Coolify injecte `NODE_ENV=production` pendant le build, ce qui fait que `npm ci` omet les devDependencies (TypeScript, Vite…). Les Dockerfiles utilisent désormais `npm ci --include=dev` pour forcer leur installation. Si le problème persiste : dans Coolify → **Environment** → **NODE_ENV**, décocher « Available at Buildtime » et garder uniquement « Runtime only ».

### Le frontend ne se connecte pas à l'API

1. Vérifier que le backend est démarré : `docker-compose ps`
2. Vérifier la configuration Nginx : `docker-compose exec frontend cat /etc/nginx/conf.d/default.conf`
3. Tester l’API via le proxy du frontend ou depuis le conteneur backend : `docker-compose exec backend wget -q -O- http://localhost:1400/health`

### Problèmes de permissions

Les données sont dans le volume nommé `devtoolbox_data`. Si le conteneur backend signale des erreurs sur `/app/data`, vérifier que le volume est bien monté : `docker volume inspect devtoolbox_devtoolbox_data` (le préfixe peut varier selon le nom du projet Compose).

### Réinitialiser complètement

```bash
# Arrêter et supprimer conteneurs et volumes (⚠️ perte des données)
docker-compose down -v

# Supprimer les images
docker-compose rm -f

# Redémarrer
docker-compose up -d --build
```

## Architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTP
       │
┌──────▼──────────┐
│   Frontend      │
│   (Nginx)       │
│   Port 14001    │
└──────┬──────────┘
       │
       │ /api/* → Proxy
       │
┌──────▼──────────┐
│    Backend      │
│   (Express)     │
│   Port 1400     │
└──────┬──────────┘
       │
       │ SQLite
       │
┌──────▼──────────┐
│   Database      │
│   (SQLite)      │
│   ./data/*.db   │
└─────────────────┘
```

## Vérification avant le build

Avant de construire l'image Docker, vous pouvez vérifier que tout est prêt :

```bash
# Exécuter le script de vérification
./scripts/verify-docker-build.sh
```

Ce script vérifie :
- La présence de `browser-image-compression` dans package.json
- L'existence de `package-lock.json`
- La présence de tous les fichiers nécessaires pour l'outil Image Resizer

## Support

Pour toute question ou problème :
1. Vérifiez les logs : `docker-compose logs`
2. Consultez la documentation du projet
3. Ouvrez une issue sur le dépôt GitHub
