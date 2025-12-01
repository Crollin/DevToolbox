# Guide Docker - DevToolbox

Ce guide explique comment utiliser Docker pour déployer DevToolbox avec son backend API et sa base de données SQLite.

## Prérequis

- Docker (version 20.10 ou supérieure)
- Docker Compose (version 2.0 ou supérieure)

## Structure

Le projet utilise une architecture multi-conteneurs :

- **Frontend** : Application React/Vite servie par Nginx (port 80)
- **Backend** : API REST Node.js/Express (port 3000)
- **Base de données** : SQLite (fichier persistant dans `./data`)

## Démarrage rapide

### 1. Cloner et préparer le projet

```bash
# Cloner le dépôt (si nécessaire)
git clone <votre-repo>
cd DevToolbox

# Copier le fichier d'environnement
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

- **Frontend** : http://localhost
- **Backend API** : http://localhost:3000
- **Health check backend** : http://localhost:3000/health
- **Health check frontend** : http://localhost/health

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

Modifiez le fichier `.env` pour personnaliser la configuration :

```env
# Backend
BACKEND_PORT=3000
NODE_ENV=production
DB_PATH=./data/devtoolbox.db

# Frontend
FRONTEND_PORT=80
```

### Ports

Par défaut :
- Frontend : port 80
- Backend : port 3000

Pour changer les ports, modifiez `docker-compose.yml` :

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Changer 8080 selon vos besoins
  backend:
    ports:
      - "3001:3000"  # Changer 3001 selon vos besoins
```

### Volumes

Les données sont persistées dans le dossier `./data` du projet :

- Base de données SQLite : `./data/devtoolbox.db`
- Les données sont conservées même après `docker-compose down`

Pour changer l'emplacement, modifiez le volume dans `docker-compose.yml`.

## Développement

### Mode développement local

Pour développer sans Docker :

```bash
# Backend
cd backend
npm install
npm run dev  # Port 3000

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

## Dépannage

### Le backend ne démarre pas

```bash
# Vérifier les logs
docker-compose logs backend

# Vérifier que le port n'est pas déjà utilisé
lsof -i :3000

# Rebuild le conteneur
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Le frontend ne se connecte pas à l'API

1. Vérifier que le backend est démarré : `docker-compose ps`
2. Vérifier la configuration Nginx : `docker-compose exec frontend cat /etc/nginx/conf.d/default.conf`
3. Tester l'API directement : `curl http://localhost:3000/health`

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
│   Port 80       │
└──────┬──────────┘
       │
       │ /api/* → Proxy
       │
┌──────▼──────────┐
│    Backend      │
│   (Express)     │
│   Port 3000     │
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

