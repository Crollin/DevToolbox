# Base de données SQLite

## Structure

La base de données SQLite est utilisée pour stocker toutes les données de DevToolbox.

## Tables

### Authentification et utilisateurs

- `users` - Comptes utilisateurs
  - `id` (TEXT PRIMARY KEY) - Identifiant unique
  - `email` (TEXT UNIQUE) - Email de l'utilisateur
  - `password_hash` (TEXT) - Mot de passe hashé (bcrypt)
  - `name` (TEXT) - Nom de l'utilisateur
  - `created_at` (TEXT) - Date de création
  - `updated_at` (TEXT) - Date de mise à jour

- `sessions` - Blacklist de tokens (optionnel)
  - `id` (TEXT PRIMARY KEY) - Identifiant unique
  - `user_id` (TEXT) - Référence à l'utilisateur
  - `token` (TEXT) - Token JWT blacklisté
  - `expires_at` (TEXT) - Date d'expiration
  - `created_at` (TEXT) - Date de création

- `ntfy_configs` - Configurations Ntfy par utilisateur
  - `id` (TEXT PRIMARY KEY) - Identifiant unique
  - `user_id` (TEXT UNIQUE) - Référence à l'utilisateur
  - `enabled` (INTEGER) - Activation (0/1)
  - `server_url` (TEXT) - URL du serveur Ntfy
  - `topic` (TEXT) - Topic Ntfy
  - `token` (TEXT) - Token Ntfy (optionnel)
  - `created_at` (TEXT) - Date de création
  - `updated_at` (TEXT) - Date de mise à jour

### Données utilisateur

- `code_snippets` - Snippets de code
- `snippet_folders` - Dossiers de snippets
- `snippet_custom_tags` - Tags personnalisés de snippets
- `wp_hooks` - Hooks WordPress
- `wp_hook_categories` - Catégories de hooks
- `wp_queries` - Queries WordPress sauvegardées
- `color_palettes` - Palettes de couleurs
- `wp_scripts` - Scripts WordPress
- `wp_script_categories` - Catégories de scripts
- `wp_script_custom_tags` - Tags personnalisés de scripts
- `wp_cli_commands` - Commandes WP-CLI
- `wp_cli_categories` - Catégories WP-CLI
- `docker_commands` - Commandes Docker
- `docker_categories` - Catégories Docker
- `git_commands` - Commandes Git
- `git_categories` - Catégories Git
- `svg_icons` - Icônes SVG
- `licences` - Licences (modifiée pour inclure `user_id`)
  - `id` (TEXT PRIMARY KEY)
  - `user_id` (TEXT) - **NOUVEAU** - Référence à l'utilisateur propriétaire
  - `name` (TEXT) - Nom de la licence
  - `key` (TEXT) - Clé de licence
  - `type` (TEXT) - Type de licence
  - `status` (TEXT) - Statut (active, lifetime, expired)
  - `expires_at` (TEXT) - Date d'expiration
  - `notes` (TEXT) - Notes
  - `created_at` (TEXT) - Date de création
  - `updated_at` (TEXT) - Date de mise à jour

- `domains` - Portefeuille Domain Hub
  - `id`, `user_id`, `name`, `registrar`
  - `client_name`, `client_email`, `payer` (`agency` | `client`)
  - `cost_yearly`, `sell_yearly`, `currency`
  - `expires_at`, `auto_renew`, `notes`, `external_id`
  - `notifications_enabled`, `billing_status`, `last_billed_at`
  - `created_at`, `updated_at`

## Migration

La base de données est initialisée automatiquement au démarrage du serveur via `initializeDatabase()` dans `database.ts`.

Pour exécuter manuellement la migration :

```bash
npm run db:migrate
```

## Sauvegarde

Pour sauvegarder la base de données :

```bash
cp data/devtoolbox.db data/devtoolbox.db.backup
```

## Restauration

Pour restaurer depuis un backup :

```bash
cp data/devtoolbox.db.backup data/devtoolbox.db
```

