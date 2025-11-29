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
  {
    id: "5",
    name: "Nettoyage des fichiers suspects",
    description: "Détecte et liste les fichiers suspects dans l'installation WordPress (backdoors, shells, etc.)",
    code: `<?php
/**
 * Scanner les fichiers suspects dans WordPress
 * À exécuter via WP-CLI ou page admin sécurisée
 */
function scan_suspicious_files() {
    $suspicious_patterns = array(
        'eval(',
        'base64_decode',
        'gzinflate',
        'str_rot13',
        'exec(',
        'system(',
        'shell_exec',
        'passthru',
        'preg_replace.*\/e',
    );
    
    $suspicious_files = array();
    $wp_root = ABSPATH;
    
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($wp_root)
    );
    
    foreach ($iterator as $file) {
        if ($file->isFile() && preg_match('/\.php$/', $file->getFilename())) {
            $content = file_get_contents($file->getPathname());
            
            foreach ($suspicious_patterns as $pattern) {
                if (preg_match('/' . $pattern . '/i', $content)) {
                    $suspicious_files[] = array(
                        'file' => str_replace($wp_root, '', $file->getPathname()),
                        'pattern' => $pattern,
                    );
                    break;
                }
            }
        }
    }
    
    return $suspicious_files;
}

// Exécuter le scan (à utiliser avec précaution)
// $results = scan_suspicious_files();
// print_r($results);`,
    language: "php",
    category: "Sécurité",
    tags: ["security", "scan", "backdoor"],
    wpVersionMin: "4.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "avancé",
    instructions: "Ce script doit être exécuté via WP-CLI ou une page admin sécurisée. Ne l'exécutez pas directement dans functions.php.",
    warnings: ["Peut être lent sur de gros sites", "Vérifiez manuellement les résultats avant de supprimer des fichiers"],
  },
  {
    id: "6",
    name: "Changement de préfixe de table",
    description: "Change le préfixe des tables WordPress pour améliorer la sécurité",
    code: `<?php
/**
 * Changer le préfixe des tables WordPress
 * À exécuter UNE SEULE FOIS via WP-CLI ou script standalone
 */
function change_table_prefix($old_prefix = 'wp_', $new_prefix = 'wp_new_') {
    global $wpdb;
    
    $tables = $wpdb->get_results("SHOW TABLES LIKE '{$old_prefix}%'", ARRAY_N);
    $renamed = 0;
    
    foreach ($tables as $table) {
        $old_table = $table[0];
        $new_table = str_replace($old_prefix, $new_prefix, $old_table);
        
        $wpdb->query("RENAME TABLE \`{$old_table}\` TO \`{$new_table}\`");
        $renamed++;
    }
    
    // Mettre à jour wp-config.php manuellement
    // Définir: $table_prefix = 'wp_new_';
    
    // Mettre à jour les options
    $wpdb->query("UPDATE {$new_prefix}options SET option_name = '{$new_prefix}user_roles' WHERE option_name = '{$old_prefix}user_roles'");
    
    return $renamed;
}

// Usage: change_table_prefix('wp_', 'wp_secure_');`,
    language: "php",
    category: "Sécurité",
    tags: ["security", "database", "table-prefix"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "avancé",
    instructions: "1. Faites une sauvegarde complète avant\n2. Exécutez le script UNE SEULE FOIS\n3. Modifiez wp-config.php pour changer \$table_prefix\n4. Videz le cache",
    warnings: ["FAITES UNE SAUVEGARDE COMPLÈTE AVANT", "Peut casser le site si mal exécuté", "Modifiez wp-config.php après"],
  },
  {
    id: "7",
    name: "Désactiver utilisateurs inactifs",
    description: "Désactive automatiquement les comptes utilisateurs inactifs depuis X jours",
    code: `<?php
/**
 * Désactiver les utilisateurs inactifs
 * À exécuter via cron ou manuellement
 */
function deactivate_inactive_users($days_inactive = 90) {
    global $wpdb;
    
    $cutoff_date = date('Y-m-d H:i:s', strtotime("-{$days_inactive} days"));
    
    $inactive_users = $wpdb->get_results($wpdb->prepare(
        "SELECT ID FROM {$wpdb->users} 
        WHERE user_registered < %s 
        AND ID NOT IN (
            SELECT DISTINCT user_id FROM {$wpdb->usermeta} 
            WHERE meta_key = 'last_activity' 
            AND meta_value > %s
        )",
        $cutoff_date,
        $cutoff_date
    ));
    
    $deactivated = 0;
    foreach ($inactive_users as $user) {
        // Changer le rôle à 'none' pour désactiver
        $user_obj = new WP_User($user->ID);
        $user_obj->set_role('none');
        
        // Ajouter un meta pour marquer comme désactivé
        update_user_meta($user->ID, 'account_deactivated', current_time('mysql'));
        $deactivated++;
    }
    
    return $deactivated;
}

// Ajouter au cron
// wp_schedule_event(time(), 'daily', 'deactivate_inactive_users');`,
    language: "php",
    category: "Sécurité",
    tags: ["security", "users", "cron"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "1. Ajustez \$days_inactive selon vos besoins\n2. Exécutez manuellement ou via cron\n3. Les utilisateurs désactivés peuvent être réactivés manuellement",
    warnings: ["Peut désactiver des utilisateurs légitimes", "Vérifiez la logique avant d'exécuter en production"],
  },
  {
    id: "8",
    name: "Vérification des permissions de fichiers",
    description: "Vérifie et corrige les permissions de fichiers WordPress pour la sécurité",
    code: `#!/bin/bash
# Vérifier et corriger les permissions WordPress
# Usage: ./check-permissions.sh

WP_ROOT="/var/www/html/wordpress"

echo "Vérification des permissions WordPress..."

# Permissions pour les dossiers (755)
find $WP_ROOT -type d -exec chmod 755 {} \;

# Permissions pour les fichiers (644)
find $WP_ROOT -type f -exec chmod 644 {} \;

# wp-config.php doit être 600
chmod 600 $WP_ROOT/wp-config.php

# .htaccess doit être 644
if [ -f "$WP_ROOT/.htaccess" ]; then
    chmod 644 $WP_ROOT/.htaccess
fi

# wp-content/uploads doit être 755
chmod 755 $WP_ROOT/wp-content/uploads

echo "Permissions vérifiées et corrigées."

# Afficher les permissions critiques
echo ""
echo "Permissions des fichiers critiques:"
ls -la $WP_ROOT/wp-config.php
ls -ld $WP_ROOT/wp-content/uploads`,
    language: "bash",
    category: "Sécurité",
    tags: ["security", "permissions", "filesystem"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "1. Modifiez WP_ROOT avec le chemin de votre installation\n2. Rendez exécutable: chmod +x check-permissions.sh\n3. Exécutez: ./check-permissions.sh",
    dependencies: ["bash", "find", "chmod"],
    warnings: ["Vérifiez les permissions avant d'exécuter", "Peut nécessiter les droits root"],
  },
  {
    id: "9",
    name: "Purge du cache",
    description: "Purge tous les caches WordPress (transients, object cache, etc.)",
    code: `<?php
/**
 * Purge complète du cache WordPress
 */
function purge_all_cache() {
    // Purger les transients expirés
    global $wpdb;
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_%' AND option_name NOT LIKE '_transient_timeout_%'");
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_%' AND option_value < UNIX_TIMESTAMP()");
    
    // Purger le cache d'objets si disponible
    if (function_exists('wp_cache_flush')) {
        wp_cache_flush();
    }
    
    // Purger le cache de requêtes
    if (function_exists('clean_post_cache')) {
        $posts = get_posts(array('numberposts' => -1));
        foreach ($posts as $post) {
            clean_post_cache($post->ID);
        }
    }
    
    // Purger le cache des termes
    if (function_exists('clean_term_cache')) {
        $terms = get_terms(array('hide_empty' => false));
        foreach ($terms as $term) {
            clean_term_cache($term->term_id, $term->taxonomy);
        }
    }
    
    // Purger le cache utilisateur
    if (function_exists('clean_user_cache')) {
        $users = get_users();
        foreach ($users as $user) {
            clean_user_cache($user->ID);
        }
    }
    
    // Action pour les plugins de cache
    do_action('cache_flush');
    
    return true;
}

// Utilisation: purge_all_cache();`,
    language: "php",
    category: "Performance",
    tags: ["performance", "cache", "transient"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "débutant",
    instructions: "Appelez la fonction purge_all_cache() quand vous avez besoin de purger tous les caches. Peut être ajouté à un hook ou exécuté manuellement.",
  },
  {
    id: "10",
    name: "Optimisation de la base de données",
    description: "Optimise toutes les tables de la base de données WordPress",
    code: `<?php
/**
 * Optimiser toutes les tables WordPress
 */
function optimize_wp_database() {
    global $wpdb;
    
    $tables = $wpdb->get_results("SHOW TABLES", ARRAY_N);
    $optimized = 0;
    
    foreach ($tables as $table) {
        $table_name = $table[0];
        $result = $wpdb->query("OPTIMIZE TABLE \`{$table_name}\`");
        
        if ($result !== false) {
            $optimized++;
        }
    }
    
    return $optimized;
}

// Ajouter au cron hebdomadaire
add_action('wp_scheduled_auto_draft_delete', 'optimize_wp_database');`,
    language: "php",
    category: "Performance",
    tags: ["performance", "database", "optimization"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "débutant",
    instructions: "Ajoutez dans functions.php. La fonction optimise toutes les tables. Peut être exécutée manuellement ou via cron.",
    warnings: ["Peut prendre du temps sur de grandes bases de données", "Faites une sauvegarde avant"],
  },
  {
    id: "11",
    name: "Nettoyage des transients expirés",
    description: "Supprime tous les transients expirés pour libérer de l'espace",
    code: `<?php
/**
 * Nettoyer les transients expirés
 */
function clean_expired_transients() {
    global $wpdb;
    
    // Supprimer les transients expirés
    $deleted = $wpdb->query(
        "DELETE a, b FROM {$wpdb->options} a, {$wpdb->options} b
        WHERE a.option_name LIKE '_transient_%' 
        AND a.option_name NOT LIKE '_transient_timeout_%'
        AND b.option_name = CONCAT('_transient_timeout_', SUBSTRING(a.option_name, 12))
        AND b.option_value < UNIX_TIMESTAMP()"
    );
    
    // Supprimer les transients orphelins (sans timeout)
    $wpdb->query(
        "DELETE FROM {$wpdb->options} 
        WHERE option_name LIKE '_transient_%' 
        AND option_name NOT LIKE '_transient_timeout_%'
        AND option_name NOT IN (
            SELECT CONCAT('_transient_', SUBSTRING(option_name, 20))
            FROM {$wpdb->options}
            WHERE option_name LIKE '_transient_timeout_%'
        )"
    );
    
    return $deleted;
}

// Exécuter quotidiennement
add_action('wp_scheduled_delete', 'clean_expired_transients');`,
    language: "php",
    category: "Performance",
    tags: ["performance", "transient", "cleanup"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "débutant",
    instructions: "Ajoutez dans functions.php. S'exécute automatiquement via le cron WordPress ou peut être appelé manuellement.",
  },
  {
    id: "12",
    name: "Compression d'images automatique",
    description: "Compresse automatiquement les images uploadées dans WordPress",
    code: `<?php
/**
 * Compression automatique des images
 * Nécessite l'extension GD ou Imagick
 */
function compress_uploaded_images($metadata, $attachment_id) {
    $file = get_attached_file($attachment_id);
    
    if (!file_exists($file)) {
        return $metadata;
    }
    
    $mime_type = get_post_mime_type($attachment_id);
    
    // Vérifier si c'est une image
    if (!in_array($mime_type, array('image/jpeg', 'image/png'))) {
        return $metadata;
    }
    
    // Compression JPEG
    if ($mime_type === 'image/jpeg') {
        $image = imagecreatefromjpeg($file);
        if ($image) {
            imagejpeg($image, $file, 85); // Qualité 85%
            imagedestroy($image);
        }
    }
    
    // Compression PNG
    if ($mime_type === 'image/png') {
        $image = imagecreatefrompng($file);
        if ($image) {
            imagealphablending($image, false);
            imagesavealpha($image, true);
            imagepng($image, $file, 6); // Compression niveau 6
            imagedestroy($image);
        }
    }
    
    return $metadata;
}
add_filter('wp_generate_attachment_metadata', 'compress_uploaded_images', 10, 2);`,
    language: "php",
    category: "Performance",
    tags: ["performance", "images", "compression"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "Ajoutez dans functions.php. Compresse automatiquement les images lors de l'upload. Ajustez la qualité selon vos besoins.",
    dependencies: ["GD ou Imagick PHP extension"],
    warnings: ["Modifie les images originales", "Ajustez la qualité selon vos besoins"],
  },
  {
    id: "13",
    name: "Nettoyage automatique complet",
    description: "Nettoie automatiquement spam, révisions, brouillons et autres éléments inutiles",
    code: `<?php
/**
 * Nettoyage automatique complet WordPress
 */
function auto_cleanup_wordpress() {
    global $wpdb;
    
    $cleaned = array();
    
    // Supprimer les commentaires spam
    $spam = $wpdb->query("DELETE FROM {$wpdb->comments} WHERE comment_approved = 'spam'");
    $cleaned['spam'] = $spam;
    
    // Supprimer les commentaires en attente de modération (plus de 30 jours)
    $pending = $wpdb->query(
        "DELETE FROM {$wpdb->comments} 
        WHERE comment_approved = '0' 
        AND comment_date < DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );
    $cleaned['pending'] = $pending;
    
    // Supprimer les révisions (garder seulement les 3 dernières)
    $revisions = $wpdb->get_results(
        "SELECT post_parent, COUNT(*) as count 
        FROM {$wpdb->posts} 
        WHERE post_type = 'revision' 
        GROUP BY post_parent 
        HAVING count > 3"
    );
    
    foreach ($revisions as $rev) {
        $to_delete = $rev->count - 3;
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->posts} 
            WHERE post_type = 'revision' 
            AND post_parent = %d 
            ORDER BY post_date ASC 
            LIMIT %d",
            $rev->post_parent,
            $to_delete
        ));
    }
    $cleaned['revisions'] = count($revisions);
    
    // Supprimer les brouillons auto (plus de 7 jours)
    $auto_drafts = $wpdb->query(
        "DELETE FROM {$wpdb->posts} 
        WHERE post_status = 'auto-draft' 
        AND post_date < DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );
    $cleaned['auto_drafts'] = $auto_drafts;
    
    // Supprimer les posts en corbeille (plus de 30 jours)
    $trash = $wpdb->query(
        "DELETE FROM {$wpdb->posts} 
        WHERE post_status = 'trash' 
        AND post_date < DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );
    $cleaned['trash'] = $trash;
    
    return $cleaned;
}

// Exécuter quotidiennement
add_action('wp_scheduled_delete', 'auto_cleanup_wordpress');`,
    language: "php",
    category: "Maintenance",
    tags: ["maintenance", "cleanup", "spam", "revisions"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "débutant",
    instructions: "Ajoutez dans functions.php. S'exécute automatiquement via le cron WordPress. Ajustez les délais selon vos besoins.",
  },
  {
    id: "14",
    name: "Vérification de santé du site",
    description: "Vérifie la santé générale du site WordPress et génère un rapport",
    code: `<?php
/**
 * Vérification de santé WordPress
 */
function check_wordpress_health() {
    $health = array();
    
    // Vérifier la version PHP
    $php_version = phpversion();
    $health['php_version'] = array(
        'current' => $php_version,
        'recommended' => '7.4+',
        'status' => version_compare($php_version, '7.4', '>=') ? 'ok' : 'warning'
    );
    
    // Vérifier la mémoire
    $memory_limit = ini_get('memory_limit');
    $health['memory'] = array(
        'current' => $memory_limit,
        'recommended' => '256M+',
        'status' => (intval($memory_limit) >= 256) ? 'ok' : 'warning'
    );
    
    // Vérifier les extensions PHP
    $required_extensions = array('mysqli', 'curl', 'gd', 'mbstring', 'xml');
    $missing = array();
    foreach ($required_extensions as $ext) {
        if (!extension_loaded($ext)) {
            $missing[] = $ext;
        }
    }
    $health['extensions'] = array(
        'missing' => $missing,
        'status' => empty($missing) ? 'ok' : 'error'
    );
    
    // Vérifier les permissions
    $upload_dir = wp_upload_dir();
    $health['permissions'] = array(
        'upload_dir_writable' => is_writable($upload_dir['basedir']),
        'status' => is_writable($upload_dir['basedir']) ? 'ok' : 'error'
    );
    
    // Vérifier la taille de la base de données
    global $wpdb;
    $db_size = $wpdb->get_var("SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'size' FROM information_schema.TABLES WHERE table_schema = DATABASE()");
    $health['database_size'] = array(
        'current' => $db_size . ' MB',
        'status' => ($db_size < 500) ? 'ok' : 'warning'
    );
    
    return $health;
}

// Utilisation: $health = check_wordpress_health(); print_r($health);`,
    language: "php",
    category: "Maintenance",
    tags: ["maintenance", "health-check", "diagnostics"],
    wpVersionMin: "4.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "Appelez la fonction check_wordpress_health() pour obtenir un rapport de santé. Peut être intégré dans une page admin.",
  },
  {
    id: "15",
    name: "Nettoyage des médias orphelins",
    description: "Supprime les fichiers média qui ne sont plus attachés à des posts",
    code: `<?php
/**
 * Supprimer les médias orphelins
 */
function delete_orphaned_media() {
    global $wpdb;
    
    // Récupérer tous les fichiers média
    $attachments = $wpdb->get_results(
        "SELECT ID, post_parent, guid 
        FROM {$wpdb->posts} 
        WHERE post_type = 'attachment'"
    );
    
    $orphaned = array();
    $deleted = 0;
    
    foreach ($attachments as $attachment) {
        // Si pas de parent et pas utilisé dans le contenu
        if ($attachment->post_parent == 0) {
            $file_path = get_attached_file($attachment->ID);
            
            // Vérifier si l'image est utilisée dans le contenu
            $used = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->posts} 
                WHERE post_content LIKE %s",
                '%' . $wpdb->esc_like($attachment->guid) . '%'
            ));
            
            if ($used == 0 && file_exists($file_path)) {
                wp_delete_attachment($attachment->ID, true);
                $orphaned[] = $attachment->ID;
                $deleted++;
            }
        }
    }
    
    return array('deleted' => $deleted, 'orphaned_ids' => $orphaned);
}

// Utilisation: $result = delete_orphaned_media();`,
    language: "php",
    category: "Maintenance",
    tags: ["maintenance", "media", "cleanup"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "Exécutez manuellement cette fonction. Vérifiez les résultats avant de supprimer définitivement.",
    warnings: ["Supprime définitivement les fichiers", "Vérifiez les résultats avant d'exécuter en production"],
  },
  {
    id: "16",
    name: "Nettoyage des options",
    description: "Supprime les options orphelines et inutilisées de la base de données",
    code: `<?php
/**
 * Nettoyer les options inutilisées
 */
function clean_orphaned_options() {
    global $wpdb;
    
    $cleaned = array();
    
    // Options de plugins désactivés (commençant par le nom du plugin)
    $plugin_options = $wpdb->get_results(
        "SELECT option_name FROM {$wpdb->options} 
        WHERE option_name LIKE '_transient_%' 
        OR option_name LIKE '_site_transient_%'
        OR option_name LIKE 'widget_%'
        OR option_name LIKE 'theme_mods_%'"
    );
    
    // Options avec des valeurs vides ou nulles
    $empty_options = $wpdb->query(
        "DELETE FROM {$wpdb->options} 
        WHERE (option_value = '' OR option_value IS NULL) 
        AND option_name NOT LIKE '_transient_%'
        AND option_name NOT LIKE '_site_transient_%'
        AND option_name != 'active_plugins'
        AND option_name != 'template'
        AND option_name != 'stylesheet'"
    );
    $cleaned['empty'] = $empty_options;
    
    // Options de thèmes inactifs
    $active_theme = get_option('stylesheet');
    $theme_options = $wpdb->get_results(
        "SELECT option_name FROM {$wpdb->options} 
        WHERE option_name LIKE 'theme_mods_%' 
        AND option_name != 'theme_mods_{$active_theme}'"
    );
    
    foreach ($theme_options as $option) {
        delete_option($option->option_name);
    }
    $cleaned['theme_options'] = count($theme_options);
    
    return $cleaned;
}

// Utilisation: $result = clean_orphaned_options();`,
    language: "php",
    category: "Base de données",
    tags: ["database", "options", "cleanup"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "Exécutez manuellement cette fonction. Faites une sauvegarde avant car certaines options peuvent être nécessaires.",
    warnings: ["Peut supprimer des options importantes", "Faites une sauvegarde avant"],
  },
  {
    id: "17",
    name: "Réparation de la base de données",
    description: "Répare et optimise toutes les tables de la base de données",
    code: `<?php
/**
 * Réparer toutes les tables WordPress
 */
function repair_wp_database() {
    global $wpdb;
    
    $tables = $wpdb->get_results("SHOW TABLES", ARRAY_N);
    $repaired = array();
    
    foreach ($tables as $table) {
        $table_name = $table[0];
        
        // Vérifier la table
        $check = $wpdb->get_row("CHECK TABLE \`{$table_name}\`");
        
        if (isset($check->Msg_text) && $check->Msg_text !== 'OK') {
            // Réparer la table
            $repair = $wpdb->get_row("REPAIR TABLE \`{$table_name}\`");
            $repaired[$table_name] = $repair->Msg_text;
        }
        
        // Optimiser la table
        $wpdb->query("OPTIMIZE TABLE \`{$table_name}\`");
    }
    
    return $repaired;
}

// Utilisation: $result = repair_wp_database();`,
    language: "php",
    category: "Base de données",
    tags: ["database", "repair", "optimization"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "Exécutez cette fonction quand vous suspectez des problèmes de base de données. Faites une sauvegarde avant.",
    warnings: ["Faites une sauvegarde complète avant", "Peut prendre du temps sur de grandes bases"],
  },
  {
    id: "18",
    name: "Export sélectif de données",
    description: "Exporte des données spécifiques de WordPress (posts, utilisateurs, etc.)",
    code: `<?php
/**
 * Exporter des données spécifiques
 */
function export_wp_data($post_type = 'post', $limit = 100) {
    $args = array(
        'post_type' => $post_type,
        'posts_per_page' => $limit,
        'post_status' => 'publish',
    );
    
    $posts = get_posts($args);
    $export_data = array();
    
    foreach ($posts as $post) {
        $export_data[] = array(
            'ID' => $post->ID,
            'title' => $post->post_title,
            'content' => $post->post_content,
            'excerpt' => $post->post_excerpt,
            'date' => $post->post_date,
            'author' => get_the_author_meta('display_name', $post->post_author),
            'categories' => wp_get_post_categories($post->ID, array('fields' => 'names')),
            'tags' => wp_get_post_tags($post->ID, array('fields' => 'names')),
        );
    }
    
    // Convertir en JSON
    $json = json_encode($export_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
    // Sauvegarder dans un fichier
    $upload_dir = wp_upload_dir();
    $filename = $upload_dir['basedir'] . '/export_' . $post_type . '_' . date('Y-m-d') . '.json';
    file_put_contents($filename, $json);
    
    return $filename;
}

// Utilisation: $file = export_wp_data('post', 50);`,
    language: "php",
    category: "Base de données",
    tags: ["database", "export", "data"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "Appelez la fonction avec le type de post et la limite souhaités. Le fichier JSON sera créé dans wp-content/uploads.",
  },
  {
    id: "19",
    name: "Nettoyage des commandes WooCommerce",
    description: "Nettoie les commandes WooCommerce anciennes ou en statut spécifique",
    code: `<?php
/**
 * Nettoyer les commandes WooCommerce
 * Nécessite WooCommerce actif
 */
function clean_woocommerce_orders($status = 'cancelled', $days_old = 365) {
    if (!class_exists('WooCommerce')) {
        return false;
    }
    
    global $wpdb;
    
    $cutoff_date = date('Y-m-d H:i:s', strtotime("-{$days_old} days"));
    
    $orders = $wpdb->get_results($wpdb->prepare(
        "SELECT ID FROM {$wpdb->posts} 
        WHERE post_type = 'shop_order' 
        AND post_status = %s 
        AND post_date < %s",
        'wc-' . $status,
        $cutoff_date
    ));
    
    $deleted = 0;
    foreach ($orders as $order) {
        wp_delete_post($order->ID, true);
        $deleted++;
    }
    
    return $deleted;
}

// Utilisation: clean_woocommerce_orders('cancelled', 365);`,
    language: "php",
    category: "WooCommerce",
    tags: ["woocommerce", "orders", "cleanup"],
    wpVersionMin: "3.0",
    dependencies: ["WooCommerce"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "1. Vérifiez que WooCommerce est actif\n2. Ajustez le statut et le nombre de jours\n3. Exécutez la fonction",
    warnings: ["Supprime définitivement les commandes", "Faites une sauvegarde avant"],
  },
  {
    id: "20",
    name: "Synchronisation des stocks WooCommerce",
    description: "Synchronise les stocks WooCommerce avec une source externe ou corrige les incohérences",
    code: `<?php
/**
 * Synchroniser les stocks WooCommerce
 * Nécessite WooCommerce actif
 */
function sync_woocommerce_stock() {
    if (!class_exists('WooCommerce')) {
        return false;
    }
    
    $products = wc_get_products(array(
        'limit' => -1,
        'status' => 'publish',
    ));
    
    $synced = 0;
    $errors = array();
    
    foreach ($products as $product) {
        $product_id = $product->get_id();
        $current_stock = $product->get_stock_quantity();
        $manage_stock = $product->get_manage_stock();
        
        // Vérifier les incohérences
        if ($manage_stock && $current_stock !== null) {
            // Ici vous pouvez ajouter votre logique de synchronisation
            // Exemple: récupérer le stock depuis une API externe
            
            // Pour l'exemple, on vérifie juste que le stock n'est pas négatif
            if ($current_stock < 0) {
                $product->set_stock_quantity(0);
                $product->save();
                $synced++;
            }
        }
    }
    
    return array('synced' => $synced, 'errors' => $errors);
}

// Utilisation: $result = sync_woocommerce_stock();`,
    language: "php",
    category: "WooCommerce",
    tags: ["woocommerce", "stock", "sync"],
    wpVersionMin: "3.0",
    dependencies: ["WooCommerce"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "avancé",
    instructions: "Adaptez la fonction selon vos besoins de synchronisation. Peut être exécutée via cron pour une synchronisation automatique.",
    warnings: ["Modifie les stocks des produits", "Testez d'abord sur un environnement de développement"],
  },
  {
    id: "21",
    name: "Création d'utilisateurs en masse",
    description: "Crée plusieurs utilisateurs WordPress à partir d'un fichier CSV",
    code: `<?php
/**
 * Créer des utilisateurs en masse depuis CSV
 * Format CSV: email,username,password,role,first_name,last_name
 */
function bulk_create_users($csv_file) {
    if (!file_exists($csv_file)) {
        return array('error' => 'Fichier CSV introuvable');
    }
    
    $handle = fopen($csv_file, 'r');
    $created = 0;
    $errors = array();
    
    // Ignorer la première ligne (en-têtes)
    fgetcsv($handle);
    
    while (($data = fgetcsv($handle)) !== false) {
        $email = sanitize_email($data[0]);
        $username = sanitize_user($data[1]);
        $password = $data[2];
        $role = isset($data[3]) ? $data[3] : 'subscriber';
        $first_name = isset($data[4]) ? $data[4] : '';
        $last_name = isset($data[5]) ? $data[5] : '';
        
        // Vérifier si l'utilisateur existe
        if (email_exists($email) || username_exists($username)) {
            $errors[] = "Utilisateur existe déjà: {$username}";
            continue;
        }
        
        // Créer l'utilisateur
        $user_id = wp_create_user($username, $password, $email);
        
        if (is_wp_error($user_id)) {
            $errors[] = "Erreur pour {$username}: " . $user_id->get_error_message();
            continue;
        }
        
        // Définir le rôle
        $user = new WP_User($user_id);
        $user->set_role($role);
        
        // Ajouter les métadonnées
        update_user_meta($user_id, 'first_name', $first_name);
        update_user_meta($user_id, 'last_name', $last_name);
        
        $created++;
    }
    
    fclose($handle);
    
    return array('created' => $created, 'errors' => $errors);
}

// Utilisation: $result = bulk_create_users('/path/to/users.csv');`,
    language: "php",
    category: "Administration",
    tags: ["users", "bulk", "import"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "1. Créez un fichier CSV avec les colonnes: email,username,password,role,first_name,last_name\n2. Appelez la fonction avec le chemin du fichier",
    warnings: ["Crée des utilisateurs réels", "Vérifiez le format CSV avant"],
  },
  {
    id: "22",
    name: "Changement de rôle en masse",
    description: "Change le rôle de plusieurs utilisateurs en une seule fois",
    code: `<?php
/**
 * Changer le rôle de plusieurs utilisateurs
 */
function bulk_change_user_role($user_ids, $new_role) {
    if (!is_array($user_ids) || empty($user_ids)) {
        return false;
    }
    
    $changed = 0;
    $errors = array();
    
    foreach ($user_ids as $user_id) {
        $user = new WP_User($user_id);
        
        if (!$user->exists()) {
            $errors[] = "Utilisateur ID {$user_id} n'existe pas";
            continue;
        }
        
        $user->set_role($new_role);
        $changed++;
    }
    
    return array('changed' => $changed, 'errors' => $errors);
}

// Utilisation: 
// $user_ids = array(1, 2, 3, 4, 5);
// $result = bulk_change_user_role($user_ids, 'editor');`,
    language: "php",
    category: "Administration",
    tags: ["users", "roles", "bulk"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "débutant",
    instructions: "Passez un tableau d'IDs utilisateurs et le nouveau rôle. La fonction change le rôle de tous les utilisateurs spécifiés.",
    warnings: ["Modifie les permissions des utilisateurs", "Vérifiez les IDs avant d'exécuter"],
  },
  {
    id: "23",
    name: "Nettoyage des sessions",
    description: "Nettoie les sessions expirées et les données de session inutilisées",
    code: `<?php
/**
 * Nettoyer les sessions expirées
 */
function clean_expired_sessions() {
    global $wpdb;
    
    // Supprimer les sessions expirées (plus de 24 heures)
    $deleted = $wpdb->query(
        "DELETE FROM {$wpdb->options} 
        WHERE option_name LIKE '_wp_session_%' 
        AND option_value < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 24 HOUR))"
    );
    
    // Supprimer les transients de session
    $wpdb->query(
        "DELETE FROM {$wpdb->options} 
        WHERE option_name LIKE '_transient_wp_session_%' 
        AND option_name LIKE '_transient_timeout_wp_session_%'"
    );
    
    return $deleted;
}

// Exécuter quotidiennement
add_action('wp_scheduled_delete', 'clean_expired_sessions');`,
    language: "php",
    category: "Administration",
    tags: ["sessions", "cleanup", "security"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "débutant",
    instructions: "Ajoutez dans functions.php. S'exécute automatiquement via le cron WordPress.",
  },
  {
    id: "24",
    name: "Backup complet WordPress",
    description: "Script shell pour sauvegarder complètement WordPress (fichiers + base de données)",
    code: `#!/bin/bash
# Backup complet WordPress
# Usage: ./backup-wordpress.sh

WP_ROOT="/var/www/html/wordpress"
BACKUP_DIR="/var/backups/wordpress"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="wp_backup_$DATE"

# Configuration base de données
DB_NAME="wordpress_db"
DB_USER="wp_user"
DB_PASS="password"

# Créer le dossier de backup
mkdir -p $BACKUP_DIR/$BACKUP_NAME

echo "Début du backup WordPress..."

# Backup de la base de données
echo "Backup de la base de données..."
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > "$BACKUP_DIR/$BACKUP_NAME/database.sql.gz"

# Backup des fichiers
echo "Backup des fichiers..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME/files.tar.gz" -C $WP_ROOT .

# Créer un fichier info
echo "Création du fichier info..."
cat > "$BACKUP_DIR/$BACKUP_NAME/info.txt" << EOF
Date: $(date)
WordPress Root: $WP_ROOT
Database: $DB_NAME
Backup Type: Full
EOF

# Compresser le tout
cd $BACKUP_DIR
tar -czf "${BACKUP_NAME}.tar.gz" $BACKUP_NAME
rm -rf $BACKUP_NAME

# Supprimer les backups de plus de 30 jours
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup terminé: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "Taille: $(du -h $BACKUP_DIR/${BACKUP_NAME}.tar.gz | cut -f1)"`,
    language: "bash",
    category: "Backup",
    tags: ["backup", "database", "files"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "1. Modifiez les variables WP_ROOT, DB_NAME, DB_USER, DB_PASS\n2. Rendez exécutable: chmod +x backup-wordpress.sh\n3. Ajoutez au cron pour automatiser",
    dependencies: ["mysqldump", "tar", "gzip"],
    warnings: ["Ne stockez pas les mots de passe en clair", "Testez la restauration régulièrement"],
  },
  {
    id: "25",
    name: "Backup incrémental",
    description: "Script de backup incrémental qui ne sauvegarde que les fichiers modifiés",
    code: `#!/bin/bash
# Backup incrémental WordPress
# Usage: ./backup-incremental.sh

WP_ROOT="/var/www/html/wordpress"
BACKUP_DIR="/var/backups/wordpress/incremental"
DATE=$(date +%Y%m%d_%H%M%S)
LAST_BACKUP="$BACKUP_DIR/last_backup"

mkdir -p $BACKUP_DIR

# Si c'est le premier backup, faire un backup complet
if [ ! -f "$LAST_BACKUP" ]; then
    echo "Premier backup - création d'un backup complet..."
    tar -czf "$BACKUP_DIR/full_backup_$DATE.tar.gz" -C $WP_ROOT .
    touch -r "$BACKUP_DIR/full_backup_$DATE.tar.gz" "$LAST_BACKUP"
    echo "Backup complet créé"
    exit 0
fi

# Backup incrémental (seulement les fichiers modifiés)
echo "Backup incrémental..."
find $WP_ROOT -type f -newer "$LAST_BACKUP" -print0 | \
    tar -czf "$BACKUP_DIR/incremental_$DATE.tar.gz" --null -T -

# Mettre à jour la date du dernier backup
touch "$LAST_BACKUP"

echo "Backup incrémental terminé: $BACKUP_DIR/incremental_$DATE.tar.gz"`,
    language: "bash",
    category: "Backup",
    tags: ["backup", "incremental", "files"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "1. Modifiez WP_ROOT et BACKUP_DIR\n2. Rendez exécutable: chmod +x backup-incremental.sh\n3. Le premier exécution crée un backup complet, les suivantes sont incrémentales",
    dependencies: ["tar", "find"],
  },
  {
    id: "26",
    name: "Debug des hooks WordPress",
    description: "Affiche tous les hooks et filtres actifs pour le débogage",
    code: `<?php
/**
 * Debug des hooks WordPress
 * Affiche tous les hooks et leurs callbacks
 */
function debug_wordpress_hooks() {
    global $wp_filter;
    
    $hooks = array();
    
    foreach ($wp_filter as $hook_name => $hook_obj) {
        if (!isset($hook_obj->callbacks)) {
            continue;
        }
        
        $callbacks = array();
        foreach ($hook_obj->callbacks as $priority => $functions) {
            foreach ($functions as $function) {
                $callbacks[] = array(
                    'priority' => $priority,
                    'function' => is_array($function['function']) 
                        ? (is_object($function['function'][0]) 
                            ? get_class($function['function'][0]) . '::' . $function['function'][1]
                            : $function['function'][0] . '::' . $function['function'][1])
                        : $function['function'],
                    'accepted_args' => $function['accepted_args'],
                );
            }
        }
        
        $hooks[$hook_name] = $callbacks;
    }
    
    return $hooks;
}

// Afficher les hooks (à utiliser avec précaution)
// add_action('wp_footer', function() {
//     if (current_user_can('administrator') && isset($_GET['debug_hooks'])) {
//         echo '<pre>';
//         print_r(debug_wordpress_hooks());
//         echo '</pre>';
//     }
// });`,
    language: "php",
    category: "Hooks & Filtres",
    tags: ["hooks", "filters", "debug"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "avancé",
    instructions: "Appelez la fonction debug_wordpress_hooks() pour voir tous les hooks actifs. Peut être intégré dans une page admin ou affiché conditionnellement.",
    warnings: ["Peut générer beaucoup de données", "Ne pas utiliser en production sans protection"],
  },
  {
    id: "27",
    name: "Désactivation de hooks",
    description: "Désactive temporairement des hooks spécifiques pour le débogage",
    code: `<?php
/**
 * Désactiver des hooks spécifiques
 */
function disable_specific_hooks() {
    // Désactiver un hook spécifique
    remove_action('wp_head', 'wp_generator');
    remove_action('wp_head', 'wlwmanifest_link');
    remove_action('wp_head', 'rsd_link');
    
    // Désactiver tous les hooks d'un plugin spécifique
    // Exemple: désactiver tous les hooks de Yoast SEO
    global $wp_filter;
    foreach ($wp_filter as $hook_name => $hook_obj) {
        if (isset($hook_obj->callbacks)) {
            foreach ($hook_obj->callbacks as $priority => $functions) {
                foreach ($functions as $key => $function) {
                    $callback = $function['function'];
                    if (is_array($callback) && is_object($callback[0])) {
                        $class = get_class($callback[0]);
                        if (strpos($class, 'Yoast') !== false) {
                            remove_action($hook_name, $callback, $priority);
                        }
                    }
                }
            }
        }
    }
}

// Utilisation: disable_specific_hooks();`,
    language: "php",
    category: "Hooks & Filtres",
    tags: ["hooks", "disable", "debug"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "Adaptez la fonction selon les hooks que vous voulez désactiver. Utile pour le débogage.",
    warnings: ["Peut casser certaines fonctionnalités", "Utilisez seulement pour le débogage"],
  },
  {
    id: "28",
    name: "Installation WordPress via CLI",
    description: "Script shell pour installer WordPress rapidement via la ligne de commande",
    code: `#!/bin/bash
# Installation WordPress via CLI
# Usage: ./install-wp.sh domain.com

DOMAIN=$1
DB_NAME="wp_${DOMAIN//./_}"
DB_USER="wp_user"
DB_PASS=$(openssl rand -base64 32)
WP_ADMIN_USER="admin"
WP_ADMIN_PASS=$(openssl rand -base64 16)
WP_ADMIN_EMAIL="admin@${DOMAIN}"

echo "Installation de WordPress pour $DOMAIN..."

# Créer la base de données
mysql -u root -p << EOF
CREATE DATABASE $DB_NAME;
CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

# Télécharger WordPress
cd /var/www/html
wget https://wordpress.org/latest.tar.gz
tar -xzf latest.tar.gz
mv wordpress $DOMAIN
cd $DOMAIN

# Configurer wp-config.php
cp wp-config-sample.php wp-config.php
sed -i "s/database_name_here/$DB_NAME/" wp-config.php
sed -i "s/username_here/$DB_USER/" wp-config.php
sed -i "s/password_here/$DB_PASS/" wp-config.php

# Générer les clés de sécurité
curl -s https://api.wordpress.org/secret-key/1.1/salt/ >> wp-config.php

# Installer WordPress
php wp-cli.phar core install --url="http://$DOMAIN" \
    --title="Site $DOMAIN" \
    --admin_user="$WP_ADMIN_USER" \
    --admin_password="$WP_ADMIN_PASS" \
    --admin_email="$WP_ADMIN_EMAIL"

echo "Installation terminée!"
echo "URL: http://$DOMAIN"
echo "Admin: $WP_ADMIN_USER"
echo "Password: $WP_ADMIN_PASS"`,
    language: "bash",
    category: "Administration",
    tags: ["installation", "wp-cli", "setup"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "avancé",
    instructions: "1. Rendez exécutable: chmod +x install-wp.sh\n2. Exécutez: ./install-wp.sh example.com\n3. Adaptez les chemins selon votre configuration",
    dependencies: ["mysql", "wget", "curl", "wp-cli"],
    warnings: ["Crée une nouvelle installation WordPress", "Génère des mots de passe aléatoires"],
  },
  {
    id: "29",
    name: "Migration de site WordPress",
    description: "Script pour migrer un site WordPress vers un nouveau serveur",
    code: `#!/bin/bash
# Migration WordPress
# Usage: ./migrate-wp.sh source_server destination_server

SOURCE_SERVER=$1
DEST_SERVER=$2
WP_ROOT="/var/www/html/wordpress"

echo "Début de la migration WordPress..."

# Backup sur le serveur source
echo "Création du backup sur le serveur source..."
ssh $SOURCE_SERVER "cd $WP_ROOT && tar -czf /tmp/wp_backup.tar.gz ."

# Backup de la base de données
echo "Backup de la base de données..."
ssh $SOURCE_SERVER "mysqldump -u wp_user -p'password' wordpress_db | gzip > /tmp/wp_db_backup.sql.gz"

# Copier les fichiers vers la destination
echo "Copie des fichiers..."
scp $SOURCE_SERVER:/tmp/wp_backup.tar.gz /tmp/
scp $SOURCE_SERVER:/tmp/wp_db_backup.sql.gz /tmp/

# Extraire sur la destination
echo "Extraction sur le serveur de destination..."
ssh $DEST_SERVER "cd $WP_ROOT && tar -xzf /tmp/wp_backup.tar.gz"

# Restaurer la base de données
echo "Restauration de la base de données..."
gunzip < /tmp/wp_db_backup.sql.gz | ssh $DEST_SERVER "mysql -u wp_user -p'password' wordpress_db"

# Mettre à jour les URLs dans la base de données
echo "Mise à jour des URLs..."
ssh $DEST_SERVER "cd $WP_ROOT && php wp-cli.phar search-replace 'http://old-domain.com' 'http://new-domain.com'"

echo "Migration terminée!"`,
    language: "bash",
    category: "Administration",
    tags: ["migration", "backup", "deployment"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "avancé",
    instructions: "1. Configurez l'accès SSH sans mot de passe\n2. Modifiez les chemins et identifiants\n3. Exécutez: ./migrate-wp.sh source dest",
    dependencies: ["ssh", "scp", "mysql", "wp-cli"],
    warnings: ["Migre un site complet", "Vérifiez les chemins et identifiants avant"],
  },
  {
    id: "30",
    name: "Monitoring serveur WordPress",
    description: "Script de monitoring qui vérifie la santé du serveur WordPress",
    code: `#!/bin/bash
# Monitoring WordPress
# Usage: ./monitor-wp.sh

WP_ROOT="/var/www/html/wordpress"
LOG_FILE="/var/log/wp-monitor.log"
ALERT_EMAIL="admin@example.com"

echo "$(date): Début du monitoring WordPress" >> $LOG_FILE

# Vérifier l'espace disque
DISK_USAGE=$(df -h $WP_ROOT | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): ALERTE - Espace disque: ${DISK_USAGE}%" >> $LOG_FILE
    echo "Espace disque critique: ${DISK_USAGE}%" | mail -s "Alerte WordPress" $ALERT_EMAIL
fi

# Vérifier la mémoire
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEM_USAGE -gt 90 ]; then
    echo "$(date): ALERTE - Mémoire: ${MEM_USAGE}%" >> $LOG_FILE
fi

# Vérifier que WordPress répond
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
if [ $HTTP_CODE -ne 200 ]; then
    echo "$(date): ALERTE - WordPress ne répond pas (Code: $HTTP_CODE)" >> $LOG_FILE
    echo "WordPress ne répond pas" | mail -s "Alerte WordPress" $ALERT_EMAIL
fi

# Vérifier la taille de la base de données
DB_SIZE=$(mysql -u wp_user -p'password' -e "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'DB Size in MB' FROM information_schema.tables WHERE table_schema='wordpress_db';" | tail -1)
echo "$(date): Taille DB: ${DB_SIZE}MB" >> $LOG_FILE

echo "$(date): Monitoring terminé" >> $LOG_FILE`,
    language: "bash",
    category: "Maintenance",
    tags: ["monitoring", "server", "health"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "1. Modifiez les chemins et l'email d'alerte\n2. Rendez exécutable: chmod +x monitor-wp.sh\n3. Ajoutez au cron: */15 * * * * /path/to/monitor-wp.sh",
    dependencies: ["curl", "mysql", "mail"],
    warnings: ["Configurez l'email d'alerte", "Ajustez les seuils d'alerte"],
  },
  {
    id: "31",
    name: "Gestion des cron jobs WordPress",
    description: "Script pour gérer et lister les tâches cron WordPress",
    code: `#!/bin/bash
# Gestion des cron jobs WordPress
# Usage: ./wp-cron-manager.sh [list|run|clear]

WP_ROOT="/var/www/html/wordpress"
ACTION=$1

case $ACTION in
    list)
        echo "Liste des cron jobs WordPress:"
        cd $WP_ROOT
        php wp-cron.php --list
        ;;
    run)
        echo "Exécution des cron jobs..."
        cd $WP_ROOT
        php wp-cron.php
        echo "Cron jobs exécutés"
        ;;
    clear)
        echo "Nettoyage des cron jobs..."
        cd $WP_ROOT
        php wp-cli.phar cron event delete --all
        echo "Tous les cron jobs supprimés"
        ;;
    *)
        echo "Usage: $0 [list|run|clear]"
        exit 1
        ;;
esac`,
    language: "bash",
    category: "Maintenance",
    tags: ["cron", "wp-cli", "scheduled"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "débutant",
    instructions: "1. Modifiez WP_ROOT\n2. Rendez exécutable: chmod +x wp-cron-manager.sh\n3. Utilisez: ./wp-cron-manager.sh list|run|clear",
    dependencies: ["php", "wp-cli"],
  },
  {
    id: "32",
    name: "Vérification de sécurité serveur",
    description: "Vérifie la sécurité du serveur hébergeant WordPress",
    code: `#!/bin/bash
# Vérification de sécurité serveur
# Usage: ./security-check.sh

WP_ROOT="/var/www/html/wordpress"
REPORT_FILE="/tmp/security-report.txt"

echo "=== Rapport de sécurité WordPress ===" > $REPORT_FILE
echo "Date: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Vérifier les permissions
echo "1. Vérification des permissions:" >> $REPORT_FILE
find $WP_ROOT -type f -perm -o+w >> $REPORT_FILE 2>&1
if [ $? -eq 0 ]; then
    echo "   ⚠️  Fichiers avec permissions trop ouvertes trouvés" >> $REPORT_FILE
fi

# Vérifier wp-config.php
echo "" >> $REPORT_FILE
echo "2. Vérification wp-config.php:" >> $REPORT_FILE
if [ -f "$WP_ROOT/wp-config.php" ]; then
    PERMS=$(stat -c "%a" "$WP_ROOT/wp-config.php")
    if [ "$PERMS" != "600" ]; then
        echo "   ⚠️  Permissions wp-config.php: $PERMS (devrait être 600)" >> $REPORT_FILE
    else
        echo "   ✓ Permissions wp-config.php correctes" >> $REPORT_FILE
    fi
fi

# Vérifier les fichiers PHP suspects
echo "" >> $REPORT_FILE
echo "3. Recherche de fichiers suspects:" >> $REPORT_FILE
find $WP_ROOT -name "*.php" -exec grep -l "eval\|base64_decode\|shell_exec" {} \; >> $REPORT_FILE 2>&1

# Vérifier les versions
echo "" >> $REPORT_FILE
echo "4. Versions:" >> $REPORT_FILE
PHP_VERSION=$(php -v | head -1)
echo "   PHP: $PHP_VERSION" >> $REPORT_FILE

# Afficher le rapport
cat $REPORT_FILE`,
    language: "bash",
    category: "Sécurité",
    tags: ["security", "server", "permissions"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "1. Modifiez WP_ROOT\n2. Rendez exécutable: chmod +x security-check.sh\n3. Exécutez: ./security-check.sh",
    dependencies: ["find", "grep", "stat"],
  },
  {
    id: "33",
    name: "Déploiement automatique",
    description: "Script de déploiement automatique pour WordPress depuis Git",
    code: `#!/bin/bash
# Déploiement automatique WordPress
# Usage: ./deploy-wp.sh [staging|production]

ENVIRONMENT=$1
WP_ROOT="/var/www/html/wordpress"
GIT_REPO="https://github.com/user/wordpress-theme.git"
BRANCH="main"

if [ "$ENVIRONMENT" = "production" ]; then
    BRANCH="production"
    WP_ROOT="/var/www/html/wordpress-prod"
fi

echo "Déploiement sur $ENVIRONMENT..."

# Backup avant déploiement
echo "Création du backup..."
tar -czf "/var/backups/pre-deploy-$(date +%Y%m%d).tar.gz" -C $WP_ROOT .

# Aller dans le répertoire
cd $WP_ROOT/wp-content/themes/active-theme

# Récupérer les dernières modifications
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Installer les dépendances (si nécessaire)
if [ -f "package.json" ]; then
    npm install
    npm run build
fi

# Vider le cache
cd $WP_ROOT
php wp-cli.phar cache flush

echo "Déploiement terminé!"`,
    language: "bash",
    category: "Administration",
    tags: ["deployment", "git", "automation"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "avancé",
    instructions: "1. Configurez Git et les chemins\n2. Rendez exécutable: chmod +x deploy-wp.sh\n3. Utilisez: ./deploy-wp.sh staging|production",
    dependencies: ["git", "wp-cli", "npm"],
    warnings: ["Déploie du code en production", "Faites des tests avant"],
  },
  {
    id: "34",
    name: "Rotation des logs",
    description: "Gère la rotation des logs WordPress pour éviter qu'ils deviennent trop volumineux",
    code: `#!/bin/bash
# Rotation des logs WordPress
# Usage: ./rotate-logs.sh

LOG_DIR="/var/log/wordpress"
MAX_SIZE="100M"
KEEP_DAYS=30

echo "Rotation des logs WordPress..."

# Créer le dossier s'il n'existe pas
mkdir -p $LOG_DIR

# Rotater les logs qui dépassent la taille maximale
find $LOG_DIR -name "*.log" -size +$MAX_SIZE -exec sh -c '
    LOG_FILE="$1"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    mv "$LOG_FILE" "${LOG_FILE}.${TIMESTAMP}"
    touch "$LOG_FILE"
    gzip "${LOG_FILE}.${TIMESTAMP}"
' _ {} \;

# Supprimer les anciens logs compressés
find $LOG_DIR -name "*.log.*.gz" -mtime +$KEEP_DAYS -delete

# Nettoyer les logs vides
find $LOG_DIR -name "*.log" -size 0 -delete

echo "Rotation terminée"`,
    language: "bash",
    category: "Maintenance",
    tags: ["logs", "rotation", "cleanup"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "débutant",
    instructions: "1. Modifiez LOG_DIR et MAX_SIZE\n2. Rendez exécutable: chmod +x rotate-logs.sh\n3. Ajoutez au cron quotidien",
    dependencies: ["find", "gzip"],
  },
  {
    id: "35",
    name: "Conversion de charset base de données",
    description: "Convertit le charset et collation de toutes les tables WordPress",
    code: `<?php
/**
 * Convertir le charset de la base de données
 */
function convert_database_charset($new_charset = 'utf8mb4', $new_collation = 'utf8mb4_unicode_ci') {
    global $wpdb;
    
    $tables = $wpdb->get_results("SHOW TABLES", ARRAY_N);
    $converted = array();
    
    foreach ($tables as $table) {
        $table_name = $table[0];
        
        // Convertir la table
        $wpdb->query("ALTER TABLE \`{$table_name}\` CONVERT TO CHARACTER SET {$new_charset} COLLATE {$new_collation}");
        
        // Convertir chaque colonne
        $columns = $wpdb->get_results("SHOW FULL COLUMNS FROM \`{$table_name}\`");
        foreach ($columns as $column) {
            if (in_array($column->Type, array('varchar', 'char', 'text', 'tinytext', 'mediumtext', 'longtext'))) {
                $wpdb->query("ALTER TABLE \`{$table_name}\` MODIFY \`{$column->Field}\` {$column->Type} CHARACTER SET {$new_charset} COLLATE {$new_collation}");
            }
        }
        
        $converted[] = $table_name;
    }
    
    return $converted;
}

// Utilisation: convert_database_charset('utf8mb4', 'utf8mb4_unicode_ci');`,
    language: "php",
    category: "Base de données",
    tags: ["database", "charset", "conversion"],
    wpVersionMin: "4.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "avancé",
    instructions: "1. Faites une sauvegarde complète avant\n2. Exécutez la fonction avec le charset souhaité\n3. Vérifiez les résultats",
    warnings: ["FAITES UNE SAUVEGARDE COMPLÈTE", "Peut prendre du temps sur de grandes bases", "Peut casser le site si mal exécuté"],
  },
  {
    id: "36",
    name: "Génération de rapports WooCommerce",
    description: "Génère des rapports personnalisés pour WooCommerce",
    code: `<?php
/**
 * Générer des rapports WooCommerce
 * Nécessite WooCommerce actif
 */
function generate_woocommerce_reports() {
    if (!class_exists('WooCommerce')) {
        return false;
    }
    
    $reports = array();
    
    // Rapport des ventes
    $sales_data = wc_get_orders(array(
        'limit' => -1,
        'status' => 'completed',
        'date_created' => date('Y-m-d', strtotime('-30 days')) . '...' . date('Y-m-d'),
    ));
    
    $total_sales = 0;
    $order_count = count($sales_data);
    
    foreach ($sales_data as $order) {
        $total_sales += $order->get_total();
    }
    
    $reports['sales'] = array(
        'period' => '30 derniers jours',
        'total_sales' => wc_price($total_sales),
        'order_count' => $order_count,
        'average_order' => $order_count > 0 ? wc_price($total_sales / $order_count) : 0,
    );
    
    // Rapport des produits
    $products = wc_get_products(array('limit' => -1, 'status' => 'publish'));
    $reports['products'] = array(
        'total' => count($products),
        'in_stock' => 0,
        'out_of_stock' => 0,
    );
    
    foreach ($products as $product) {
        if ($product->is_in_stock()) {
            $reports['products']['in_stock']++;
        } else {
            $reports['products']['out_of_stock']++;
        }
    }
    
    // Rapport des clients
    $customers = get_users(array('role' => 'customer'));
    $reports['customers'] = array(
        'total' => count($customers),
        'new_last_30_days' => 0,
    );
    
    foreach ($customers as $customer) {
        if (strtotime($customer->user_registered) > strtotime('-30 days')) {
            $reports['customers']['new_last_30_days']++;
        }
    }
    
    return $reports;
}

// Utilisation: $reports = generate_woocommerce_reports(); print_r($reports);`,
    language: "php",
    category: "WooCommerce",
    tags: ["woocommerce", "reports", "analytics"],
    wpVersionMin: "3.0",
    dependencies: ["WooCommerce"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "Appelez la fonction generate_woocommerce_reports() pour obtenir un tableau de rapports. Peut être intégré dans une page admin.",
  },
  {
    id: "37",
    name: "Migration de produits WooCommerce",
    description: "Migre des produits WooCommerce depuis une source externe (CSV, API, etc.)",
    code: `<?php
/**
 * Migrer des produits WooCommerce depuis CSV
 * Format CSV: name,sku,price,stock,description,category
 */
function migrate_woocommerce_products($csv_file) {
    if (!class_exists('WooCommerce')) {
        return array('error' => 'WooCommerce non actif');
    }
    
    if (!file_exists($csv_file)) {
        return array('error' => 'Fichier CSV introuvable');
    }
    
    $handle = fopen($csv_file, 'r');
    $created = 0;
    $errors = array();
    
    // Ignorer la première ligne
    fgetcsv($handle);
    
    while (($data = fgetcsv($handle)) !== false) {
        $name = sanitize_text_field($data[0]);
        $sku = sanitize_text_field($data[1]);
        $price = floatval($data[2]);
        $stock = intval($data[3]);
        $description = wp_kses_post($data[4]);
        $category = sanitize_text_field($data[5]);
        
        // Vérifier si le produit existe déjà
        $existing_id = wc_get_product_id_by_sku($sku);
        if ($existing_id) {
            $errors[] = "Produit existe déjà: {$sku}";
            continue;
        }
        
        // Créer le produit
        $product = new WC_Product_Simple();
        $product->set_name($name);
        $product->set_sku($sku);
        $product->set_regular_price($price);
        $product->set_stock_quantity($stock);
        $product->set_manage_stock(true);
        $product->set_description($description);
        $product->set_status('publish');
        
        $product_id = $product->save();
        
        if (!$product_id) {
            $errors[] = "Erreur création produit: {$name}";
            continue;
        }
        
        // Ajouter la catégorie
        if (!empty($category)) {
            $term = term_exists($category, 'product_cat');
            if (!$term) {
                $term = wp_insert_term($category, 'product_cat');
            }
            if (!is_wp_error($term)) {
                wp_set_object_terms($product_id, array($term['term_id']), 'product_cat');
            }
        }
        
        $created++;
    }
    
    fclose($handle);
    
    return array('created' => $created, 'errors' => $errors);
}

// Utilisation: $result = migrate_woocommerce_products('/path/to/products.csv');`,
    language: "php",
    category: "WooCommerce",
    tags: ["woocommerce", "products", "migration", "import"],
    wpVersionMin: "3.0",
    dependencies: ["WooCommerce"],
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "avancé",
    instructions: "1. Créez un fichier CSV avec les colonnes: name,sku,price,stock,description,category\n2. Appelez la fonction avec le chemin du fichier",
    warnings: ["Crée des produits réels", "Vérifiez le format CSV avant"],
  },
  {
    id: "38",
    name: "Gestion des plugins",
    description: "Active, désactive ou supprime des plugins WordPress en masse",
    code: `<?php
/**
 * Gérer les plugins WordPress
 */
function manage_plugins($action, $plugin_slugs) {
    if (!is_array($plugin_slugs)) {
        $plugin_slugs = array($plugin_slugs);
    }
    
    $results = array();
    
    foreach ($plugin_slugs as $plugin) {
        switch ($action) {
            case 'activate':
                $result = activate_plugin($plugin);
                $results[$plugin] = is_wp_error($result) ? $result->get_error_message() : 'activé';
                break;
                
            case 'deactivate':
                deactivate_plugins($plugin);
                $results[$plugin] = 'désactivé';
                break;
                
            case 'delete':
                if (is_plugin_inactive($plugin)) {
                    delete_plugins(array($plugin));
                    $results[$plugin] = 'supprimé';
                } else {
                    $results[$plugin] = 'erreur: plugin actif';
                }
                break;
        }
    }
    
    return $results;
}

// Utilisation:
// manage_plugins('activate', array('plugin1/plugin1.php', 'plugin2/plugin2.php'));
// manage_plugins('deactivate', 'plugin1/plugin1.php');
// manage_plugins('delete', array('old-plugin/old-plugin.php'));`,
    language: "php",
    category: "Administration",
    tags: ["plugins", "management", "bulk"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "intermédiaire",
    instructions: "Appelez la fonction avec l'action (activate/deactivate/delete) et un tableau de slugs de plugins.",
    warnings: ["Modifie les plugins", "Faites une sauvegarde avant de supprimer"],
  },
  {
    id: "39",
    name: "Configuration automatique WordPress",
    description: "Configure automatiquement WordPress avec des paramètres optimisés",
    code: `<?php
/**
 * Configuration automatique WordPress
 */
function auto_configure_wordpress() {
    // Configuration de base
    update_option('blogname', 'Mon Site WordPress');
    update_option('blogdescription', 'Description du site');
    update_option('admin_email', 'admin@example.com');
    
    // Permaliens
    update_option('permalink_structure', '/%postname%/');
    
    // Timezone
    update_option('timezone_string', 'Europe/Paris');
    
    // Format de date
    update_option('date_format', 'd/m/Y');
    update_option('time_format', 'H:i');
    
    // Désactiver les commentaires par défaut
    update_option('default_comment_status', 'closed');
    
    // Limiter les révisions
    if (!defined('WP_POST_REVISIONS')) {
        define('WP_POST_REVISIONS', 3);
    }
    
    // Augmenter la mémoire
    if (!defined('WP_MEMORY_LIMIT')) {
        define('WP_MEMORY_LIMIT', '256M');
    }
    
    // Désactiver l'édition de fichiers
    if (!defined('DISALLOW_FILE_EDIT')) {
        define('DISALLOW_FILE_EDIT', true);
    }
    
    // Vider le cache
    if (function_exists('wp_cache_flush')) {
        wp_cache_flush();
    }
    
    return true;
}

// Utilisation: auto_configure_wordpress();`,
    language: "php",
    category: "Administration",
    tags: ["configuration", "setup", "settings"],
    wpVersionMin: "3.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "débutant",
    instructions: "Adaptez les valeurs selon vos besoins, puis exécutez la fonction. Modifie plusieurs options WordPress.",
    warnings: ["Modifie les paramètres WordPress", "Adaptez les valeurs avant d'exécuter"],
  },
  {
    id: "40",
    name: "Monitoring des filtres WordPress",
    description: "Surveille et enregistre tous les filtres WordPress utilisés pour le débogage",
    code: `<?php
/**
 * Monitoring des filtres WordPress
 */
class WP_Filter_Monitor {
    private static $filters_called = array();
    
    public static function init() {
        global $wp_filter;
        
        foreach ($wp_filter as $filter_name => $hook_obj) {
            add_filter($filter_name, array(__CLASS__, 'log_filter'), 1, 999);
        }
    }
    
    public static function log_filter($value) {
        $filter_name = current_filter();
        $backtrace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 3);
        
        if (!isset(self::$filters_called[$filter_name])) {
            self::$filters_called[$filter_name] = array();
        }
        
        self::$filters_called[$filter_name][] = array(
            'time' => microtime(true),
            'file' => isset($backtrace[2]['file']) ? basename($backtrace[2]['file']) : 'unknown',
            'line' => isset($backtrace[2]['line']) ? $backtrace[2]['line'] : 0,
        );
        
        return $value;
    }
    
    public static function get_report() {
        return self::$filters_called;
    }
    
    public static function save_report($filename = 'filter-report.json') {
        $upload_dir = wp_upload_dir();
        $file = $upload_dir['basedir'] . '/' . $filename;
        file_put_contents($file, json_encode(self::$filters_called, JSON_PRETTY_PRINT));
        return $file;
    }
}

// Initialiser le monitoring (seulement en mode debug)
if (defined('WP_DEBUG') && WP_DEBUG) {
    WP_Filter_Monitor::init();
    
    // Sauvegarder le rapport à la fin
    add_action('shutdown', function() {
        WP_Filter_Monitor::save_report();
    });
}

// Utilisation: $report = WP_Filter_Monitor::get_report();`,
    language: "php",
    category: "Hooks & Filtres",
    tags: ["filters", "monitoring", "debug"],
    wpVersionMin: "4.0",
    author: "Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    difficulty: "avancé",
    instructions: "Ajoutez dans functions.php. Le monitoring s'active seulement si WP_DEBUG est défini. Le rapport est sauvegardé dans wp-content/uploads.",
    warnings: ["Peut ralentir le site", "Utilisez seulement en développement"],
  },
];
