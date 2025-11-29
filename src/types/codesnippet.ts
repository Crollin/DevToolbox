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
];
