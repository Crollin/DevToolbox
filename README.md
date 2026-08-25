# DevToolbox

Boîte à outils web pour développeurs — Git, Docker, WordPress, snippets, licences, tâches et plus — avec API, auth JWT et déploiement Docker.

![Version](https://img.shields.io/badge/version-1.6.0-blue)
![License](https://img.shields.io/badge/License-GPL--3.0-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

## Aperçu

**Accueil** — workspace, stats et recherche d’outils :

![Accueil DevToolbox](.github/screenshots/home.png)

**Catalogue d’outils** — 18 outils filtrables par catégorie :

![Catalogue d'outils DevToolbox](.github/screenshots/tools-grid.png)

**Authentification** — connexion / inscription (données fictives) :

![Authentification DevToolbox](.github/screenshots/auth-modal.png)

## Fonctionnalités

- **18 outils** : commandes Git/Docker, snippets, palettes, SVG, WP-CLI / hooks / queries / scripts, Image Resizer, CSV, Markdown, licences, Domain Hub, tâches (vue liste + Kanban), Knowledge Base, générateurs wp-config / plugin header
- **Feature flags** : activation modulaire des fonctionnalités par instance (`/api/config`)
- **Auth JWT** multi-comptes, reset mot de passe
- **Backend** Express + SQLite, notifications (email, Ntfy, Telegram, Web Push PWA)
- **Docker Compose** prêt pour self-host (images GHCR)
- **Intégrations API** : Personal Access Tokens (`dt_…`) via **Mon compte → Accès API** — [guide](docs/integrations/personal-access-tokens.md)
- **Extension [Raycast](raycast/README.md)** : licences, tâches, Knowledge Base
- **[MCP Task Reminder](mcp-task-reminder/README.md)** : Claude / Cursor en local (stdio)

## Notifications navigateur (Web Push / PWA)

Alertes natives OS quand l’app est installée / ouverte en HTTPS (Coolify).

1. Générer les clés VAPID une fois :
   ```sh
   npx web-push generate-vapid-keys
   ```
2. Ajouter au backend (`.env` ou Coolify) : `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:admin@votre-domaine.com`
3. Dans **Mon compte → Notifications** : **Activer sur cet appareil**
4. Sur iOS : ajouter DevToolbox à l’écran d’accueil avant d’activer

Sans ces variables, ntfy / email / Telegram continuent de fonctionner ; le bloc PWA indique « non configuré ».

## Démarrage rapide (Docker)

**Prérequis** : Docker et Docker Compose

```sh
git clone https://github.com/Crollin/DevToolbox
cd DevToolbox
cp .env.example .env
# Éditer .env : JWT_SECRET obligatoire (openssl rand -base64 32)
docker compose up -d
```

- **Frontend** : http://localhost:14001  
- **API** : http://localhost:1400 (ou via le proxy `/api` du frontend)

Images pré-construites : `ghcr.io/crollin/devtoolbox-frontend` et `ghcr.io/crollin/devtoolbox-backend` — détails dans [DOCKER.md](DOCKER.md).

## Développement local

**Prérequis** : Node.js 20+

```sh
git clone https://github.com/Crollin/DevToolbox
cd DevToolbox

# Backend
cd backend && cp ../.env.example .env && npm install && npm run dev
# → http://localhost:1400

# Frontend (autre terminal)
cd .. && npm install && npm run dev
# → http://localhost:8080
```

Configurez `VITE_API_URL` si besoin (voir `.env.example`).

## Architecture

| Couche | Stack |
|--------|--------|
| Frontend | React, Vite, TypeScript, Tailwind |
| Backend | Node.js, Express, SQLite |
| Auth | JWT + PAT pour intégrations |
| Déploiement | Docker Compose / GHCR |

## Documentation

- [Intégrations API](docs/integrations/README.md) · [Personal Access Tokens](docs/integrations/personal-access-tokens.md)
- [Guide Docker](DOCKER.md)
- [API backend](backend/README.md)
- [Extension Raycast](raycast/README.md)
- [MCP Task Reminder](mcp-task-reminder/README.md)
- [CHANGELOG](CHANGELOG.md)
- [CONTRIBUTING](CONTRIBUTING.md) · [SECURITY](SECURITY.md)

## Licence

GPL-3.0 — [LICENSE](LICENSE) · [Creactive Web](https://github.com/Crollin)

Copyright (C) 2024–2026 Creactiveweb
