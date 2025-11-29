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
];
