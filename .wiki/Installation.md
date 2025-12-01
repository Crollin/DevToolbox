# Guide d'installation

Ce guide vous explique comment installer et configurer DevToolbox sur votre système.

## Table des matières

- [Prérequis](#prérequis)
- [Option 1 : Installation avec Docker (Recommandé)](#option-1--installation-avec-docker-recommandé)
- [Option 2 : Installation locale (Développement)](#option-2--installation-locale-développement)
- [Configuration initiale](#configuration-initiale)
- [Vérification de l'installation](#vérification-de-linstallation)
- [Dépannage](#dépannage)

## Prérequis

### Pour Docker (Option 1)

- **Docker** version 20.10 ou supérieure
- **Docker Compose** version 2.0 ou supérieure

Vérifiez vos versions :
```bash
docker --version
docker-compose --version
```

### Pour l'installation locale (Option 2)

- **Node.js** version 20 ou supérieure
- **npm** (inclus avec Node.js)
- **Git** pour cloner le dépôt

**Recommandation** : Utilisez [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) pour gérer Node.js.

Vérifiez vos versions :
```bash
node --version  # Doit être >= 20
npm --version
```

## Option 1 : Installation avec Docker (Recommandé)

Cette méthode est la plus simple et recommandée pour la production.

### Étape 1 : Cloner le dépôt

```bash
git clone https://github.com/Crollin/DevToolbox
cd DevToolbox
```

### Étape 2 : Démarrer les services

```bash
# Démarrer tous les services (frontend + backend + base de données)
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

### Étape 3 : Accéder à l'application

Une fois les conteneurs démarrés, l'application est accessible sur :

- **Frontend** : http://localhost
- **Backend API** : http://localhost:1400
- **Health check backend** : http://localhost:1400/health
- **Health check frontend** : http://localhost/health

### Commandes utiles Docker

```bash
# Arrêter les services
docker-compose down

# Redémarrer les services
docker-compose restart

# Rebuild après modifications
docker-compose up -d --build

# Voir les logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend

# Accéder au shell du backend
docker-compose exec backend sh
```

Pour plus de détails, consultez le [Guide Docker](Docker-Guide).

## Option 2 : Installation locale (Développement)

Cette méthode est recommandée pour le développement.

### Étape 1 : Cloner le dépôt

```bash
git clone https://github.com/Crollin/DevToolbox
cd DevToolbox
```

### Étape 2 : Installer les dépendances du frontend

```bash
npm install
```

### Étape 3 : Installer les dépendances du backend

```bash
cd backend
npm install
cd ..
```

### Étape 4 : Démarrer le backend

Dans un terminal :

```bash
cd backend
npm run dev
```

Le backend démarre sur **http://localhost:1400**

### Étape 5 : Démarrer le frontend

Dans un autre terminal :

```bash
npm run dev
```

Le frontend démarre sur **http://localhost:8080** (ou le port disponible)

Le frontend est configuré pour proxy les requêtes `/api` vers le backend.

## Configuration initiale

### Variables d'environnement

#### Backend

Créez un fichier `.env` dans le dossier `backend/` :

```env
PORT=1400
NODE_ENV=development
DB_PATH=./data/devtoolbox.db
```

#### Frontend

Créez un fichier `.env` à la racine du projet :

```env
VITE_API_URL=http://localhost:1400
```

### Base de données

La base de données SQLite est initialisée automatiquement au démarrage du backend.

Pour une migration manuelle :

```bash
# Avec Docker
docker-compose exec backend npm run db:migrate

# Localement
cd backend && npm run db:migrate
```

### Emplacement de la base de données

- **Docker** : `/app/data/devtoolbox.db` (monté dans `./data/`)
- **Local** : `./data/devtoolbox.db`

## Vérification de l'installation

### 1. Vérifier le backend

```bash
# Test de santé
curl http://localhost:1400/health

# Réponse attendue :
# {"status":"ok","timestamp":"2024-..."}
```

### 2. Vérifier le frontend

Ouvrez http://localhost:14001 (Docker) ou http://localhost:8080 (local) dans votre navigateur.

Vous devriez voir :
- La page d'accueil avec tous les outils
- La barre de recherche fonctionnelle
- Les filtres par catégorie

### 3. Tester l'API

```bash
# Lister les snippets
curl http://localhost:1400/api/snippets

# Réponse attendue : tableau JSON des snippets
```

### 4. Vérifier la base de données

```bash
# Avec Docker
docker-compose exec backend sh
cd /app/data
sqlite3 devtoolbox.db ".tables"

# Localement
cd data
sqlite3 devtoolbox.db ".tables"
```

## Dépannage

### Le backend ne démarre pas

1. **Vérifier le port** : Le port 1400 est-il disponible ?
   ```bash
   lsof -i :1400
   ```

2. **Vérifier les logs** :
   ```bash
   # Docker
   docker-compose logs backend
   
   # Local
   cd backend && npm run dev
   ```

3. **Vérifier les dépendances** :
   ```bash
   cd backend && npm install
   ```

### Le frontend ne se connecte pas à l'API

1. **Vérifier que le backend est démarré** :
   ```bash
   curl http://localhost:1400/health
   ```

2. **Vérifier la configuration du proxy** dans `vite.config.ts`

3. **Vérifier les variables d'environnement** :
   ```bash
   echo $VITE_API_URL
   ```

### Problèmes de permissions (Docker)

```bash
# Donner les permissions au dossier data
chmod -R 755 ./data

# Si nécessaire, changer le propriétaire
sudo chown -R $USER:$USER ./data
```

### Erreurs de base de données

```bash
# Supprimer et recréer la base de données
rm -rf ./data/devtoolbox.db

# Redémarrer le backend (la base sera recréée automatiquement)
docker-compose restart backend
# ou
cd backend && npm run dev
```

## Prochaines étapes

Une fois l'installation terminée :

1. Consultez le [Guide Docker](Docker-Guide) pour la configuration avancée
2. Explorez la [Référence API](API-Reference) pour comprendre les endpoints
3. Lisez le [Guide de développement](Development) pour contribuer
4. Découvrez les [guides des outils](Tools/) pour utiliser chaque fonctionnalité

## Support

Si vous rencontrez des problèmes :

1. Consultez la [FAQ](Troubleshooting)
2. Vérifiez les [logs Docker](Docker-Guide#logs-et-débogage)
3. Ouvrez une issue sur GitHub

---

*Dernière mise à jour : 2024*

