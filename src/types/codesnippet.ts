export type SnippetLanguage = "php" | "javascript" | "css" | "html" | "sql" | "bash" | "python" | "json";
export type SnippetScope = "global" | "admin" | "frontend" | "single-use";
export type SnippetPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: SnippetLanguage;
  scope: SnippetScope;
  priority: SnippetPriority;
  tags: string[];
  folder?: string;
  active: boolean;
  runOnce: boolean;
  createdAt: string;
  updatedAt: string;
  // WPCodeBox specific fields
  wpCodeBoxId?: number;
  cloudId?: string;
}

// WPCodeBox export format (based on typical WordPress snippet manager exports)
export interface WPCodeBoxSnippet {
  id?: number;
  title: string;
  code: string;
  description?: string;
  type?: string; // php, css, js, html
  scope?: string; // global, admin, frontend, single-use
  priority?: number;
  active?: boolean | number;
  tags?: string[];
  folder?: string;
  cloud_id?: string;
  run_once?: boolean | number;
  modified?: string;
  created?: string;
}

export interface WPCodeBoxExport {
  snippets?: WPCodeBoxSnippet[];
  folders?: { id: number; name: string; parent?: number }[];
  version?: string;
  exported_at?: string;
}

export const defaultSnippetCategories = [
  "WordPress",
  "WooCommerce",
  "Sécurité",
  "Performance",
  "SEO",
  "Admin",
  "Frontend",
  "API",
  "Database",
  "Utilities",
];

export const defaultSnippetTags = [
  "functions.php",
  "hooks",
  "filters",
  "actions",
  "shortcode",
  "widget",
  "ajax",
  "rest-api",
  "cron",
  "multisite",
  "gutenberg",
  "classic-editor",
  "woocommerce",
  "acf",
  "elementor",
];

export const languageLabels: Record<SnippetLanguage, string> = {
  php: "PHP",
  javascript: "JavaScript",
  css: "CSS",
  html: "HTML",
  sql: "SQL",
  bash: "Bash/Shell",
  python: "Python",
  json: "JSON",
};

export const scopeLabels: Record<SnippetScope, string> = {
  global: "Global (partout)",
  admin: "Admin uniquement",
  frontend: "Frontend uniquement",
  "single-use": "Exécution unique",
};

export const defaultSnippets: CodeSnippet[] = [
  {
    id: "1",
    title: "Disable Gutenberg Editor",
    description: "Désactive l'éditeur Gutenberg et revient à l'éditeur classique",
    code: `<?php
// Désactiver Gutenberg pour tous les types de posts
add_filter('use_block_editor_for_post', '__return_false', 10);

// Désactiver les widgets Gutenberg
add_filter('use_widgets_block_editor', '__return_false');`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["gutenberg", "classic-editor"],
    folder: "WordPress",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Add Custom Admin Footer",
    description: "Personnalise le pied de page de l'administration WordPress",
    code: `<?php
// Modifier le texte du footer admin
add_filter('admin_footer_text', function() {
    return 'Propulsé par <a href="https://wordpress.org">WordPress</a> | Développé avec ❤️';
});

// Modifier la version WordPress affichée
add_filter('update_footer', function() {
    return 'Version personnalisée';
}, 11);`,
    language: "php",
    scope: "admin",
    priority: 10,
    tags: ["admin", "hooks", "filters"],
    folder: "Admin",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "WooCommerce - Free Shipping Bar",
    description: "Affiche une barre de progression pour la livraison gratuite",
    code: `<?php
add_action('woocommerce_before_cart', 'display_free_shipping_bar');
function display_free_shipping_bar() {
    $min_amount = 50; // Montant minimum pour livraison gratuite
    $current = WC()->cart->subtotal;
    $remaining = $min_amount - $current;
    
    if ($remaining > 0) {
        $percent = ($current / $min_amount) * 100;
        echo '<div class="free-shipping-bar">';
        echo '<div class="progress" style="width: ' . $percent . '%"></div>';
        echo '<p>Plus que <strong>' . wc_price($remaining) . '</strong> pour la livraison gratuite!</p>';
        echo '</div>';
    } else {
        echo '<div class="free-shipping-notice">🎉 Livraison gratuite débloquée!</div>';
    }
}`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["woocommerce", "hooks"],
    folder: "WooCommerce",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Remove WordPress Version",
    description: "Supprime la version WordPress des headers pour plus de sécurité",
    code: `<?php
// Supprimer la version de WordPress du head
remove_action('wp_head', 'wp_generator');

// Supprimer la version des flux RSS
add_filter('the_generator', '__return_empty_string');

// Supprimer la version des scripts et styles
add_filter('style_loader_src', 'remove_version_query', 10, 2);
add_filter('script_loader_src', 'remove_version_query', 10, 2);
function remove_version_query($src, $handle) {
    if (strpos($src, 'ver=')) {
        $src = remove_query_arg('ver', $src);
    }
    return $src;
}`,
    language: "php",
    scope: "global",
    priority: 1,
    tags: ["security", "hooks", "filters"],
    folder: "Sécurité",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    title: "Disable XML-RPC",
    description: "Désactive XML-RPC pour améliorer la sécurité",
    code: `<?php
// Désactiver XML-RPC complètement
add_filter('xmlrpc_enabled', '__return_false');

// Bloquer les requêtes XML-RPC
add_filter('wp_headers', function($headers) {
    unset($headers['X-Pingback']);
    return $headers;
});`,
    language: "php",
    scope: "global",
    priority: 1,
    tags: ["security", "filters"],
    folder: "Sécurité",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    title: "Limit Login Attempts",
    description: "Limite les tentatives de connexion pour prévenir les attaques brute force",
    code: `<?php
add_action('wp_login_failed', 'limit_login_attempts');
function limit_login_attempts() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $transient = 'login_attempts_' . md5($ip);
    $attempts = get_transient($transient);
    
    if ($attempts === false) {
        set_transient($transient, 1, 15 * MINUTE_IN_SECONDS);
    } else {
        $attempts++;
        if ($attempts >= 5) {
            wp_die('Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.');
        }
        set_transient($transient, $attempts, 15 * MINUTE_IN_SECONDS);
    }
}

// Réinitialiser les tentatives après connexion réussie
add_action('wp_login', function() {
    $ip = $_SERVER['REMOTE_ADDR'];
    delete_transient('login_attempts_' . md5($ip));
});`,
    language: "php",
    scope: "global",
    priority: 1,
    tags: ["security", "hooks", "login"],
    folder: "Sécurité",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "7",
    title: "Disable File Editing",
    description: "Désactive l'éditeur de fichiers dans l'admin pour plus de sécurité",
    code: `<?php
// Désactiver l'édition de fichiers depuis l'admin
define('DISALLOW_FILE_EDIT', true);`,
    language: "php",
    scope: "global",
    priority: 1,
    tags: ["security"],
    folder: "Sécurité",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8",
    title: "Remove Query Strings from Static Resources",
    description: "Supprime les query strings des URLs de ressources statiques pour améliorer le cache",
    code: `<?php
function remove_query_strings($src) {
    if (strpos($src, '?ver=')) {
        $src = remove_query_arg('ver', $src);
    }
    return $src;
}
add_filter('script_loader_src', 'remove_query_strings', 15, 1);
add_filter('style_loader_src', 'remove_query_strings', 15, 1);`,
    language: "php",
    scope: "global",
    priority: 5,
    tags: ["performance", "filters", "cache"],
    folder: "Performance",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "9",
    title: "Disable Emojis",
    description: "Désactive les emojis WordPress pour améliorer les performances",
    code: `<?php
// Désactiver les emojis
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('admin_print_scripts', 'print_emoji_detection_script');
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('admin_print_styles', 'print_emoji_styles');
remove_filter('the_content_feed', 'wp_staticize_emoji');
remove_filter('comment_text_rss', 'wp_staticize_emoji');
remove_filter('wp_mail', 'wp_staticize_emoji_for_email');

// Supprimer DNS prefetch pour emojis
add_filter('emoji_svg_url', '__return_false');`,
    language: "php",
    scope: "global",
    priority: 5,
    tags: ["performance", "hooks"],
    folder: "Performance",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10",
    title: "Defer JavaScript Loading",
    description: "Diffère le chargement des scripts JavaScript pour améliorer les performances",
    code: `<?php
function defer_parsing_of_js($url) {
    if (is_admin()) return $url;
    if (false === strpos($url, '.js')) return $url;
    if (strpos($url, 'jquery.js')) return $url;
    return str_replace(' src', ' defer src', $url);
}
add_filter('script_loader_tag', 'defer_parsing_of_js', 10);`,
    language: "php",
    scope: "frontend",
    priority: 5,
    tags: ["performance", "filters", "javascript"],
    folder: "Performance",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "11",
    title: "Limit Post Revisions",
    description: "Limite le nombre de révisions de posts pour optimiser la base de données",
    code: `<?php
// Limiter le nombre de révisions à 3
define('WP_POST_REVISIONS', 3);

// Ou désactiver complètement
// define('WP_POST_REVISIONS', false);`,
    language: "php",
    scope: "global",
    priority: 5,
    tags: ["performance", "database"],
    folder: "Performance",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "12",
    title: "Change Excerpt Length",
    description: "Modifie la longueur des extraits de posts",
    code: `<?php
// Changer la longueur de l'extrait (par défaut 55 mots)
function custom_excerpt_length($length) {
    return 30; // Nombre de mots
}
add_filter('excerpt_length', 'custom_excerpt_length', 999);

// Changer le texte "Lire la suite"
function custom_excerpt_more($more) {
    return '... <a href="' . get_permalink() . '">Lire la suite</a>';
}
add_filter('excerpt_more', 'custom_excerpt_more');`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["hooks", "filters", "excerpt"],
    folder: "WordPress",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "13",
    title: "Add Custom Post Type",
    description: "Crée un type de post personnalisé avec support complet",
    code: `<?php
function create_custom_post_type() {
    register_post_type('portfolio',
        array(
            'labels' => array(
                'name' => 'Portfolio',
                'singular_name' => 'Projet',
                'add_new' => 'Ajouter un projet',
                'add_new_item' => 'Ajouter un nouveau projet',
                'edit_item' => 'Modifier le projet',
            ),
            'public' => true,
            'has_archive' => true,
            'supports' => array('title', 'editor', 'thumbnail', 'excerpt'),
            'menu_icon' => 'dashicons-portfolio',
            'rewrite' => array('slug' => 'portfolio'),
        )
    );
}
add_action('init', 'create_custom_post_type');`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["functions.php", "post-type", "custom"],
    folder: "WordPress",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "14",
    title: "Add Custom Taxonomy",
    description: "Crée une taxonomie personnalisée pour organiser le contenu",
    code: `<?php
function create_custom_taxonomy() {
    register_taxonomy('project_category',
        array('portfolio'),
        array(
            'labels' => array(
                'name' => 'Catégories de projets',
                'singular_name' => 'Catégorie',
                'search_items' => 'Rechercher des catégories',
                'all_items' => 'Toutes les catégories',
                'edit_item' => 'Modifier la catégorie',
                'update_item' => 'Mettre à jour',
                'add_new_item' => 'Ajouter une catégorie',
            ),
            'hierarchical' => true,
            'show_ui' => true,
            'show_admin_column' => true,
            'query_var' => true,
            'rewrite' => array('slug' => 'categorie-projet'),
        )
    );
}
add_action('init', 'create_custom_taxonomy');`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["functions.php", "taxonomy", "custom"],
    folder: "WordPress",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "15",
    title: "Add Custom Meta Box",
    description: "Ajoute une meta box personnalisée dans l'éditeur de posts",
    code: `<?php
// Ajouter la meta box
function add_custom_meta_box() {
    add_meta_box(
        'custom_meta_box',
        'Informations personnalisées',
        'custom_meta_box_callback',
        'post',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'add_custom_meta_box');

// Callback pour afficher la meta box
function custom_meta_box_callback($post) {
    wp_nonce_field('save_custom_meta', 'custom_meta_nonce');
    $value = get_post_meta($post->ID, '_custom_field', true);
    echo '<label for="custom_field">Valeur personnalisée:</label>';
    echo '<input type="text" id="custom_field" name="custom_field" value="' . esc_attr($value) . '" />';
}

// Sauvegarder les données
function save_custom_meta($post_id) {
    if (!isset($_POST['custom_meta_nonce']) || !wp_verify_nonce($_POST['custom_meta_nonce'], 'save_custom_meta')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (isset($_POST['custom_field'])) {
        update_post_meta($post_id, '_custom_field', sanitize_text_field($_POST['custom_field']));
    }
}
add_action('save_post', 'save_custom_meta');`,
    language: "php",
    scope: "admin",
    priority: 10,
    tags: ["meta-box", "admin", "custom"],
    folder: "WordPress",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "16",
    title: "Custom Login Logo",
    description: "Remplace le logo WordPress sur la page de connexion",
    code: `<?php
function custom_login_logo() {
    echo '<style type="text/css">
        #login h1 a, .login h1 a {
            background-image: url(' . get_stylesheet_directory_uri() . '/images/logo.png);
            height: 80px;
            width: 300px;
            background-size: contain;
            background-repeat: no-repeat;
            padding-bottom: 20px;
        }
    </style>';
}
add_action('login_enqueue_scripts', 'custom_login_logo');

// Changer l'URL du logo
function custom_login_logo_url() {
    return home_url();
}
add_filter('login_headerurl', 'custom_login_logo_url');

// Changer le titre du logo
function custom_login_logo_url_title() {
    return get_bloginfo('name');
}
add_filter('login_headertitle', 'custom_login_logo_url_title');`,
    language: "php",
    scope: "admin",
    priority: 10,
    tags: ["admin", "login", "customization"],
    folder: "Admin",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "17",
    title: "Remove Admin Bar for Non-Admins",
    description: "Masque la barre d'administration pour les utilisateurs non-administrateurs",
    code: `<?php
// Masquer la barre admin pour tous sauf les admins
add_action('after_setup_theme', 'remove_admin_bar');
function remove_admin_bar() {
    if (!current_user_can('administrator') && !is_admin()) {
        show_admin_bar(false);
    }
}`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["admin", "hooks"],
    folder: "Admin",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "18",
    title: "Add Custom Dashboard Widget",
    description: "Ajoute un widget personnalisé au tableau de bord WordPress",
    code: `<?php
// Ajouter le widget
function add_custom_dashboard_widget() {
    wp_add_dashboard_widget(
        'custom_dashboard_widget',
        'Widget personnalisé',
        'custom_dashboard_widget_content'
    );
}
add_action('wp_dashboard_setup', 'add_custom_dashboard_widget');

// Contenu du widget
function custom_dashboard_widget_content() {
    echo '<p>Bienvenue sur votre tableau de bord personnalisé!</p>';
    echo '<p>Vous pouvez ajouter ici toutes les informations utiles.</p>';
}`,
    language: "php",
    scope: "admin",
    priority: 10,
    tags: ["admin", "dashboard", "widget"],
    folder: "Admin",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "19",
    title: "WooCommerce - Change Add to Cart Text",
    description: "Modifie le texte du bouton 'Ajouter au panier' dans WooCommerce",
    code: `<?php
// Changer le texte du bouton "Ajouter au panier"
add_filter('woocommerce_product_add_to_cart_text', function($text) {
    return 'Acheter maintenant';
});

// Changer le texte sur la page produit
add_filter('woocommerce_product_single_add_to_cart_text', function($text) {
    return 'Ajouter au panier';
});`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["woocommerce", "filters", "buttons"],
    folder: "WooCommerce",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "20",
    title: "WooCommerce - Remove Related Products",
    description: "Supprime les produits associés sur les pages produit",
    code: `<?php
// Supprimer les produits associés
remove_action('woocommerce_after_single_product_summary', 'woocommerce_output_related_products', 20);`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["woocommerce", "hooks"],
    folder: "WooCommerce",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "21",
    title: "WooCommerce - Custom Thank You Page",
    description: "Personnalise la page de remerciement après commande",
    code: `<?php
add_action('woocommerce_thankyou', 'custom_thankyou_message', 10, 1);
function custom_thankyou_message($order_id) {
    if (!$order_id) {
        return;
    }
    
    $order = wc_get_order($order_id);
    echo '<div class="custom-thankyou-message">';
    echo '<h2>Merci pour votre commande!</h2>';
    echo '<p>Votre commande #' . $order->get_order_number() . ' a été reçue.</p>';
    echo '<p>Vous recevrez un email de confirmation sous peu.</p>';
    echo '</div>';
}`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["woocommerce", "hooks", "thank-you"],
    folder: "WooCommerce",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "22",
    title: "Add Schema.org JSON-LD",
    description: "Ajoute des données structurées Schema.org pour améliorer le SEO",
    code: `<?php
function add_schema_markup() {
    if (is_single()) {
        global $post;
        $schema = array(
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => get_the_title(),
            'description' => get_the_excerpt(),
            'author' => array(
                '@type' => 'Person',
                'name' => get_the_author()
            ),
            'datePublished' => get_the_date('c'),
            'dateModified' => get_the_modified_date('c'),
        );
        
        if (has_post_thumbnail()) {
            $schema['image'] = get_the_post_thumbnail_url($post->ID, 'full');
        }
        
        echo '<script type="application/ld+json">' . json_encode($schema) . '</script>';
    }
}
add_action('wp_head', 'add_schema_markup');`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["seo", "schema", "json-ld"],
    folder: "SEO",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "23",
    title: "Add Custom Meta Description",
    description: "Ajoute une meta description personnalisée pour chaque post",
    code: `<?php
function add_custom_meta_description() {
    if (is_single() || is_page()) {
        global $post;
        $description = get_post_meta($post->ID, '_custom_meta_description', true);
        
        if (empty($description)) {
            $description = wp_trim_words(get_the_excerpt(), 20);
        }
        
        if (!empty($description)) {
            echo '<meta name="description" content="' . esc_attr($description) . '" />' . "\n";
        }
    }
}
add_action('wp_head', 'add_custom_meta_description');`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["seo", "meta", "description"],
    folder: "SEO",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "24",
    title: "Disable Comments Globally",
    description: "Désactive les commentaires sur tout le site WordPress",
    code: `<?php
// Désactiver les commentaires pour les nouveaux posts
add_filter('comments_open', '__return_false', 20, 2);
add_filter('pings_open', '__return_false', 20, 2);

// Masquer les commentaires existants
add_filter('comments_array', '__return_empty_array', 10, 2);

// Désactiver dans l'admin
add_action('admin_init', function() {
    $post_types = get_post_types();
    foreach ($post_types as $post_type) {
        if (post_type_supports($post_type, 'comments')) {
            remove_post_type_support($post_type, 'comments');
            remove_post_type_support($post_type, 'trackbacks');
        }
    }
});

// Masquer le menu Commentaires
add_action('admin_menu', function() {
    remove_menu_page('edit-comments.php');
});`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["comments", "admin", "hooks"],
    folder: "WordPress",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "25",
    title: "Add Custom Shortcode",
    description: "Crée un shortcode personnalisé pour afficher du contenu dynamique",
    code: `<?php
function custom_shortcode($atts) {
    $atts = shortcode_atts(array(
        'text' => 'Hello World',
        'color' => 'blue',
    ), $atts);
    
    return '<span style="color: ' . esc_attr($atts['color']) . ';">' . esc_html($atts['text']) . '</span>';
}
add_shortcode('custom', 'custom_shortcode');

// Usage: [custom text="Mon texte" color="red"]`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["shortcode", "custom"],
    folder: "WordPress",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "26",
    title: "Add Custom Widget Area",
    description: "Crée une nouvelle zone de widgets personnalisée",
    code: `<?php
function register_custom_widget_area() {
    register_sidebar(array(
        'name' => 'Zone personnalisée',
        'id' => 'custom-widget-area',
        'description' => 'Zone de widgets personnalisée',
        'before_widget' => '<div class="widget %2$s">',
        'after_widget' => '</div>',
        'before_title' => '<h3 class="widget-title">',
        'after_title' => '</h3>',
    ));
}
add_action('widgets_init', 'register_custom_widget_area');

// Afficher dans le thème: dynamic_sidebar('custom-widget-area');`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["widget", "sidebar"],
    folder: "WordPress",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "27",
    title: "Custom User Registration Fields",
    description: "Ajoute des champs personnalisés au formulaire d'inscription",
    code: `<?php
// Ajouter les champs au formulaire
function add_registration_fields() {
    ?>
    <p>
        <label for="phone">Téléphone</label>
        <input type="text" name="phone" id="phone" class="input" />
    </p>
    <?php
}
add_action('register_form', 'add_registration_fields');

// Valider les champs
function validate_registration_fields($errors, $sanitized_user_login, $user_email) {
    if (empty($_POST['phone'])) {
        $errors->add('phone_error', 'Le numéro de téléphone est requis.');
    }
    return $errors;
}
add_filter('registration_errors', 'validate_registration_fields', 10, 3);

// Sauvegarder les champs
function save_registration_fields($user_id) {
    if (isset($_POST['phone'])) {
        update_user_meta($user_id, 'phone', sanitize_text_field($_POST['phone']));
    }
}
add_action('user_register', 'save_registration_fields');`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["user", "registration", "custom-fields"],
    folder: "WordPress",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "28",
    title: "AJAX Form Submission",
    description: "Soumet un formulaire via AJAX sans rechargement de page",
    code: `<?php
// Enqueue le script AJAX
function enqueue_ajax_script() {
    wp_enqueue_script('custom-ajax', get_template_directory_uri() . '/js/ajax.js', array('jquery'), '1.0', true);
    wp_localize_script('custom-ajax', 'ajax_object', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('ajax-nonce')
    ));
}
add_action('wp_enqueue_scripts', 'enqueue_ajax_script');

// Traiter la requête AJAX
function handle_ajax_submission() {
    check_ajax_referer('ajax-nonce', 'nonce');
    
    $name = sanitize_text_field($_POST['name']);
    $email = sanitize_email($_POST['email']);
    
    // Traiter les données
    // ...
    
    wp_send_json_success(array('message' => 'Formulaire soumis avec succès!'));
}
add_action('wp_ajax_submit_form', 'handle_ajax_submission');
add_action('wp_ajax_nopriv_submit_form', 'handle_ajax_submission');`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["ajax", "forms", "javascript"],
    folder: "API",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "29",
    title: "REST API Custom Endpoint",
    description: "Crée un endpoint personnalisé pour l'API REST WordPress",
    code: `<?php
// Ajouter un endpoint personnalisé
function register_custom_rest_route() {
    register_rest_route('custom/v1', '/data', array(
        'methods' => 'GET',
        'callback' => 'get_custom_data',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'register_custom_rest_route');

// Callback pour retourner les données
function get_custom_data($request) {
    $data = array(
        'message' => 'Hello from REST API',
        'timestamp' => current_time('mysql'),
    );
    return new WP_REST_Response($data, 200);
}

// Usage: /wp-json/custom/v1/data`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["rest-api", "api", "endpoint"],
    folder: "API",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "30",
    title: "Custom Database Query",
    description: "Exécute une requête personnalisée sur la base de données WordPress",
    code: `<?php
function get_custom_posts() {
    global $wpdb;
    
    $results = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT * FROM {$wpdb->posts} 
            WHERE post_type = %s 
            AND post_status = %s 
            ORDER BY post_date DESC 
            LIMIT %d",
            'post',
            'publish',
            10
        )
    );
    
    return $results;
}

// Utilisation
$posts = get_custom_posts();
foreach ($posts as $post) {
    echo $post->post_title;
}`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["database", "sql", "query"],
    folder: "Database",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "31",
    title: "Add Image Sizes",
    description: "Ajoute des tailles d'images personnalisées pour le thème",
    code: `<?php
// Ajouter des tailles d'images personnalisées
add_image_size('custom-thumbnail', 300, 300, true);
add_image_size('custom-medium', 600, 400, true);
add_image_size('custom-large', 1200, 800, true);

// Utiliser dans le thème: the_post_thumbnail('custom-thumbnail');`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["images", "media", "thumbnails"],
    folder: "WordPress",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "32",
    title: "Redirect 404 to Homepage",
    description: "Redirige les pages 404 vers la page d'accueil",
    code: `<?php
function redirect_404_to_homepage() {
    if (is_404()) {
        wp_redirect(home_url(), 301);
        exit;
    }
}
add_action('template_redirect', 'redirect_404_to_homepage');`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["redirect", "404", "hooks"],
    folder: "Utilities",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "33",
    title: "Add Custom Body Classes",
    description: "Ajoute des classes CSS personnalisées à la balise body",
    code: `<?php
function add_custom_body_classes($classes) {
    if (is_single()) {
        $classes[] = 'single-post';
    }
    if (is_page()) {
        $classes[] = 'custom-page';
    }
    if (is_user_logged_in()) {
        $classes[] = 'logged-in';
    }
    return $classes;
}
add_filter('body_class', 'add_custom_body_classes');`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["css", "body-class", "filters"],
    folder: "Utilities",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "34",
    title: "Custom Login Redirect",
    description: "Redirige les utilisateurs vers une page spécifique après connexion",
    code: `<?php
function custom_login_redirect($redirect_to, $request, $user) {
    if (isset($user->roles) && is_array($user->roles)) {
        if (in_array('administrator', $user->roles)) {
            return admin_url();
        } else {
            return home_url('/mon-compte');
        }
    }
    return $redirect_to;
}
add_filter('login_redirect', 'custom_login_redirect', 10, 3);`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["login", "redirect", "filters"],
    folder: "Utilities",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "35",
    title: "Remove Default Image Link",
    description: "Supprime le lien par défaut sur les images dans l'éditeur",
    code: `<?php
function remove_image_link() {
    $image_set = get_option('image_default_link_type');
    if ($image_set !== 'none') {
        update_option('image_default_link_type', 'none');
    }
}
add_action('admin_init', 'remove_image_link', 10);`,
    language: "php",
    scope: "admin",
    priority: 10,
    tags: ["images", "admin", "media"],
    folder: "Utilities",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "36",
    title: "Custom CSS in Admin",
    description: "Ajoute du CSS personnalisé dans l'administration WordPress",
    code: `<?php
function add_admin_custom_css() {
    echo '<style>
        #adminmenu .wp-menu-image img {
            width: 20px;
            height: 20px;
        }
        .postbox {
            border-radius: 8px;
        }
    </style>';
}
add_action('admin_head', 'add_admin_custom_css');`,
    language: "php",
    scope: "admin",
    priority: 10,
    tags: ["admin", "css", "customization"],
    folder: "Admin",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "37",
    title: "Change Media Upload Directory",
    description: "Modifie le répertoire d'upload des médias",
    code: `<?php
function custom_upload_directory($dirs) {
    $dirs['subdir'] = '/custom-uploads';
    $dirs['path'] = $dirs['basedir'] . '/custom-uploads';
    $dirs['url'] = $dirs['baseurl'] . '/custom-uploads';
    return $dirs;
}
add_filter('upload_dir', 'custom_upload_directory');`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["media", "upload", "filters"],
    folder: "Utilities",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "38",
    title: "Add Custom Menu Location",
    description: "Enregistre un nouvel emplacement de menu personnalisé",
    code: `<?php
function register_custom_menu() {
    register_nav_menus(array(
        'footer-menu' => 'Menu Footer',
        'social-menu' => 'Menu Réseaux Sociaux',
    ));
}
add_action('init', 'register_custom_menu');

// Afficher dans le thème: wp_nav_menu(array('theme_location' => 'footer-menu'));`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["menu", "navigation"],
    folder: "WordPress",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "39",
    title: "WooCommerce - Hide Price for Guests",
    description: "Masque les prix pour les visiteurs non connectés",
    code: `<?php
function hide_price_for_guests() {
    if (!is_user_logged_in()) {
        remove_action('woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_price', 10);
        remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_price', 10);
        add_action('woocommerce_single_product_summary', 'replace_price_with_login', 10);
    }
}
add_action('template_redirect', 'hide_price_for_guests');

function replace_price_with_login() {
    echo '<p><a href="' . wp_login_url(get_permalink()) . '">Connectez-vous pour voir les prix</a></p>';
}`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["woocommerce", "pricing", "login"],
    folder: "WooCommerce",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "40",
    title: "WooCommerce - Add Custom Field to Product",
    description: "Ajoute un champ personnalisé aux produits WooCommerce",
    code: `<?php
// Ajouter le champ dans l'admin
function add_custom_product_field() {
    woocommerce_wp_text_input(array(
        'id' => '_custom_field',
        'label' => 'Champ personnalisé',
        'placeholder' => 'Entrez une valeur',
        'desc_tip' => 'true',
        'description' => 'Description du champ personnalisé',
    ));
}
add_action('woocommerce_product_options_general_product_data', 'add_custom_product_field');

// Sauvegarder le champ
function save_custom_product_field($post_id) {
    $custom_field = $_POST['_custom_field'];
    if (!empty($custom_field)) {
        update_post_meta($post_id, '_custom_field', esc_attr($custom_field));
    }
}
add_action('woocommerce_process_product_meta', 'save_custom_product_field');

// Afficher sur la page produit
function display_custom_field() {
    global $product;
    $custom_field = get_post_meta($product->get_id(), '_custom_field', true);
    if ($custom_field) {
        echo '<p class="custom-field">' . esc_html($custom_field) . '</p>';
    }
}
add_action('woocommerce_single_product_summary', 'display_custom_field', 25);`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["woocommerce", "custom-fields", "products"],
    folder: "WooCommerce",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ========== SÉCURITÉ ==========
  {
    id: "41",
    title: "Protection contre les injections SQL",
    description: "Utilise prepare() pour sécuriser toutes les requêtes SQL",
    code: `<?php
// Toujours utiliser $wpdb->prepare() pour les requêtes SQL
function get_user_posts($user_id) {
    global $wpdb;
    
    // ❌ MAUVAIS - Vulnérable aux injections SQL
    // $wpdb->query("SELECT * FROM {$wpdb->posts} WHERE post_author = $user_id");
    
    // ✅ BON - Protégé contre les injections
    $results = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT * FROM {$wpdb->posts} WHERE post_author = %d AND post_status = %s",
            $user_id,
            'publish'
        )
    );
    
    return $results;
}`,
    language: "php",
    scope: "global",
    priority: 1,
    tags: ["security", "database", "sql"],
    folder: "Sécurité",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "42",
    title: "Sanitization des données utilisateur",
    description: "Sanitize toutes les données entrantes pour prévenir les attaques XSS",
    code: `<?php
// Sanitization des différents types de données
function handle_form_submission() {
    // Texte simple
    $name = sanitize_text_field($_POST['name']);
    
    // Email
    $email = sanitize_email($_POST['email']);
    
    // URL
    $website = esc_url_raw($_POST['website']);
    
    // Texte avec HTML autorisé
    $description = wp_kses_post($_POST['description']);
    
    // Nombre entier
    $age = absint($_POST['age']);
    
    // Nombre décimal
    $price = floatval($_POST['price']);
    
    // Sauvegarder en base de données
    update_user_meta(get_current_user_id(), 'user_name', $name);
    update_user_meta(get_current_user_id(), 'user_email', $email);
}

// Afficher des données (toujours échapper)
function display_user_data($data) {
    echo esc_html($data); // Pour texte simple
    echo esc_url($data);  // Pour URLs
    echo esc_attr($data); // Pour attributs HTML
}`,
    language: "php",
    scope: "global",
    priority: 1,
    tags: ["security", "sanitization", "xss"],
    folder: "Sécurité",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "43",
    title: "Protection CSRF avec nonces",
    description: "Implémente la protection CSRF avec les nonces WordPress",
    code: `<?php
// Créer un nonce pour un formulaire
function render_form_with_nonce() {
    wp_nonce_field('my_action', 'my_nonce_field');
    ?>
    <form method="post">
        <input type="text" name="data" />
        <input type="submit" value="Envoyer" />
    </form>
    <?php
}

// Vérifier le nonce lors de la soumission
function process_form_submission() {
    // Vérifier le nonce
    if (!isset($_POST['my_nonce_field']) || !wp_verify_nonce($_POST['my_nonce_field'], 'my_action')) {
        wp_die('Erreur de sécurité. Veuillez réessayer.');
    }
    
    // Vérifier les permissions
    if (!current_user_can('edit_posts')) {
        wp_die('Permissions insuffisantes.');
    }
    
    // Traiter les données
    $data = sanitize_text_field($_POST['data']);
    // ... traitement ...
}

add_action('admin_post_my_action', 'process_form_submission');

// Pour AJAX
function ajax_handler_with_nonce() {
    check_ajax_referer('ajax-nonce', 'nonce');
    
    // Traiter la requête AJAX
    wp_send_json_success(array('message' => 'Succès'));
}
add_action('wp_ajax_my_action', 'ajax_handler_with_nonce');`,
    language: "php",
    scope: "global",
    priority: 1,
    tags: ["security", "csrf", "nonce"],
    folder: "Sécurité",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "44",
    title: "Désactiver l'énumération des utilisateurs",
    description: "Empêche l'énumération des utilisateurs WordPress via ?author=1",
    code: `<?php
// Bloquer l'énumération des utilisateurs
add_filter('rest_endpoints', function($endpoints) {
    if (isset($endpoints['/wp/v2/users'])) {
        unset($endpoints['/wp/v2/users']);
    }
    if (isset($endpoints['/wp/v2/users/(?P<id>[\d]+)'])) {
        unset($endpoints['/wp/v2/users/(?P<id>[\d]+)']);
    }
    return $endpoints;
});

// Bloquer l'accès via ?author=1
add_action('template_redirect', function() {
    if (is_author()) {
        global $wp_query;
        if (isset($wp_query->query_vars['author'])) {
            wp_redirect(home_url(), 301);
            exit;
        }
    }
});

// Masquer les noms d'utilisateurs dans les URLs
add_filter('author_rewrite_rules', '__return_empty_array');`,
    language: "php",
    scope: "global",
    priority: 1,
    tags: ["security", "users", "enumeration"],
    folder: "Sécurité",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ========== OPTIMISATION ==========
  {
    id: "45",
    title: "Lazy loading des images",
    description: "Active le lazy loading natif WordPress pour améliorer les performances",
    code: `<?php
// Activer le lazy loading natif WordPress (5.5+)
add_filter('wp_lazy_loading_enabled', '__return_true');

// Lazy loading personnalisé avec JavaScript
function add_lazy_loading_images() {
    ?>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });
        images.forEach(img => imageObserver.observe(img));
    });
    </script>
    <?php
}
add_action('wp_footer', 'add_lazy_loading_images');`,
    language: "php",
    scope: "frontend",
    priority: 5,
    tags: ["performance", "lazy-loading", "images"],
    folder: "Performance",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "46",
    title: "Optimiser les requêtes de base de données",
    description: "Réduit le nombre de requêtes SQL avec des optimisations",
    code: `<?php
// Désactiver les requêtes inutiles
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'rsd_link');

// Optimiser les requêtes de posts
function optimize_post_queries($query) {
    if (!is_admin() && $query->is_main_query()) {
        $query->set('no_found_rows', true);
        $query->set('update_post_meta_cache', false);
        $query->set('update_post_term_cache', false);
    }
}
add_action('pre_get_posts', 'optimize_post_queries');

// Utiliser transients pour mettre en cache
function get_cached_data($key, $callback, $expiration = 3600) {
    $data = get_transient($key);
    if (false === $data) {
        $data = $callback();
        set_transient($key, $data, $expiration);
    }
    return $data;
}`,
    language: "php",
    scope: "global",
    priority: 5,
    tags: ["performance", "database", "queries"],
    folder: "Performance",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "47",
    title: "Cache avec transients",
    description: "Utilise les transients WordPress pour mettre en cache les données",
    code: `<?php
// Fonction helper pour le cache avec transients
function get_cached_data($key, $callback, $expiration = 3600, $group = 'default') {
    $cache_key = $group . '_' . $key;
    $data = get_transient($cache_key);
    
    if (false === $data) {
        $data = $callback();
        set_transient($cache_key, $data, $expiration);
    }
    
    return $data;
}

// Exemple : Cache des posts récents
function get_recent_posts_cached() {
    return get_cached_data('recent_posts', function() {
        return get_posts(array(
            'numberposts' => 10,
            'post_status' => 'publish',
        ));
    }, 1800); // Cache de 30 minutes
}`,
    language: "php",
    scope: "global",
    priority: 5,
    tags: ["performance", "cache", "transients"],
    folder: "Performance",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "48",
    title: "Désactiver les scripts inutiles",
    description: "Désactive les scripts WordPress non utilisés pour améliorer les performances",
    code: `<?php
// Désactiver les emojis
function disable_emojis_completely() {
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('admin_print_scripts', 'print_emoji_detection_script');
    remove_action('wp_print_styles', 'print_emoji_styles');
    remove_action('admin_print_styles', 'print_emoji_styles');
    remove_filter('the_content_feed', 'wp_staticize_emoji');
    remove_filter('comment_text_rss', 'wp_staticize_emoji');
    remove_filter('wp_mail', 'wp_staticize_emoji_for_email');
    add_filter('emoji_svg_url', '__return_false');
}
add_action('init', 'disable_emojis_completely');

// Désactiver les embeds
function disable_embeds() {
    wp_deregister_script('wp-embed');
    remove_action('wp_head', 'wp_oembed_add_discovery_links');
    remove_action('wp_head', 'wp_oembed_add_host_js');
}
add_action('init', 'disable_embeds', 9999);`,
    language: "php",
    scope: "frontend",
    priority: 5,
    tags: ["performance", "scripts", "optimization"],
    folder: "Performance",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ========== WOOCOMMERCE ==========
  {
    id: "49",
    title: "Personnaliser les emails de commande",
    description: "Modifie le contenu des emails WooCommerce",
    code: `<?php
// Personnaliser l'objet de l'email de commande
add_filter('woocommerce_email_subject_new_order', 'custom_new_order_email_subject', 10, 2);
function custom_new_order_email_subject($subject, $order) {
    return 'Nouvelle commande #' . $order->get_order_number();
}

// Personnaliser le contenu de l'email
add_filter('woocommerce_email_order_details', 'custom_email_order_details', 10, 4);
function custom_email_order_details($order, $sent_to_admin, $plain_text, $email) {
    echo '<p>Merci pour votre commande !</p>';
    echo '<p>Votre commande sera traitée dans les plus brefs délais.</p>';
}

// Ajouter du contenu personnalisé
add_action('woocommerce_email_order_details', 'add_custom_email_content', 20, 4);
function add_custom_email_content($order, $sent_to_admin, $plain_text, $email) {
    if ($email->id === 'customer_completed_order') {
        echo '<p>Nous espérons que vous serez satisfait de votre achat !</p>';
    }
}`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["woocommerce", "emails", "orders"],
    folder: "WooCommerce",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "50",
    title: "Ajouter des champs personnalisés au checkout",
    description: "Ajoute des champs supplémentaires au formulaire de commande",
    code: `<?php
// Ajouter un champ personnalisé au checkout
add_action('woocommerce_after_order_notes', 'add_custom_checkout_field');
function add_custom_checkout_field($checkout) {
    woocommerce_form_field('custom_field', array(
        'type' => 'text',
        'class' => array('form-row-wide'),
        'label' => 'Champ personnalisé',
        'placeholder' => 'Entrez votre information',
        'required' => true,
    ), $checkout->get_value('custom_field'));
}

// Valider le champ
add_action('woocommerce_checkout_process', 'validate_custom_checkout_field');
function validate_custom_checkout_field() {
    if (empty($_POST['custom_field'])) {
        wc_add_notice('Le champ personnalisé est requis.', 'error');
    }
}

// Sauvegarder le champ
add_action('woocommerce_checkout_update_order_meta', 'save_custom_checkout_field');
function save_custom_checkout_field($order_id) {
    if (!empty($_POST['custom_field'])) {
        update_post_meta($order_id, '_custom_field', sanitize_text_field($_POST['custom_field']));
    }
}`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["woocommerce", "checkout", "custom-fields"],
    folder: "WooCommerce",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "51",
    title: "Modifier les calculs de livraison",
    description: "Personnalise les méthodes et calculs de livraison WooCommerce",
    code: `<?php
// Ajouter une méthode de livraison personnalisée
add_action('woocommerce_shipping_init', 'custom_shipping_method_init');
function custom_shipping_method_init() {
    if (!class_exists('WC_Custom_Shipping_Method')) {
        class WC_Custom_Shipping_Method extends WC_Shipping_Method {
            public function __construct() {
                $this->id = 'custom_shipping';
                $this->method_title = 'Livraison personnalisée';
                $this->method_description = 'Description de votre méthode de livraison';
                $this->enabled = 'yes';
                $this->title = 'Livraison personnalisée';
                $this->init();
            }
            
            function init() {
                $this->init_form_fields();
                $this->init_settings();
                add_action('woocommerce_update_options_shipping_' . $this->id, array($this, 'process_admin_options'));
            }
            
            function calculate_shipping($package = array()) {
                $rate = array(
                    'id' => $this->id,
                    'label' => $this->title,
                    'cost' => 10.00, // Coût fixe
                    'calc_tax' => 'per_item'
                );
                $this->add_rate($rate);
            }
        }
    }
}
add_action('woocommerce_shipping_methods', 'add_custom_shipping_method');
function add_custom_shipping_method($methods) {
    $methods['custom_shipping'] = 'WC_Custom_Shipping_Method';
    return $methods;
}`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["woocommerce", "shipping", "delivery"],
    folder: "WooCommerce",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "52",
    title: "Personnaliser les pages produit",
    description: "Modifie l'affichage des pages produit WooCommerce",
    code: `<?php
// Réorganiser les éléments de la page produit
remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_title', 5);
add_action('woocommerce_single_product_summary', 'woocommerce_template_single_title', 3);

// Ajouter du contenu après le résumé
add_action('woocommerce_single_product_summary', 'add_custom_content_after_summary', 25);
function add_custom_content_after_summary() {
    echo '<div class="custom-product-info">';
    echo '<p>Informations personnalisées sur le produit</p>';
    echo '</div>';
}

// Modifier les onglets produits
add_filter('woocommerce_product_tabs', 'custom_product_tabs');
function custom_product_tabs($tabs) {
    // Réorganiser les onglets
    $tabs['description']['priority'] = 5;
    $tabs['reviews']['priority'] = 15;
    
    // Ajouter un nouvel onglet
    $tabs['custom_tab'] = array(
        'title' => 'Onglet personnalisé',
        'priority' => 20,
        'callback' => 'custom_tab_content'
    );
    
    return $tabs;
}

function custom_tab_content() {
    echo '<p>Contenu de l\'onglet personnalisé</p>';
}`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["woocommerce", "products", "tabs"],
    folder: "WooCommerce",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ========== STYLE/CSS ==========
  {
    id: "53",
    title: "CSS personnalisé dans l'admin",
    description: "Ajoute du CSS personnalisé dans l'administration WordPress",
    code: `<?php
function add_admin_custom_css() {
    echo '<style>
        /* Personnaliser le menu admin */
        #adminmenu .wp-menu-image img {
            width: 20px;
            height: 20px;
        }
        
        /* Personnaliser les postbox */
        .postbox {
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Personnaliser les boutons */
        .button-primary {
            background: #0073aa;
            border-color: #005177;
        }
        
        /* Personnaliser les tableaux */
        .wp-list-table th {
            background: #f0f0f1;
        }
    </style>';
}
add_action('admin_head', 'add_admin_custom_css');`,
    language: "php",
    scope: "admin",
    priority: 10,
    tags: ["admin", "css", "customization"],
    folder: "Admin",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "54",
    title: "Personnaliser la page de connexion",
    description: "Modifie le style et le contenu de la page de connexion WordPress",
    code: `<?php
// Ajouter du CSS personnalisé à la page de connexion
function custom_login_styles() {
    echo '<style type="text/css">
        #login h1 a, .login h1 a {
            background-image: url(' . get_stylesheet_directory_uri() . '/images/logo.png);
            height: 80px;
            width: 300px;
            background-size: contain;
            background-repeat: no-repeat;
            padding-bottom: 20px;
        }
        .login form {
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .wp-core-ui .button-primary {
            background: #0073aa;
            border-color: #005177;
        }
    </style>';
}
add_action('login_enqueue_scripts', 'custom_login_styles');

// Changer l'URL du logo
add_filter('login_headerurl', function() {
    return home_url();
});

// Changer le titre du logo
add_filter('login_headertitle', function() {
    return get_bloginfo('name');
});`,
    language: "php",
    scope: "admin",
    priority: 10,
    tags: ["admin", "login", "customization"],
    folder: "Admin",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "55",
    title: "Styles conditionnels selon le contexte",
    description: "Ajoute du CSS conditionnel selon la page ou le contexte",
    code: `<?php
function add_conditional_styles() {
    // Styles pour la page d'accueil
    if (is_front_page()) {
        echo '<style>
            .home-hero {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 80px 0;
            }
        </style>';
    }
    
    // Styles pour les pages
    if (is_page()) {
        echo '<style>
            .page-content {
                max-width: 1200px;
                margin: 0 auto;
                padding: 40px 20px;
            }
        </style>';
    }
    
    // Styles pour les articles
    if (is_single()) {
        echo '<style>
            .single-post {
                max-width: 800px;
                margin: 0 auto;
            }
        </style>';
    }
    
    // Styles pour mobile
    echo '<style>
        @media (max-width: 768px) {
            .responsive-hide {
                display: none;
            }
        }
    </style>';
}
add_action('wp_head', 'add_conditional_styles');`,
    language: "php",
    scope: "frontend",
    priority: 10,
    tags: ["css", "responsive", "conditional"],
    folder: "Frontend",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "56",
    title: "Personnaliser l'éditeur Gutenberg",
    description: "Ajoute des styles personnalisés à l'éditeur Gutenberg",
    code: `<?php
// Ajouter des styles à l'éditeur Gutenberg
function add_gutenberg_styles() {
    wp_enqueue_style(
        'custom-gutenberg-styles',
        get_stylesheet_directory_uri() . '/editor-styles.css',
        array('wp-edit-blocks'),
        '1.0.0'
    );
}
add_action('enqueue_block_editor_assets', 'add_gutenberg_styles');

// Ajouter des couleurs personnalisées
function add_custom_colors() {
    add_theme_support('editor-color-palette', array(
        array(
            'name' => 'Bleu',
            'slug' => 'blue',
            'color' => '#0073aa',
        ),
        array(
            'name' => 'Rouge',
            'slug' => 'red',
            'color' => '#dc3232',
        ),
    ));
}
add_action('after_setup_theme', 'add_custom_colors');

// Ajouter des tailles de police personnalisées
function add_custom_font_sizes() {
    add_theme_support('editor-font-sizes', array(
        array(
            'name' => 'Petit',
            'size' => 14,
            'slug' => 'small',
        ),
        array(
            'name' => 'Grand',
            'size' => 24,
            'slug' => 'large',
        ),
    ));
}
add_action('after_setup_theme', 'add_custom_font_sizes');`,
    language: "php",
    scope: "admin",
    priority: 10,
    tags: ["gutenberg", "editor", "customization"],
    folder: "Admin",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ========== WORDPRESS AVANCÉ ==========
  {
    id: "57",
    title: "Gestion des rôles et capacités",
    description: "Crée et modifie les rôles et capacités WordPress",
    code: `<?php
// Créer un nouveau rôle
function create_custom_role() {
    add_role(
        'custom_editor',
        'Éditeur personnalisé',
        array(
            'read' => true,
            'edit_posts' => true,
            'edit_published_posts' => true,
            'publish_posts' => true,
            'delete_posts' => true,
            'upload_files' => true,
        )
    );
}
add_action('init', 'create_custom_role');

// Ajouter une capacité à un rôle existant
function add_custom_capability() {
    $role = get_role('editor');
    $role->add_cap('edit_theme_options');
}

// Supprimer une capacité
function remove_capability() {
    $role = get_role('author');
    $role->remove_cap('publish_posts');
}

// Vérifier les capacités
function check_user_capability() {
    if (current_user_can('edit_posts')) {
        // L'utilisateur peut éditer des posts
    }
}`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["roles", "capabilities", "permissions"],
    folder: "WordPress",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "58",
    title: "Personnalisation de l'API REST",
    description: "Crée des endpoints personnalisés pour l'API REST WordPress",
    code: `<?php
// Ajouter un endpoint personnalisé
function register_custom_rest_route() {
    register_rest_route('custom/v1', '/data', array(
        'methods' => 'GET',
        'callback' => 'get_custom_data',
        'permission_callback' => function() {
            return current_user_can('read');
        },
    ));
    
    register_rest_route('custom/v1', '/data', array(
        'methods' => 'POST',
        'callback' => 'create_custom_data',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        },
    ));
}
add_action('rest_api_init', 'register_custom_rest_route');

// Callback pour GET
function get_custom_data($request) {
    $data = array(
        'message' => 'Hello from REST API',
        'timestamp' => current_time('mysql'),
        'user_id' => get_current_user_id(),
    );
    return new WP_REST_Response($data, 200);
}

// Callback pour POST
function create_custom_data($request) {
    $params = $request->get_json_params();
    // Traiter les données
    return new WP_REST_Response(array('success' => true), 201);
}

// Usage: /wp-json/custom/v1/data`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["rest-api", "api", "endpoint"],
    folder: "API",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "59",
    title: "Cron jobs personnalisés",
    description: "Crée et gère des tâches cron personnalisées",
    code: `<?php
// Planifier un événement cron
function schedule_custom_cron() {
    if (!wp_next_scheduled('my_custom_cron_event')) {
        wp_schedule_event(time(), 'hourly', 'my_custom_cron_event');
    }
}
add_action('wp', 'schedule_custom_cron');

// Exécuter la tâche cron
add_action('my_custom_cron_event', 'do_custom_cron_task');
function do_custom_cron_task() {
    // Tâche à exécuter
    error_log('Tâche cron exécutée : ' . date('Y-m-d H:i:s'));
    
    // Exemple : Nettoyer les transients expirés
    global $wpdb;
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_%' AND option_value < UNIX_TIMESTAMP()");
}

// Ajouter un intervalle personnalisé
add_filter('cron_schedules', 'add_custom_cron_interval');
function add_custom_cron_interval($schedules) {
    $schedules['every_5_minutes'] = array(
        'interval' => 300,
        'display' => 'Toutes les 5 minutes'
    );
    return $schedules;
}

// Désactiver un événement cron
function unschedule_custom_cron() {
    $timestamp = wp_next_scheduled('my_custom_cron_event');
    if ($timestamp) {
        wp_unschedule_event($timestamp, 'my_custom_cron_event');
    }
}`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["cron", "scheduled-tasks", "automation"],
    folder: "WordPress",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "60",
    title: "Hooks personnalisés",
    description: "Crée et utilise des hooks personnalisés (actions et filtres)",
    code: `<?php
// Créer une action personnalisée
function trigger_custom_action() {
    do_action('my_custom_action', get_current_user_id(), 'data');
}
add_action('wp_footer', 'trigger_custom_action');

// Écouter l'action personnalisée
add_action('my_custom_action', 'handle_custom_action', 10, 2);
function handle_custom_action($user_id, $data) {
    error_log("Action personnalisée déclenchée pour l'utilisateur : " . $user_id);
}

// Créer un filtre personnalisé
function apply_custom_filter($content) {
    $content = apply_filters('my_custom_filter', $content, get_the_ID());
    return $content;
}
add_filter('the_content', 'apply_custom_filter');

// Modifier via le filtre personnalisé
add_filter('my_custom_filter', 'modify_content', 10, 2);
function modify_content($content, $post_id) {
    if (is_single()) {
        $content = '<div class="custom-wrapper">' . $content . '</div>';
    }
    return $content;
}

// Exemple d'utilisation dans un thème
// do_action('before_post_content');
// apply_filters('post_content_class', 'default-class');`,
    language: "php",
    scope: "global",
    priority: 10,
    tags: ["hooks", "actions", "filters"],
    folder: "WordPress",
    active: true,
    runOnce: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
