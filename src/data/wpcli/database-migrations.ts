import { cmd } from "./helpers";
import type { WPCLICommandInput } from "@/types/wpcli";

export const databaseCommands: WPCLICommandInput[] = [
  cmd({
    command: "wp db export",
    description: "Exporte la base en fichier SQL",
    category: "Database",
    tags: ["backup", "export"],
    options: "--add-drop-table\n--tables=<tables>\n--exclude_tables=<tables>\n--porcelain : Affiche seulement le chemin",
    notes: "Indispensable avant search-replace, update ou import.",
    examples: [
      { title: "Backup daté", code: "wp db export backup-$(date +%Y%m%d-%H%M).sql --add-drop-table" },
      { title: "Tables précises", code: "wp db export partial.sql --tables=wp_posts,wp_postmeta" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp db import <file>",
    description: "Importe un dump SQL",
    category: "Database",
    difficulty: "intermédiaire",
    tags: ["import", "restore"],
    notes: "Écrase les données existantes. Vérifier le préfixe de tables.",
    examples: [{ title: "Import", code: "wp db import backup.sql" }],
  }),
  cmd({
    command: "wp db query",
    description: "Exécute une requête SQL brute",
    category: "Database",
    difficulty: "avancé",
    tags: ["sql"],
    options: "--skip-column-names\nSTDIN accepté",
    notes: "Préférer les commandes WP-CLI métier quand elles existent.",
    examples: [
      {
        title: "SELECT",
        code: "wp db query \"SELECT ID, post_title FROM wp_posts WHERE post_type='post' LIMIT 5\"",
      },
      { title: "Depuis fichier", code: "wp db query < cleanup.sql" },
    ],
  }),
  cmd({
    command: "wp db optimize",
    description: "Optimise les tables (OPTIMIZE TABLE)",
    category: "Database",
    difficulty: "intermédiaire",
    tags: ["maintenance"],
    examples: [{ title: "Optimiser", code: "wp db optimize" }],
  }),
  cmd({
    command: "wp db repair",
    description: "Répare les tables (REPAIR TABLE)",
    category: "Database",
    difficulty: "avancé",
    tags: ["maintenance", "urgence"],
    notes: "À utiliser si MySQL signale des tables corrompues.",
    examples: [{ title: "Réparer", code: "wp db repair" }],
  }),
  cmd({
    command: "wp db size",
    description: "Affiche la taille de la base / des tables",
    category: "Database",
    tags: ["audit"],
    options: "--tables : Détail par table\n--human-readable\n--format=table|csv|json",
    examples: [
      { title: "Global", code: "wp db size --human-readable" },
      { title: "Par table", code: "wp db size --tables --human-readable" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp db prefix",
    description: "Affiche le préfixe des tables WordPress",
    category: "Database",
    tags: ["audit"],
    examples: [{ title: "Préfixe", code: "wp db prefix" }],
  }),
  cmd({
    command: "wp db tables",
    description: "Liste les tables de la base",
    category: "Database",
    tags: ["audit"],
    options: "--all-tables : Toutes les tables MySQL\n--format=csv",
    examples: [
      { title: "Tables WP", code: "wp db tables" },
      { title: "Toutes", code: "wp db tables --all-tables" },
    ],
  }),
  cmd({
    command: "wp db search <search>",
    description: "Recherche une chaîne dans toute la base",
    category: "Database",
    difficulty: "intermédiaire",
    tags: ["search", "audit"],
    options: "--all-tables\n--network\n--table_column_once",
    notes: "Lecture seule — idéal avant un search-replace pour estimer l'impact.",
    examples: [
      { title: "Chercher une URL", code: "wp db search 'http://old.example.com' --all-tables" },
      { title: "Tables WP seulement", code: "wp db search 'mailto:contact@' " },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp db clean",
    description: "Supprime les tables WordPress (DANGER)",
    category: "Database",
    difficulty: "avancé",
    tags: ["danger", "reset"],
    notes: "Destructif. Demande confirmation. Backup obligatoire.",
    examples: [{ title: "Reset tables WP", code: "wp db clean --yes" }],
  }),
  cmd({
    command: "wp db create",
    description: "Crée la base définie dans wp-config.php",
    category: "Database",
    difficulty: "intermédiaire",
    tags: ["setup"],
    examples: [{ title: "Créer la DB", code: "wp db create" }],
  }),
  cmd({
    command: "wp db drop",
    description: "Supprime entièrement la base (DANGER)",
    category: "Database",
    difficulty: "avancé",
    tags: ["danger"],
    examples: [{ title: "Drop", code: "wp db drop --yes" }],
  }),
  cmd({
    command: "wp db reset",
    description: "Drop + recreate la base (DANGER)",
    category: "Database",
    difficulty: "avancé",
    tags: ["danger", "reset"],
    examples: [{ title: "Reset", code: "wp db reset --yes" }],
  }),
  cmd({
    command: "wp db check",
    description: "Vérifie l'intégrité des tables (CHECK TABLE)",
    category: "Database",
    difficulty: "intermédiaire",
    tags: ["maintenance"],
    examples: [{ title: "Check", code: "wp db check" }],
  }),
];

/** Fiches search-replace + recettes Migrations */
export const migrationCommands: WPCLICommandInput[] = [
  cmd({
    command: "wp search-replace",
    description: "Recherche/remplace dans la BDD en gérant la sérialisation PHP",
    category: "Database",
    difficulty: "avancé",
    tags: ["search-replace", "migration", "dry-run", "sérialisation"],
    options:
      "<old> <new> [<table>...]\n--dry-run : Simule sans écrire\n--all-tables : Toutes les tables (même hors $wpdb)\n--all-tables-with-prefix : Tables avec le préfixe WP\n--network : Tables réseau multisite\n--precise : Recalcule les longueurs sérialisées (plus lent, plus sûr)\n--recurse-objects : Parcourt les objets PHP sérialisés\n--skip-columns=<cols> : Ex. guid\n--include-columns=<cols>\n--exclude-tables=<tables>\n--regex / --regex-flags=<flags> : Regex PCRE (ex. i = ignore casse)\n--report-changed-only\n--format=table|count",
    notes:
      "Par défaut la recherche est SENSIBLE à la casse. Pour ignorer la casse : --regex --regex-flags='i' (plus lent). Toujours --dry-run d'abord. Ne pas toucher aux GUID sauf besoin explicite (--skip-columns=guid).",
    examples: [
      {
        title: "Dry-run migration HTTPS",
        code: "wp search-replace 'http://example.com' 'https://example.com' --dry-run",
      },
      {
        title: "Appliquer (skip guid)",
        code: "wp search-replace 'http://example.com' 'https://example.com' --skip-columns=guid",
      },
      {
        title: "Insensible à la casse (regex)",
        code: "wp search-replace 'Example\\.Com' 'example.com' --regex --regex-flags='i' --dry-run",
      },
      {
        title: "Tables ciblées",
        code: "wp search-replace 'foo' 'bar' wp_posts wp_postmeta wp_options --dry-run",
      },
      {
        title: "Toutes les tables + précis",
        code: "wp search-replace 'old.test' 'new.test' --all-tables --precise --dry-run",
      },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "Recette : migration domaine (HTTP→HTTPS)",
    description: "Workflow sûr pour passer un site en HTTPS ou changer de domaine",
    category: "Migrations",
    difficulty: "avancé",
    tags: ["recette", "search-replace", "https", "dry-run"],
    options: "Enchaînement backup → dry-run → apply → flush → cache",
    notes:
      "Ordre recommandé. Adapter old/new. Sur multisite, ajouter --network et traiter wp_blogs / wp_site si besoin.",
    examples: [
      {
        title: "1. Backup",
        code: "wp db export pre-migrate-$(date +%Y%m%d).sql --add-drop-table",
      },
      {
        title: "2. Estimer l'impact",
        code: "wp db search 'http://old.example.com' --all-tables-with-prefix",
      },
      {
        title: "3. Dry-run",
        code: "wp search-replace 'http://old.example.com' 'https://new.example.com' --all-tables-with-prefix --skip-columns=guid --dry-run",
      },
      {
        title: "4. Appliquer",
        code: "wp search-replace 'http://old.example.com' 'https://new.example.com' --all-tables-with-prefix --skip-columns=guid --precise",
      },
      {
        title: "5. Finaliser",
        code: "wp rewrite flush --hard && wp cache flush && wp option get siteurl && wp option get home",
      },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "Recette : search-replace sensible vs casse",
    description: "Comprendre la sensibilité à la casse de wp search-replace",
    category: "Migrations",
    difficulty: "intermédiaire",
    tags: ["recette", "casse", "regex", "dry-run"],
    notes:
      "Sans --regex, 'WordPress' ≠ 'wordpress'. Avec --regex --regex-flags='i', les deux matchent. Les captures regex utilisent \\1, \\2… Attention aux perfs sur grosses DB.",
    examples: [
      {
        title: "Casse exacte (défaut)",
        code: "wp search-replace 'WordPress' 'WordPress' --dry-run\n# ne touche PAS 'wordpress' ni 'WORDPRESS'",
      },
      {
        title: "Ignore la casse",
        code: "wp search-replace 'wordpress' 'WordPress' --regex --regex-flags='i' --dry-run",
      },
      {
        title: "Regex avec capture",
        code: `wp search-replace '[\\[]foo id="([0-9]+)"' '[bar id="\\1"]' --regex --dry-run`,
      },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "Recette : prod → local",
    description: "Transformer une DB de production pour un environnement local",
    category: "Migrations",
    difficulty: "avancé",
    tags: ["recette", "local", "multisite", "search-replace"],
    notes: "Désactiver les emails sortants en local (plugin ou constante). Vérifier les chemins absolus dans les options.",
    examples: [
      {
        title: "Import + replace URL",
        code: "wp db import prod.sql\nwp search-replace 'https://www.example.com' 'http://example.local' --all-tables-with-prefix --skip-columns=guid --precise",
      },
      {
        title: "Multisite vers local",
        code: "wp search-replace --url=example.com example.com example.test 'wp_*options' wp_blogs wp_site --network --dry-run",
      },
      {
        title: "Debug local",
        code: "wp config set WP_DEBUG true --raw && wp config set WP_DEBUG_LOG true --raw && wp config set DISABLE_WP_CRON true --raw",
      },
    ],
  }),
  cmd({
    command: "Recette : staging → production",
    description: "Checklist avant de pousser une DB staging en prod",
    category: "Migrations",
    difficulty: "avancé",
    tags: ["recette", "production", "search-replace"],
    notes: "Backup prod d'abord. Mettre le site en maintenance. Recalculer les URLs, regenerer les thumbnails si besoin, purger caches CDN.",
    examples: [
      {
        title: "Séquence type",
        code: "wp maintenance-mode activate\nwp db export prod-before.sql --add-drop-table\nwp db import staging.sql\nwp search-replace 'https://staging.example.com' 'https://www.example.com' --all-tables-with-prefix --skip-columns=guid --precise\nwp rewrite flush --hard\nwp cache flush\nwp maintenance-mode deactivate",
      },
    ],
  }),
  cmd({
    command: "Recette : remplacer dans tables plugin",
    description: "Cibler des tables custom (page builders, ACF, etc.)",
    category: "Migrations",
    difficulty: "avancé",
    tags: ["recette", "tables", "search-replace"],
    notes: "--all-tables inclut les tables hors préfixe WP. Préférer lister les tables explicitement quand possible.",
    examples: [
      {
        title: "Lister puis cibler",
        code: "wp db tables --all-tables | grep elementor\nwp search-replace 'old.com' 'new.com' wp_postmeta wp_e_submissions --dry-run",
      },
      {
        title: "Exclure des tables lourdes",
        code: "wp search-replace 'old' 'new' --all-tables --exclude-tables=wp_actionscheduler_actions,wp_actionscheduler_logs --dry-run",
      },
    ],
  }),
];
