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
    id: "mon-calcul-energie",
    name: "Mon Calcul Énergie",
    description: "Calculateur de consommation énergétique et estimation des coûts pour vos projets.",
    category: "utilitaires",
    icon: "Zap",
    url: "#",
    tags: ["énergie", "calcul", "estimation"],
    color: "emerald",
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Formatage et validation de JSON avec coloration syntaxique et détection d'erreurs.",
    category: "convertisseurs",
    icon: "Braces",
    url: "#",
    tags: ["json", "format", "validation"],
    color: "primary",
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
    id: "regex-tester",
    name: "Regex Tester",
    description: "Testeur d'expressions régulières avec visualisation des correspondances en temps réel.",
    category: "scripts",
    icon: "Code2",
    url: "#",
    tags: ["regex", "test", "pattern"],
    color: "primary",
  },
  {
    id: "api-mock-server",
    name: "API Mock Server",
    description: "Serveur de mock API pour le développement et les tests frontend.",
    category: "scripts",
    icon: "Server",
    url: "#",
    tags: ["api", "mock", "dev"],
    color: "primary",
  },
];
