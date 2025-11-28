export type ScriptLanguage = "php" | "sh" | "bash";
export type DifficultyLevel = "débutant" | "intermédiaire" | "avancé";

export interface WPScript {
  id: string;
  name: string;
  description: string;
  code: string;
  language: ScriptLanguage;
  category: string;
  tags: string[];
  wpVersionMin?: string;
  wpVersionMax?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  difficulty: DifficultyLevel;
  instructions?: string;
  dependencies?: string[];
  warnings?: string[];
}

export const defaultCategories = [
  "Sécurité",
  "Performance",
  "SEO",
  "WooCommerce",
  "Administration",
  "Base de données",
  "Maintenance",
  "Custom Post Types",
  "Hooks & Filtres",
  "Thèmes",
  "Plugins",
  "Backup",
];

export const defaultTags = [
  "wp-cli",
  "cron",
  "htaccess",
  "functions.php",
  "mu-plugins",
  "multisite",
  "rest-api",
  "gutenberg",
  "ajax",
  "shortcode",
  "widget",
  "transient",
  "option",
  "meta",
  "taxonomy",
];

export const defaultScripts: WPScript[] = [
  {
    id: "1",
    name: "Désactiver XML-RPC",
    description: "Désactive complètement XML-RPC pour améliorer la sécurité de WordPress.",
    code: `<?php
/**
 * Désactive XML-RPC pour WordPress
 * Ajouter dans functions.php ou mu-plugin
 */
add_filter('xmlrpc_enabled', '__return_false');

// Optionnel : supprimer l'en-tête HTTP
remove_action('wp_head', 'rsd_link');`,
    language: "php",
    category: "Sécurité",
    tags: ["functions.php", "mu-plugins"],
    wpVersionMin: "4.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "débutant",
    instructions: "Ajoutez ce code dans votre fichier functions.php ou créez un mu-plugin.",
    warnings: ["Désactive les fonctionnalités qui utilisent XML-RPC (Jetpack, app mobile WordPress)"],
  },
  {
    id: "2",
    name: "Backup base de données",
    description: "Script shell pour sauvegarder automatiquement la base de données WordPress.",
    code: `#!/bin/bash
# Backup WordPress Database
# Usage: ./backup-db.sh

DB_NAME="wordpress_db"
DB_USER="wp_user"
DB_PASS="password"
BACKUP_DIR="/var/backups/wordpress"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Supprimer les backups de plus de 7 jours
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_backup_$DATE.sql.gz"`,
    language: "sh",
    category: "Backup",
    tags: ["cron", "wp-cli"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "1. Modifiez les variables DB_NAME, DB_USER, DB_PASS\n2. Rendez le script exécutable: chmod +x backup-db.sh\n3. Ajoutez au cron pour automatiser",
    dependencies: ["mysqldump", "gzip"],
    warnings: ["Ne stockez pas les mots de passe en clair en production"],
  },
  {
    id: "3",
    name: "Purger les révisions",
    description: "Supprime toutes les révisions de posts pour optimiser la base de données.",
    code: `<?php
/**
 * Purge toutes les révisions WordPress
 * À exécuter une seule fois via WP-CLI ou plugin
 */
function purge_all_revisions() {
    global $wpdb;
    
    $revisions = $wpdb->get_results(
        "SELECT ID FROM {$wpdb->posts} WHERE post_type = 'revision'"
    );
    
    $count = 0;
    foreach ($revisions as $revision) {
        wp_delete_post_revision($revision->ID);
        $count++;
    }
    
    return $count;
}

// Limiter les révisions futures
add_filter('wp_revisions_to_keep', function($num) {
    return 3; // Garder seulement 3 révisions
});`,
    language: "php",
    category: "Performance",
    tags: ["functions.php", "option"],
    wpVersionMin: "3.6",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "Exécutez la fonction purge_all_revisions() une fois, puis ajoutez le filtre pour limiter les futures révisions.",
    warnings: ["Faites une sauvegarde de la base de données avant d'exécuter"],
  },
  {
    id: "4",
    name: "Custom Post Type",
    description: "Template pour créer un Custom Post Type complet avec taxonomies.",
    code: `<?php
/**
 * Enregistrement d'un Custom Post Type "Projets"
 */
function register_projet_cpt() {
    $labels = array(
        'name'               => 'Projets',
        'singular_name'      => 'Projet',
        'menu_name'          => 'Projets',
        'add_new'            => 'Ajouter',
        'add_new_item'       => 'Ajouter un projet',
        'edit_item'          => 'Modifier le projet',
        'new_item'           => 'Nouveau projet',
        'view_item'          => 'Voir le projet',
        'search_items'       => 'Rechercher',
        'not_found'          => 'Aucun projet trouvé',
    );

    $args = array(
        'labels'             => $labels,
        'public'             => true,
        'has_archive'        => true,
        'rewrite'            => array('slug' => 'projets'),
        'supports'           => array('title', 'editor', 'thumbnail', 'excerpt'),
        'menu_icon'          => 'dashicons-portfolio',
        'show_in_rest'       => true, // Gutenberg support
    );

    register_post_type('projet', $args);
}
add_action('init', 'register_projet_cpt');`,
    language: "php",
    category: "Custom Post Types",
    tags: ["functions.php", "gutenberg", "rest-api"],
    wpVersionMin: "5.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "débutant",
    instructions: "Ajoutez ce code dans functions.php. Après l'ajout, allez dans Réglages > Permaliens et cliquez sur Enregistrer pour mettre à jour les règles de réécriture.",
  },
];
