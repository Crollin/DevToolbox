# Référence API

Documentation complète de l'API REST backend de DevToolbox.

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Base URL](#base-url)
- [Codes de réponse](#codes-de-réponse)
- [Endpoints](#endpoints)
  - [Snippets](#snippets)
  - [Hooks WordPress](#hooks-wordpress)
  - [Queries WordPress](#queries-wordpress)
  - [Palettes de couleurs](#palettes-de-couleurs)
  - [Scripts WordPress](#scripts-wordpress)
  - [Commandes WP-CLI](#commandes-wp-cli)
  - [Commandes Docker](#commandes-docker)
  - [Commandes Git](#commandes-git)
  - [Icônes SVG](#icônes-svg)
  - [Licences](#licences)
  - [Calculateur électrique](#calculateur-électrique)
- [Health Check](#health-check)
- [Exemples](#exemples)

## Vue d'ensemble

L'API backend de DevToolbox est une API REST qui expose des endpoints pour gérer tous les modules de l'application. Tous les endpoints retournent des réponses au format JSON.

## Base URL

- **Développement local** : `http://localhost:1400`
- **Docker** : `http://localhost:1400`
- **Production** : `https://votre-domaine.com:1400`

## Codes de réponse

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Requête invalide |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

## Endpoints

### Snippets

Gestion des snippets de code avec support WPCodeBox.

#### `GET /api/snippets`

Récupère tous les snippets.

**Réponse** :
```json
{
  "snippets": [
    {
      "id": "uuid",
      "title": "Mon snippet",
      "description": "Description",
      "code": "<?php echo 'Hello'; ?>",
      "language": "php",
      "scope": "frontend",
      "priority": 10,
      "tags": ["wordpress", "php"],
      "folder": "Custom",
      "active": true,
      "runOnce": false,
      "wpCodeBoxId": null,
      "cloudId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "folders": ["Custom", "WPCodeBox"],
  "tags": ["wordpress", "php", "javascript"]
}
```

#### `GET /api/snippets/:id`

Récupère un snippet spécifique.

**Paramètres** :
- `id` (path) : ID du snippet

#### `POST /api/snippets`

Crée un nouveau snippet.

**Corps de la requête** :
```json
{
  "title": "Mon snippet",
  "description": "Description",
  "code": "<?php echo 'Hello'; ?>",
  "language": "php",
  "scope": "frontend",
  "priority": 10,
  "tags": ["wordpress", "php"],
  "folder": "Custom",
  "active": true,
  "runOnce": false
}
```

#### `PUT /api/snippets/:id`

Met à jour un snippet existant.

**Paramètres** :
- `id` (path) : ID du snippet

**Corps de la requête** : Même format que POST

#### `DELETE /api/snippets/:id`

Supprime un snippet.

**Paramètres** :
- `id` (path) : ID du snippet

#### `POST /api/snippets/folders`

Ajoute un dossier personnalisé.

**Corps de la requête** :
```json
{
  "name": "Mon dossier"
}
```

#### `POST /api/snippets/tags`

Ajoute un tag personnalisé.

**Corps de la requête** :
```json
{
  "name": "mon-tag"
}
```

### Hooks WordPress

Gestion des hooks WordPress (actions et filtres).

#### `GET /api/hooks`

Récupère tous les hooks.

**Réponse** :
```json
{
  "hooks": [
    {
      "id": "uuid",
      "name": "init",
      "type": "action",
      "description": "Hook déclenché après l'initialisation de WordPress",
      "category": "Core",
      "tags": ["wordpress", "core"],
      "example": "add_action('init', 'ma_fonction');",
      "parameters": "Aucun",
      "since": "1.0.0",
      "deprecated": null,
      "isFavorite": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "categories": ["Core", "Admin", "Theme"]
}
```

#### `POST /api/hooks`

Crée un nouveau hook.

**Corps de la requête** :
```json
{
  "name": "mon_hook",
  "type": "action",
  "description": "Description",
  "category": "Custom",
  "tags": ["wordpress"],
  "example": "add_action('mon_hook', 'ma_fonction');",
  "parameters": "Aucun",
  "since": "1.0.0"
}
```

#### `PUT /api/hooks/:id`

Met à jour un hook.

#### `DELETE /api/hooks/:id`

Supprime un hook.

#### `POST /api/hooks/categories`

Ajoute une catégorie personnalisée.

**Corps de la requête** :
```json
{
  "name": "Ma catégorie"
}
```

### Queries WordPress

Gestion des requêtes WP_Query.

#### `GET /api/queries`

Récupère toutes les queries.

**Réponse** :
```json
{
  "queries": [
    {
      "id": "uuid",
      "name": "Articles récents",
      "description": "Récupère les 10 derniers articles",
      "query": {
        "post_type": "post",
        "posts_per_page": 10
      },
      "category": "Posts",
      "tags": ["wordpress", "query"],
      "isFavorite": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/queries`

Crée une nouvelle query.

**Corps de la requête** :
```json
{
  "name": "Ma query",
  "description": "Description",
  "query": {
    "post_type": "post",
    "posts_per_page": 10
  },
  "category": "Posts",
  "tags": ["wordpress"]
}
```

#### `PUT /api/queries/:id`

Met à jour une query.

#### `DELETE /api/queries/:id`

Supprime une query.

### Palettes de couleurs

Gestion des palettes de couleurs.

#### `GET /api/palettes`

Récupère toutes les palettes.

**Réponse** :
```json
{
  "palettes": [
    {
      "id": "uuid",
      "name": "Ma palette",
      "description": "Description",
      "colors": [
        {"name": "Primary", "hex": "#3b82f6", "rgb": "59, 130, 246"}
      ],
      "tags": ["design", "ui"],
      "isFavorite": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/palettes`

Crée une nouvelle palette.

#### `PUT /api/palettes/:id`

Met à jour une palette.

#### `DELETE /api/palettes/:id`

Supprime une palette.

### Scripts WordPress

Gestion des scripts PHP/Shell WordPress.

#### `GET /api/scripts`

Récupère tous les scripts.

**Réponse** :
```json
{
  "scripts": [
    {
      "id": "uuid",
      "title": "Mon script",
      "description": "Description",
      "code": "<?php echo 'Hello'; ?>",
      "language": "php",
      "category": "Maintenance",
      "tags": ["wordpress", "php"],
      "isFavorite": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/scripts`

Crée un nouveau script.

#### `PUT /api/scripts/:id`

Met à jour un script.

#### `DELETE /api/scripts/:id`

Supprime un script.

### Commandes WP-CLI

Gestion des commandes WP-CLI.

#### `GET /api/wpcli`

Récupère toutes les commandes WP-CLI.

**Réponse** :
```json
{
  "commands": [
    {
      "id": "uuid",
      "command": "wp post list",
      "description": "Liste tous les articles",
      "category": "Posts",
      "tags": ["wordpress", "wp-cli"],
      "example": "wp post list --post_type=page",
      "isFavorite": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/wpcli`

Crée une nouvelle commande.

#### `PUT /api/wpcli/:id`

Met à jour une commande.

#### `DELETE /api/wpcli/:id`

Supprime une commande.

### Commandes Docker

Gestion des commandes Docker.

#### `GET /api/docker`

Récupère toutes les commandes Docker.

**Réponse** :
```json
{
  "commands": [
    {
      "id": "uuid",
      "command": "docker ps",
      "description": "Liste les conteneurs en cours d'exécution",
      "category": "Containers",
      "tags": ["docker", "containers"],
      "example": "docker ps -a",
      "isFavorite": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/docker`

Crée une nouvelle commande.

#### `PUT /api/docker/:id`

Met à jour une commande.

#### `DELETE /api/docker/:id`

Supprime une commande.

### Commandes Git

Gestion des commandes Git.

#### `GET /api/git`

Récupère toutes les commandes Git.

**Réponse** :
```json
{
  "commands": [
    {
      "id": "uuid",
      "command": "git status",
      "description": "Affiche l'état du dépôt",
      "category": "Basics",
      "tags": ["git", "status"],
      "example": "git status -s",
      "isFavorite": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/git`

Crée une nouvelle commande.

#### `PUT /api/git/:id`

Met à jour une commande.

#### `DELETE /api/git/:id`

Supprime une commande.

### Icônes SVG

Gestion des icônes SVG.

#### `GET /api/icons`

Récupère toutes les icônes.

**Réponse** :
```json
{
  "icons": [
    {
      "id": "uuid",
      "name": "Mon icône",
      "description": "Description",
      "svg": "<svg>...</svg>",
      "tags": ["ui", "icon"],
      "isFavorite": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/icons`

Crée une nouvelle icône.

#### `PUT /api/icons/:id`

Met à jour une icône.

#### `DELETE /api/icons/:id`

Supprime une icône.

### Licences

Gestion des clés de licence.

#### `GET /api/licences`

Récupère toutes les licences.

**Réponse** :
```json
{
  "licences": [
    {
      "id": "uuid",
      "name": "Mon produit",
      "key": "XXXX-XXXX-XXXX-XXXX",
      "type": "SaaS",
      "provider": "Provider",
      "status": "active",
      "expiresAt": "2024-12-31",
      "notes": "Notes",
      "tags": ["saas", "license"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/licences`

Crée une nouvelle licence.

#### `PUT /api/licences/:id`

Met à jour une licence.

#### `DELETE /api/licences/:id`

Supprime une licence.

### Calculateur électrique

Gestion du calculateur électrique.

#### `GET /api/electricalc/settings`

Récupère les paramètres du calculateur.

**Réponse** :
```json
{
  "settings": {
    "pricePerKwh": 0.15,
    "currency": "EUR"
  }
}
```

#### `PUT /api/electricalc/settings`

Met à jour les paramètres.

**Corps de la requête** :
```json
{
  "settings": {
    "pricePerKwh": 0.15,
    "currency": "EUR"
  }
}
```

#### `GET /api/electricalc/history`

Récupère l'historique des calculs (50 derniers).

**Réponse** :
```json
{
  "history": [
    {
      "id": 1,
      "calculation": {
        "power": 100,
        "hours": 24,
        "days": 30,
        "cost": 10.80
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/electricalc/history`

Ajoute un calcul à l'historique.

**Corps de la requête** :
```json
{
  "calculation": {
    "power": 100,
    "hours": 24,
    "days": 30,
    "cost": 10.80
  }
}
```

## Health Check

#### `GET /health`

Vérifie l'état du serveur.

**Réponse** :
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Exemples

### Exemple avec cURL

```bash
# Récupérer tous les snippets
curl http://localhost:1400/api/snippets

# Créer un snippet
curl -X POST http://localhost:1400/api/snippets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mon snippet",
    "code": "<?php echo \"Hello\"; ?>",
    "language": "php",
    "scope": "frontend"
  }'

# Mettre à jour un snippet
curl -X PUT http://localhost:1400/api/snippets/UUID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Snippet modifié",
    "code": "<?php echo \"Hello World\"; ?>"
  }'

# Supprimer un snippet
curl -X DELETE http://localhost:1400/api/snippets/UUID
```

### Exemple avec JavaScript (Fetch)

```javascript
// Récupérer tous les snippets
const response = await fetch('http://localhost:1400/api/snippets');
const data = await response.json();
console.log(data.snippets);

// Créer un snippet
const newSnippet = await fetch('http://localhost:1400/api/snippets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Mon snippet',
    code: '<?php echo "Hello"; ?>',
    language: 'php',
    scope: 'frontend'
  })
});
const result = await newSnippet.json();
console.log(result);
```

### Exemple avec Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:1400/api'
});

// Récupérer tous les snippets
const snippets = await api.get('/snippets');
console.log(snippets.data);

// Créer un snippet
const newSnippet = await api.post('/snippets', {
  title: 'Mon snippet',
  code: '<?php echo "Hello"; ?>',
  language: 'php',
  scope: 'frontend'
});
console.log(newSnippet.data);
```

## Notes importantes

1. **Format des dates** : Toutes les dates sont au format ISO 8601 (UTC)
2. **IDs** : Les IDs sont des UUIDs v4
3. **Tags** : Les tags sont stockés sous forme de tableaux JSON
4. **Base de données** : SQLite est utilisée, donc toutes les opérations sont synchrones
5. **CORS** : CORS est activé pour permettre les requêtes depuis le frontend
6. **Pas d'authentification** : L'API actuelle n'a pas d'authentification (à ajouter en production)

## Support

Pour toute question sur l'API :

1. Consultez le [Guide de développement](Development)
2. Vérifiez les [logs du backend](Docker-Guide#logs-et-débogage)
3. Ouvrez une issue sur GitHub

---

*Dernière mise à jour : 2024*

