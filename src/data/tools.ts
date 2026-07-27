export type ToolCategory = 
  | "scripts" 
  | "convertisseurs" 
  | "commandes" 
  | "utilitaires" 
  | "génération";

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  url?: string;
  tags: string[];
  color: string;
}

export const categoryLabels: Record<ToolCategory, string> = {
  scripts: "Scripts",
  convertisseurs: "Convertisseurs",
  commandes: "Commandes",
  utilitaires: "Utilitaires",
  génération: "Génération",
};

export const categoryColors: Record<ToolCategory, { bg: string; text: string; border: string }> = {
  scripts: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/30" },
  convertisseurs: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/30" },
  commandes: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  utilitaires: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  génération: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
};

export const tools: Tool[] = [
  {
    id: "knowledge-base",
    name: "Knowledge Base",
    description: "Base de connaissances personnelle (liens, notes Markdown, tags, recherche) avec capture via bookmarklet.",
    category: "utilitaires",
    icon: "BookMarked",
    url: "#",
    tags: ["kb", "notes", "liens", "tags", "recherche"],
    color: "amber",
  },
  {
    id: "wp-script-library",
    name: "WP Script Library",
    description: "Bibliothèque de scripts PHP/Shell pour WordPress avec catégorisation, tags et export.",
    category: "scripts",
    icon: "Code2",
    url: "#",
    tags: ["wordpress", "php", "shell", "scripts"],
    color: "primary",
  },
  {
    id: "licence-key-hub",
    name: "Licence Key Hub",
    description: "Gestionnaire centralisé de clés de licence pour tous vos projets et applications SaaS.",
    category: "utilitaires",
    icon: "Key",
    url: "#",
    tags: ["licence", "gestion", "saas"],
    color: "amber",
  },
  {
    id: "csv-preview-pro",
    name: "CSV Preview Pro",
    description: "Visualisation et manipulation avancée de fichiers CSV avec prévisualisation en temps réel.",
    category: "convertisseurs",
    icon: "FileSpreadsheet",
    url: "#",
    tags: ["csv", "data", "preview"],
    color: "accent",
  },
  {
    id: "wpcli-glossary",
    name: "WP-CLI Glossary",
    description: "Glossaire de commandes WP-CLI avec catégories, favoris et recherche rapide.",
    category: "commandes",
    icon: "Terminal",
    url: "#",
    tags: ["wordpress", "wp-cli", "commandes", "cli"],
    color: "emerald",
  },
  {
    id: "git-commander",
    name: "Git Commander",
    description: "Collection de commandes Git avancées avec explications et exemples d'utilisation.",
    category: "commandes",
    icon: "GitBranch",
    url: "#",
    tags: ["git", "versionning", "cli"],
    color: "emerald",
  },
  {
    id: "docker-commander",
    name: "Docker Commander",
    description: "Glossaire complet des commandes Docker avec exemples et bonnes pratiques.",
    category: "commandes",
    icon: "Container",
    url: "#",
    tags: ["docker", "containers", "devops", "cli"],
    color: "emerald",
  },
  {
    id: "color-palette-gen",
    name: "Color Palette Gen",
    description: "Générateur de palettes de couleurs harmonieuses pour vos projets web et design.",
    category: "génération",
    icon: "Palette",
    url: "#",
    tags: ["couleurs", "design", "palette"],
    color: "rose",
  },
  {
    id: "svg-icon-library",
    name: "SVG Icon Library",
    description: "Bibliothèque d'icônes SVG avec prévisualisation, édition et export en SVG/JSX.",
    category: "utilitaires",
    icon: "Shapes",
    url: "#",
    tags: ["svg", "icônes", "design", "jsx"],
    color: "amber",
  },
  {
    id: "code-snippet-library",
    name: "Code Snippet Library",
    description: "Bibliothèque de snippets de code avec import/export WPCodeBox compatible.",
    category: "scripts",
    icon: "Code2",
    url: "#",
    tags: ["snippets", "wpcodebox", "php", "javascript", "code"],
    color: "primary",
  },
  {
    id: "wp-hook-reference",
    name: "WP Hook Reference",
    description: "Référence complète des hooks WordPress (actions et filtres) avec recherche, catégories et exemples.",
    category: "utilitaires",
    icon: "Link",
    url: "#",
    tags: ["wordpress", "hooks", "actions", "filters", "reference"],
    color: "amber",
  },
  {
    id: "wp-query-builder",
    name: "WP Query Builder",
    description: "Constructeur visuel de requêtes WP_Query avec prévisualisation du code PHP généré.",
    category: "scripts",
    icon: "Database",
    url: "#",
    tags: ["wordpress", "wp_query", "database", "php", "query"],
    color: "primary",
  },
  {
    id: "markdown-editor",
    name: "Markdown Editor",
    description: "Éditeur Markdown avec aperçu temps réel et export.",
    category: "utilitaires",
    icon: "FileText",
    url: "#",
    tags: ["markdown", "éditeur", "texte", "preview"],
    color: "amber",
  },
  {
    id: "image-resizer",
    name: "Image Resizer",
    description: "Redimensionnement et optimisation d'images pour WordPress avec export WebP.",
    category: "utilitaires",
    icon: "Image",
    url: "#",
    tags: ["images", "wordpress", "webp", "optimisation", "redimensionnement"],
    color: "amber",
  },
  {
    id: "wp-config-generator",
    name: "WP Config Generator",
    description: "Génère des extraits wp-config.php (debug, Redis, multisite, préfixe tables).",
    category: "scripts",
    icon: "Settings",
    url: "#",
    tags: ["wordpress", "wp-config", "debug", "redis"],
    color: "primary",
  },
  {
    id: "plugin-header-builder",
    name: "Plugin Header Builder",
    description: "Formulaire pour générer l'en-tête de plugin conforme WordPress.org.",
    category: "génération",
    icon: "Package",
    url: "#",
    tags: ["wordpress", "plugin", "header", "génération"],
    color: "rose",
  },
  {
    id: "task-reminder",
    name: "Task Reminder",
    description: "Gestionnaire de tâches avec rappels par email. Créez des tâches, définissez des dates d'accomplissement et recevez des notifications automatiques.",
    category: "utilitaires",
    icon: "CheckSquare",
    url: "#",
    tags: ["tâches", "rappels", "email", "gestion", "productivité"],
    color: "amber",
  },
];
