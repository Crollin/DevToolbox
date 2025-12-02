# Guide Docker

Guide complet pour utiliser Docker avec DevToolbox.

## Table des matières

- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
- [Commandes essentielles](#commandes-essentielles)
- [Configuration](#configuration)
- [Développement avec Docker](#développement-avec-docker)
- [Production](#production)
- [Dépannage](#dépannage)

## Architecture

Le projet utilise une architecture multi-conteneurs :

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

### Services

- **Frontend** : Application React/Vite servie par Nginx (port 14001)
- **Backend** : API REST Node.js/Express (port 1400)
- **Base de données** : SQLite (fichier persistant dans `./data`)

## Démarrage rapide

### 1. Cloner et préparer le projet

```bash
git clone <votre-repo>
cd DevToolbox

# Copier le fichier d'environnement (si nécessaire)
cp .env.example .env
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
- **Backend API** : http://localhost:1400
- **Health check backend** : http://localhost:1400/health
- **Health check frontend** : http://localhost:14001/health

## Commandes essentielles

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

# Voir les tables
docker-compose exec backend sh -c "cd /app/data && sqlite3 devtoolbox.db '.tables'"
```

## Configuration

### Variables d'environnement

#### Configuration avec fichier .env

Le fichier `.env` à la racine du projet est automatiquement chargé par Docker Compose pour le service backend.

**Étapes de configuration** :

```bash
# 1. Copier le fichier d'exemple
cp .env.example .env

# 2. Éditer .env avec vos valeurs
nano .env  # ou votre éditeur préféré
```

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
- En production, générez un `JWT_SECRET` fort : `openssl rand -base64 32`
- Les variables SMTP sont optionnelles mais recommandées pour l'envoi d'emails de confirmation

### Ports

Par défaut :
- Frontend : port 14001
- Backend : port 1400

Pour changer les ports, modifiez `docker-compose.yml` :

```yaml
services:
  frontend:
    ports:
      - "14001:80"  # Changer 14001 selon vos besoins
  backend:
    ports:
      - "1400:1400"  # Changer 1400 selon vos besoins
```

### Volumes

Les données sont persistées dans le dossier `./data` du projet :

- Base de données SQLite : `./data/devtoolbox.db`
- Les données sont conservées même après `docker-compose down`

Pour changer l'emplacement, modifiez le volume dans `docker-compose.yml`.

## Développement avec Docker

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

### Déploiement

```bash
# Build des images
docker-compose build

# Tag et push vers un registry (optionnel)
docker tag devtoolbox-frontend:latest registry.example.com/devtoolbox-frontend:latest
docker push registry.example.com/devtoolbox-frontend:latest

# Déployer sur le serveur
docker-compose pull
docker-compose up -d
```

### Script de vérification avant build

Avant de construire l'image Docker, vous pouvez vérifier que tout est prêt :

```bash
# Exécuter le script de vérification
./scripts/verify-docker-build.sh
```

Ce script vérifie :
- La présence de `browser-image-compression` dans package.json
- L'existence de `package-lock.json`
- La présence de tous les fichiers nécessaires pour l'outil Image Resizer

## Dépannage

### Le backend ne démarre pas

```bash
# Vérifier les logs
docker-compose logs backend

# Vérifier que le port n'est pas déjà utilisé
lsof -i :1400

# Rebuild le conteneur
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Le frontend ne se connecte pas à l'API

1. Vérifier que le backend est démarré : `docker-compose ps`
2. Vérifier la configuration Nginx : `docker-compose exec frontend cat /etc/nginx/conf.d/default.conf`
3. Tester l'API directement : `curl http://localhost:1400/health`

### Problèmes de permissions

```bash
# Donner les permissions au dossier data
chmod -R 755 ./data

# Si nécessaire, changer le propriétaire
sudo chown -R $USER:$USER ./data
```

### Réinitialiser complètement

```bash
# Arrêter et supprimer tout
docker-compose down -v

# Supprimer les images
docker-compose rm -f

# Supprimer le dossier data (⚠️ perte de données)
rm -rf ./data

# Redémarrer
docker-compose up -d --build
```

### Problèmes de réseau

```bash
# Vérifier les réseaux Docker
docker network ls

# Inspecter le réseau
docker network inspect devtoolbox_default

# Recréer le réseau
docker-compose down
docker network prune
docker-compose up -d
```

### Problèmes de build

```bash
# Build sans cache
docker-compose build --no-cache

# Build un service spécifique
docker-compose build --no-cache backend

# Vérifier les images
docker images | grep devtoolbox
```

## Commandes avancées

### Exécuter des commandes dans les conteneurs

```bash
# Backend - Migration de base de données
docker-compose exec backend npm run db:migrate

# Backend - Accéder au shell
docker-compose exec backend sh

# Frontend - Vérifier la configuration Nginx
docker-compose exec frontend nginx -t
```

### Monitoring

```bash
# Utilisation des ressources
docker stats

# Utilisation des ressources d'un service
docker stats devtoolbox-backend-1

# Espace disque utilisé
docker system df
```

### Nettoyage

```bash
# Supprimer les conteneurs arrêtés
docker-compose rm

# Supprimer les images non utilisées
docker image prune

# Nettoyage complet (⚠️ attention)
docker system prune -a
```

## Support

Pour toute question ou problème :

1. Vérifiez les logs : `docker-compose logs`
2. Consultez la [documentation](Home)
3. Consultez le [guide de dépannage](Troubleshooting)
4. Ouvrez une issue sur le dépôt GitHub

---

*Dernière mise à jour : 2024*

