# DevToolbox Backend API

Backend API REST pour DevToolbox utilisant Express.js et SQLite.

## Installation

```bash
npm install
```

## Développement

```bash
# Démarrer en mode développement avec rechargement automatique
npm run dev

# Le serveur démarre sur http://localhost:3000
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

### Licences
- `GET /api/licences` - Liste toutes les licences
- `POST /api/licences` - Crée une licence
- `PUT /api/licences/:id` - Met à jour une licence
- `DELETE /api/licences/:id` - Supprime une licence

### Calculateur électrique
- `GET /api/electricalc/settings` - Récupère les paramètres
- `PUT /api/electricalc/settings` - Met à jour les paramètres
- `GET /api/electricalc/history` - Récupère l'historique
- `POST /api/electricalc/history` - Ajoute un calcul à l'historique

### Health Check
- `GET /health` - Vérifie l'état du serveur

## Variables d'environnement

- `PORT` - Port du serveur (défaut: 3000)
- `NODE_ENV` - Environnement (development/production)
- `DB_PATH` - Chemin vers le fichier SQLite (défaut: ./data/devtoolbox.db)

## Structure du projet

```
backend/
├── src/
│   ├── db/
│   │   ├── database.ts      # Configuration SQLite
│   │   └── migrate.ts        # Script de migration
│   ├── routes/
│   │   ├── snippets.ts       # Routes pour les snippets
│   │   ├── hooks.ts          # Routes pour les hooks
│   │   ├── queries.ts        # Routes pour les queries
│   │   ├── palettes.ts       # Routes pour les palettes
│   │   ├── scripts.ts        # Routes pour les scripts
│   │   ├── wpcli.ts          # Routes pour WP-CLI
│   │   ├── docker.ts         # Routes pour Docker
│   │   ├── git.ts            # Routes pour Git
│   │   ├── icons.ts          # Routes pour les icônes
│   │   ├── licences.ts       # Routes pour les licences
│   │   └── electricalc.ts    # Routes pour le calculateur
│   └── index.ts              # Point d'entrée du serveur
├── data/                     # Dossier pour la base de données
├── dist/                     # Fichiers compilés
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Docker

Voir le fichier `DOCKER.md` à la racine du projet pour les instructions Docker complètes.

