# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

## [1.5.0] - 2026-08-16

### Ajouté

- Serveur **MCP local** Task Reminder (`mcp-task-reminder/`) pour Claude Desktop, Claude Code et Cursor (stdio + PAT scope `tasks`)
- Filtres de tâches par statut et échéance
- Bouton **nouvelle tâche** (FAB) aussi sur desktop

### Modifié

- UX mobile de Task Reminder (layout, wizard de création, Kanban)
- Domain Hub : suppression des couches à un seul appelant (`FeatureGate`, `CompareLoading`, options CSV mortes, offres registrar fantômes)
- Labels Docker et badges version alignés sur `1.5.0`

### Corrigé

- FAB mobile fixé au viewport
- Glisser-déposer Kanban et changement de statut plus fiables

## [1.4.0] - 2026-07-30

### Ajouté

- **Pièces jointes** dans Task Reminder : upload multi-fichiers (max 10 Mo / 10 PJ par tâche), stockage disque local + métadonnées SQLite
- Prévisualisation **images et PDF** en lightbox desktop (~90 % viewport) ; icône + téléchargement pour les autres types
- Gestion des PJ dans le modal de création/édition et le sheet de détail
- API REST `/api/tasks/:taskId/attachments` (list, upload, stream, delete)

### Modifié

- Labels Docker et badges version alignés sur `1.4.0`

## [1.3.0] - 2026-07-29

### Ajouté

- Outil **Domain Hub** : comparateur multi-registrar (Cloudflare, Hostinger, OVH), portefeuille (client / payeur / dates), sync Hostinger, alertes d'expiration enrichies, export CSV facturation et suivi de statut billing
- API `/api/domains` (scope PAT `domains`) — activable via `DOMAIN_HUB_ENABLED=true`
- Endpoint public `GET /api/config` (feature flags instance, ex. `domainHubEnabled`)
- **Vue Kanban** dans Task Reminder avec glisser-déposer entre colonnes
- Système de **feature flags** frontend et backend (`FeatureFlagsContext`, `FeatureGate`, `/api/config`)

### Modifié

- **Domain Hub désactivé par défaut** : ajouter `DOMAIN_HUB_ENABLED=true` dans `.env` pour activer le module sur l'instance
- Labels Docker alignés sur la version `1.3.0`

### Retiré

- Outil **Mon Calcul Énergie** (ElectriCalc) et API `/api/electricalc`

## [1.2.1] - 2026-07-28

### Ajouté

- Onglet **Mon compte → Accès API** pour gérer les Personal Access Tokens (`dt_...`) de façon universelle (Raycast, Hermes, scripts HTTP)
- Suppression définitive des tokens révoqués (`DELETE /api/auth/personal-tokens/:id/permanent`)
- Guide [Personal Access Tokens](docs/integrations/personal-access-tokens.md) et hub [Intégrations API](docs/integrations/README.md)
- Intégration [Hermes Agent](hermes/README.md) pour Task Reminder (skill + doc prod)

### Modifié

- UI et documentation : branding « Raycast » remplacé par **Accès API** pour les tokens d'intégration
- Guides Raycast et Hermes alignés sur le même flux de création de PAT

### Corrigé

- Déploiement Coolify : conflit de port `14001` (frontend en `expose: 80`, proxy Traefik/Caddy)
- Compose Docker : fichiers `docker-compose.local.yml` / `docker-compose.build.yml` pour usage local explicite

## [1.2.0] - 2026-07-27

### Ajouté

- Extension Raycast pour licences, tâches et Knowledge Base
- Personal Access Tokens `dt_...` hashés, révocables, scopes `licences` / `tasks` / `knowledge_base`
- Gestion des tokens depuis **Mon compte → Raycast**
- Rappels de tâches enrichis (Raycast + API)
- Préparation release publique : GPL-3.0-only, CONTRIBUTING, SECURITY, hygiene repo

### Modifié

- Documentation Docker unifiée (`cp .env.example .env`, `docker compose`)
- Ton et guides Raycast pour usage public (hors Store)
- Labels Docker alignés sur la version `1.2.0`

### Corrigé

- Binding `const` dans MarkdownEditor (conversion de titres)

## [1.1.0] - 2026-06-24

### Ajouté

- **WP Config Generator** — génération d'extraits `wp-config.php` (debug, Redis, multisite)
- **Plugin Header Builder** — en-tête de plugin conforme WordPress.org
- **Dashboard accueil** — widgets licences expirantes, tâches en cours et KB récente
- **Recherche globale** — palette `Cmd+K` (outils, snippets, Knowledge Base)
- **Réinitialisation mot de passe** — flux `forgot-password` / `reset-password` par email
- **CTA connexion** dans le header + badge « Synchronisé »
- Migration **localStorage → API** pour 9 modules (Git, Docker, WP-CLI, hooks, queries, palettes, scripts, icônes SVG, ElectriCalc)
- Export **WooCommerce** dans CSV Preview Pro
- Presets et export PHP dans WP Query Builder
- Liens documentation WordPress sur les hooks WP
- Opt-in rappels automatiques des **tâches** (`task_auto_reminders_enabled`)
- Utilitaires `apiStorage`, `useCommandApi`, `safeJsonParse`, `getFrontendUrl`

### Modifié

- Harmonisation `FRONTEND_URL` (dev `8080`, Docker `14001`)
- Bookmarklet Knowledge Base avec URL absolue (`VITE_APP_URL`)
- Changement de mot de passe : vérification du mot de passe actuel requis
- Rappels licences limités aux seuils J-30, J-7, J-1, J0 et J+1
- README : port dev corrigé, nouveaux outils documentés

### Corrigé

- `JSON.parse` non protégé en backend → `safeJsonParse` sur les routes API
- Boucle de notifications pour licences déjà expirées
- Schéma Zod des palettes pour accepter les objets `PaletteColor` complets

## [1.0.0] - 2025

Version initiale : 16 outils, auth JWT, notifications multi-canaux (Ntfy, email, Telegram), déploiement Docker.

[Unreleased]: https://github.com/Crollin/DevToolbox/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/Crollin/DevToolbox/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Crollin/DevToolbox/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Crollin/DevToolbox/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/Crollin/DevToolbox/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Crollin/DevToolbox/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Crollin/DevToolbox/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Crollin/DevToolbox/releases/tag/v1.0.0
