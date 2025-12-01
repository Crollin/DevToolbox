# Base de données SQLite

## Structure

La base de données SQLite est utilisée pour stocker toutes les données de DevToolbox.

## Tables

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
- `licences` - Licences
- `electricalc_settings` - Paramètres du calculateur électrique
- `electricalc_history` - Historique des calculs

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

