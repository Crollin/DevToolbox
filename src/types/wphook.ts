export type HookType = "action" | "filter";

export interface WPHook {
  id: string;
  name: string;
  type: HookType;
  description: string;
  category: string;
  tags: string[];
  example: string;
  parameters: string;
  since: string;
  deprecated?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export const defaultCategories = [
  "Core",
  "Themes",
  "Plugins",
  "Posts",
  "Users",
  "Media",
  "Database",
  "API",
  "Admin",
  "Frontend",
  "Security",
  "Performance",
];

export const hookTypeLabels: Record<HookType, string> = {
  action: "Action",
  filter: "Filter",
};

export const hookTypeColors: Record<HookType, { bg: string; text: string }> = {
  action: { bg: "bg-blue-500/20", text: "text-blue-400" },
  filter: { bg: "bg-purple-500/20", text: "text-purple-400" },
};

export const defaultHooks: Omit<WPHook, "id" | "createdAt" | "updatedAt">[] = [
  // Core Actions
  {
    name: "init",
    type: "action",
    description: "Déclenché après que WordPress ait fini de charger mais avant l'envoi des headers",
    category: "Core",
    tags: ["core", "initialization", "early"],
    example: "add_action('init', 'my_custom_function');",
    parameters: "Aucun paramètre",
    since: "1.0.0",
    isFavorite: true,
  },
  {
    name: "wp_loaded",
    type: "action",
    description: "Déclenché après que WordPress soit complètement chargé",
    category: "Core",
    tags: ["core", "loaded", "ready"],
    example: "add_action('wp_loaded', 'my_custom_function');",
    parameters: "Aucun paramètre",
    since: "2.0.0",
    isFavorite: true,
  },
  {
    name: "admin_init",
    type: "action",
    description: "Déclenché dans l'admin après l'authentification mais avant l'affichage",
    category: "Admin",
    tags: ["admin", "initialization"],
    example: "add_action('admin_init', 'my_admin_function');",
    parameters: "Aucun paramètre",
    since: "1.0.0",
    isFavorite: false,
  },
  // Core Filters
  {
    name: "the_content",
    type: "filter",
    description: "Filtre le contenu d'un article avant l'affichage",
    category: "Posts",
    tags: ["content", "posts", "display"],
    example: "add_filter('the_content', 'my_content_filter');",
    parameters: "$content (string) : Le contenu de l'article",
    since: "1.0.0",
    isFavorite: true,
  },
  {
    name: "the_title",
    type: "filter",
    description: "Filtre le titre d'un article avant l'affichage",
    category: "Posts",
    tags: ["title", "posts", "display"],
    example: "add_filter('the_title', 'my_title_filter', 10, 2);",
    parameters: "$title (string) : Le titre\n$post_id (int) : L'ID du post",
    since: "1.0.0",
    isFavorite: true,
  },
  {
    name: "excerpt_length",
    type: "filter",
    description: "Modifie la longueur de l'extrait d'article",
    category: "Posts",
    tags: ["excerpt", "posts", "length"],
    example: "add_filter('excerpt_length', function() { return 50; });",
    parameters: "$length (int) : La longueur par défaut (55)",
    since: "1.0.0",
    isFavorite: false,
  },
  // Theme Hooks
  {
    name: "wp_head",
    type: "action",
    description: "Déclenché dans la balise <head> du thème",
    category: "Themes",
    tags: ["theme", "head", "html"],
    example: "add_action('wp_head', 'my_head_content');",
    parameters: "Aucun paramètre",
    since: "1.0.0",
    isFavorite: true,
  },
  {
    name: "wp_footer",
    type: "action",
    description: "Déclenché juste avant la fermeture de la balise </body>",
    category: "Themes",
    tags: ["theme", "footer", "html"],
    example: "add_action('wp_footer', 'my_footer_script');",
    parameters: "Aucun paramètre",
    since: "1.0.0",
    isFavorite: true,
  },
  {
    name: "body_class",
    type: "filter",
    description: "Filtre les classes CSS de la balise <body>",
    category: "Themes",
    tags: ["theme", "body", "css", "classes"],
    example: "add_filter('body_class', 'my_body_classes');",
    parameters: "$classes (array) : Tableau des classes CSS",
    since: "2.8.0",
    isFavorite: false,
  },
  // Plugin Hooks
  {
    name: "plugins_loaded",
    type: "action",
    description: "Déclenché après le chargement de tous les plugins",
    category: "Plugins",
    tags: ["plugins", "loaded", "initialization"],
    example: "add_action('plugins_loaded', 'my_plugin_init');",
    parameters: "Aucun paramètre",
    since: "1.0.0",
    isFavorite: true,
  },
  {
    name: "activated_plugin",
    type: "action",
    description: "Déclenché lorsqu'un plugin est activé",
    category: "Plugins",
    tags: ["plugins", "activation"],
    example: "add_action('activated_plugin', 'my_activation_handler', 10, 2);",
    parameters: "$plugin (string) : Chemin du plugin\n$network_wide (bool) : Activation réseau",
    since: "2.0.0",
    isFavorite: false,
  },
  // User Hooks
  {
    name: "user_register",
    type: "action",
    description: "Déclenché après l'inscription d'un nouvel utilisateur",
    category: "Users",
    tags: ["users", "registration"],
    example: "add_action('user_register', 'my_user_registered', 10, 1);",
    parameters: "$user_id (int) : L'ID de l'utilisateur",
    since: "2.0.0",
    isFavorite: false,
  },
  {
    name: "login_redirect",
    type: "filter",
    description: "Filtre l'URL de redirection après connexion",
    category: "Users",
    tags: ["users", "login", "redirect"],
    example: "add_filter('login_redirect', 'my_login_redirect', 10, 3);",
    parameters: "$redirect_to (string) : URL de redirection\n$requested_redirect_to (string) : URL demandée\n$user (WP_User) : Objet utilisateur",
    since: "2.0.0",
    isFavorite: false,
  },
  // Security Hooks
  {
    name: "authenticate",
    type: "filter",
    description: "Filtre l'authentification d'un utilisateur",
    category: "Security",
    tags: ["security", "authentication", "login"],
    example: "add_filter('authenticate', 'my_auth_handler', 10, 3);",
    parameters: "$user (WP_User|WP_Error) : Utilisateur ou erreur\n$username (string) : Nom d'utilisateur\n$password (string) : Mot de passe",
    since: "2.0.0",
    isFavorite: false,
  },
  // API Hooks
  {
    name: "rest_api_init",
    type: "action",
    description: "Déclenché lors de l'initialisation de l'API REST",
    category: "API",
    tags: ["rest", "api", "endpoints"],
    example: "add_action('rest_api_init', 'register_my_rest_routes');",
    parameters: "$server (WP_REST_Server) : Instance du serveur REST",
    since: "4.4.0",
    isFavorite: true,
  },
];

