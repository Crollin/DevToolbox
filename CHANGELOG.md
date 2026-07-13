# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Ajouté

- Extension Raycast privée pour rechercher et gérer les licences DevToolbox
- Personal Access Tokens `dt_...` hashés, révocables et limités au scope `licences`
- Endpoints de création, liste et révocation des tokens privés
- Guide d'installation de l'extension Raycast

### Modifié

- Les routes `/api/licences` acceptent désormais les Personal Access Tokens dédiés aux intégrations privées
- README principal et documentation backend mis à jour avec les endpoints Raycast

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

[Unreleased]: https://github.com/Crollin/DevToolbox/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Crollin/DevToolbox/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Crollin/DevToolbox/releases/tag/v1.0.0
