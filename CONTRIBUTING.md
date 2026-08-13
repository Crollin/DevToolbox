# Contribuer à DevToolbox

## Prérequis

- Node.js **20+** (frontend / backend)
- Node.js **22+** pour l’extension Raycast
- Docker (optionnel, pour tester le compose)

## Setup

```bash
git clone https://github.com/Crollin/DevToolbox.git
cd DevToolbox
cp .env.example .env
# Définir au minimum JWT_SECRET

# Frontend
npm install
npm run dev

# Backend (autre terminal)
cd backend
npm install
npm run dev
```

## Garde-fous — ne pas committer

| Interdit | Exemples |
|----------|----------|
| Dépendances / build | `node_modules/`, `dist/` |
| Secrets | `.env`, `*.pem`, `secrets/`, `credentials/` |
| Données locales | `data/*.db`, `*.sqlite` |
| Scratch agents | `.serena/`, `.cursor/`, `.claude/`, `.codex/`, `.agents/`, `.superpowers/` |
| Docs internes | notes d’audit, backups `*.backup` |

## Vérifications avant PR

```bash
# Frontend
npm run lint
npm test

# Backend
cd backend && npm test

# Docker (optionnel)
./scripts/verify-docker-build.sh
```

## Intégrations API

- [Hub Intégrations API](docs/integrations/README.md)
- [Personal Access Tokens](docs/integrations/personal-access-tokens.md) — tokens `dt_...` via **Mon compte → Accès API**
- [Extension Raycast](raycast/README.md)
- [MCP Task Reminder (local)](mcp-task-reminder/README.md)
- [Agent Hermes](hermes/README.md)

```bash
cd raycast
npm install
npm run dev
```

Import dans Raycast : **Manage Extensions → + → Import Extension** → dossier `raycast`.

## Pull requests

1. Branche depuis `main`
2. Commits clairs, scope limité
3. Mettre à jour le [CHANGELOG.md](CHANGELOG.md) si le changement est user-facing
4. Ouvrir une PR vers `main`

## Licence

En contribuant, vous acceptez que vos contributions soient publiées sous **GPL-3.0-only** (voir [LICENSE](LICENSE)).
