import { cmd } from "./helpers";
import type { WPCLICommandInput } from "@/types/wpcli";

export const multisiteCommands: WPCLICommandInput[] = [
  cmd({
    command: "wp core multisite-convert",
    description: "Convertit une install single en multisite",
    category: "Multisite",
    difficulty: "avancé",
    tags: ["setup", "multisite"],
    options: "--title --base=/ --subdomains",
    notes: "Backup obligatoire. Configurer ensuite les URLs / DNS / cookies.",
    examples: [
      { title: "Sous-dossiers", code: "wp core multisite-convert --title='Mon réseau'" },
      { title: "Sous-domaines", code: "wp core multisite-convert --title='Mon réseau' --subdomains" },
    ],
  }),
  cmd({
    command: "wp site list",
    description: "Liste les sites du réseau",
    category: "Multisite",
    difficulty: "intermédiaire",
    tags: ["multisite", "list"],
    examples: [
      { title: "Liste", code: "wp site list --fields=blog_id,url,last_updated" },
      { title: "Archivés", code: "wp site list --archived=1" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp site create",
    description: "Crée un site dans le réseau",
    category: "Multisite",
    difficulty: "intermédiaire",
    tags: ["multisite", "create"],
    options: "--slug --title --email --network_id --porcelain",
    examples: [
      {
        title: "Créer",
        code: "wp site create --slug=boutique --title='Boutique' --email=admin@example.com",
      },
    ],
  }),
  cmd({
    command: "wp site delete <id>",
    description: "Supprime un site",
    category: "Multisite",
    difficulty: "avancé",
    tags: ["multisite", "danger"],
    options: "--yes --keep-tables",
    examples: [{ title: "Delete", code: "wp site delete 5 --yes" }],
  }),
  cmd({
    command: "wp site empty",
    description: "Vide le contenu d'un site (garde users/settings)",
    category: "Multisite",
    difficulty: "avancé",
    tags: ["multisite", "reset"],
    examples: [{ title: "Empty", code: "wp site empty --yes" }],
  }),
  cmd({
    command: "wp site switch-language <language>",
    description: "Change la langue d'un site",
    category: "Multisite",
    difficulty: "intermédiaire",
    tags: ["multisite", "i18n"],
    examples: [{ title: "FR", code: "wp site switch-language fr_FR" }],
  }),
  cmd({
    command: "wp super-admin list",
    description: "Liste les super-admins du réseau",
    category: "Multisite",
    difficulty: "intermédiaire",
    tags: ["multisite", "security"],
    examples: [
      { title: "Liste", code: "wp super-admin list" },
      { title: "Ajouter", code: "wp super-admin add jean" },
      { title: "Retirer", code: "wp super-admin remove jean" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp network meta get <id> <key>",
    description: "Lit une meta réseau",
    category: "Multisite",
    difficulty: "avancé",
    tags: ["multisite", "meta"],
    examples: [{ title: "Get", code: "wp network meta get 1 site_name" }],
  }),
];

export const scaffoldCommands: WPCLICommandInput[] = [
  cmd({
    command: "wp scaffold plugin <slug>",
    description: "Génère un squelette de plugin",
    category: "Scaffold",
    difficulty: "intermédiaire",
    tags: ["dev", "plugin"],
    options: "--plugin_name --plugin_description --plugin_author --plugin_author_uri --skip-tests",
    examples: [
      {
        title: "Plugin",
        code: "wp scaffold plugin mon-plugin --plugin_name='Mon Plugin' --plugin_author='Agence'",
      },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp scaffold theme <slug>",
    description: "Génère un squelette de thème",
    category: "Scaffold",
    difficulty: "intermédiaire",
    tags: ["dev", "theme"],
    examples: [
      {
        title: "Thème",
        code: "wp scaffold theme mon-theme --theme_name='Mon Thème' --author='Agence'",
      },
    ],
  }),
  cmd({
    command: "wp scaffold child-theme <slug>",
    description: "Génère un thème enfant",
    category: "Scaffold",
    difficulty: "intermédiaire",
    tags: ["dev", "theme"],
    options: "--parent_theme=<slug> (requis)",
    examples: [
      {
        title: "Child",
        code: "wp scaffold child-theme mon-theme-child --parent_theme=twentytwentyfive",
      },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp scaffold post-type <slug>",
    description: "Génère le code d'un CPT",
    category: "Scaffold",
    difficulty: "intermédiaire",
    tags: ["dev", "cpt"],
    options: "--label --textdomain --dashicon --public --plugin=<slug> --theme",
    examples: [
      {
        title: "Dans un plugin",
        code: "wp scaffold post-type book --label='Livre' --plugin=mon-plugin",
      },
    ],
  }),
  cmd({
    command: "wp scaffold taxonomy <slug>",
    description: "Génère le code d'une taxonomie",
    category: "Scaffold",
    difficulty: "intermédiaire",
    tags: ["dev", "taxonomy"],
    options: "--post_types=<cpt> --label --plugin --theme",
    examples: [
      {
        title: "Taxonomie",
        code: "wp scaffold taxonomy genre --post_types=book --label='Genre' --plugin=mon-plugin",
      },
    ],
  }),
  cmd({
    command: "wp scaffold block <slug>",
    description: "Génère un block Gutenberg (plugin)",
    category: "Scaffold",
    difficulty: "avancé",
    tags: ["dev", "gutenberg"],
    options: "--title --dashicon --category --plugin=<slug>",
    examples: [
      {
        title: "Block",
        code: "wp scaffold block hero --title='Hero' --plugin=mon-plugin",
      },
    ],
  }),
];

export const packageCommands: WPCLICommandInput[] = [
  cmd({
    command: "wp package install <package>",
    description: "Installe un package WP-CLI (GitHub / Packagist)",
    category: "Package",
    difficulty: "intermédiaire",
    tags: ["wp-cli", "extend"],
    notes: "Ex. WooCommerce CLI : automattic/woocommerce. Les packages étendent WP-CLI, pas le site WP.",
    examples: [
      { title: "WooCommerce", code: "wp package install automattic/woocommerce" },
      { title: "Liste", code: "wp package list" },
      { title: "Uninstall", code: "wp package uninstall automattic/woocommerce" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp package update",
    description: "Met à jour les packages WP-CLI installés",
    category: "Package",
    difficulty: "intermédiaire",
    tags: ["wp-cli"],
    examples: [{ title: "Update", code: "wp package update" }],
  }),
  cmd({
    command: "wp cli info",
    description: "Infos sur l'environnement WP-CLI",
    category: "Package",
    tags: ["wp-cli", "audit"],
    examples: [
      { title: "Info", code: "wp cli info" },
      { title: "Version", code: "wp cli version" },
      { title: "Alias", code: "wp cli alias list" },
    ],
  }),
  cmd({
    command: "wp cli update",
    description: "Met à jour WP-CLI lui-même",
    category: "Package",
    difficulty: "intermédiaire",
    tags: ["wp-cli", "update"],
    examples: [
      { title: "Stable", code: "wp cli update" },
      { title: "Nightly", code: "wp cli update --nightly" },
    ],
  }),
  cmd({
    command: "wp cli cmd-dump",
    description: "Dump JSON de toutes les commandes disponibles",
    category: "Package",
    difficulty: "avancé",
    tags: ["wp-cli", "debug"],
    examples: [{ title: "Dump", code: "wp cli cmd-dump > commands.json" }],
  }),
];

export const languageCommands: WPCLICommandInput[] = [
  cmd({
    command: "wp language core install <locale>",
    description: "Installe une langue pour le core",
    category: "Language",
    tags: ["i18n"],
    options: "--activate",
    examples: [
      { title: "FR", code: "wp language core install fr_FR --activate" },
      { title: "Liste", code: "wp language core list --status=installed" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp language core update",
    description: "Met à jour les fichiers de langue du core",
    category: "Language",
    tags: ["i18n", "update"],
    examples: [{ title: "Update", code: "wp language core update" }],
  }),
  cmd({
    command: "wp language plugin install <plugin> <locale>",
    description: "Installe les traductions d'un plugin",
    category: "Language",
    difficulty: "intermédiaire",
    tags: ["i18n", "plugin"],
    examples: [
      { title: "Woo FR", code: "wp language plugin install woocommerce fr_FR" },
      { title: "Tous actifs", code: "wp language plugin install --all fr_FR" },
    ],
  }),
  cmd({
    command: "wp language theme install <theme> <locale>",
    description: "Installe les traductions d'un thème",
    category: "Language",
    difficulty: "intermédiaire",
    tags: ["i18n", "theme"],
    examples: [{ title: "Thème FR", code: "wp language theme install twentytwentyfive fr_FR" }],
  }),
  cmd({
    command: "wp i18n make-pot <path>",
    description: "Génère un fichier POT depuis le code source",
    category: "Language",
    difficulty: "avancé",
    tags: ["i18n", "dev"],
    examples: [
      {
        title: "POT plugin",
        code: "wp i18n make-pot wp-content/plugins/mon-plugin wp-content/plugins/mon-plugin/languages/mon-plugin.pot",
      },
    ],
  }),
  cmd({
    command: "wp i18n make-mo <path>",
    description: "Compile les fichiers PO en MO",
    category: "Language",
    difficulty: "intermédiaire",
    tags: ["i18n", "dev"],
    examples: [{ title: "Compile", code: "wp i18n make-mo wp-content/plugins/mon-plugin/languages" }],
  }),
];

export const exportCommands: WPCLICommandInput[] = [
  cmd({
    command: "wp export",
    description: "Exporte le contenu en WXR (XML WordPress)",
    category: "Export",
    difficulty: "intermédiaire",
    tags: ["export", "migration"],
    options: "--dir --post_type --start_date --end_date --max_file_size",
    examples: [
      { title: "Export complet", code: "wp export --dir=./exports" },
      { title: "Posts seulement", code: "wp export --post_type=post --dir=./exports" },
    ],
    isFavorite: true,
  }),
  cmd({
    command: "wp import <file>",
    description: "Importe un fichier WXR (nécessite le plugin WordPress Importer)",
    category: "Export",
    difficulty: "avancé",
    tags: ["import", "migration"],
    options: "--authors=create|skip|…\n--skip=image_resize",
    notes: "Installer d'abord : wp plugin install wordpress-importer --activate",
    examples: [
      {
        title: "Import",
        code: "wp plugin install wordpress-importer --activate\nwp import ./exports/content.xml --authors=create",
      },
    ],
  }),
  cmd({
    command: "wp widget list <sidebar>",
    description: "Liste les widgets d'une sidebar",
    category: "Export",
    difficulty: "intermédiaire",
    tags: ["widgets"],
    examples: [
      { title: "Sidebars", code: "wp sidebar list" },
      { title: "Widgets", code: "wp widget list sidebar-1" },
    ],
  }),
  cmd({
    command: "wp menu list",
    description: "Liste les menus de navigation",
    category: "Export",
    tags: ["menus"],
    examples: [
      { title: "Menus", code: "wp menu list" },
      { title: "Items", code: "wp menu item list main-menu" },
      {
        title: "Créer item",
        code: "wp menu item add-custom main-menu 'Contact' https://example.com/contact",
      },
    ],
  }),
];
