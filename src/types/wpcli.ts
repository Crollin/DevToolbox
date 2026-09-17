export type DifficultyLevel = "débutant" | "intermédiaire" | "avancé";

export interface WPCLIExample {
  title: string;
  code: string;
}

export interface WPCLICommand {
  id: string;
  command: string;
  description: string;
  example: string;
  examples: WPCLIExample[];
  options: string;
  notes: string;
  category: string;
  difficulty: DifficultyLevel;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WPCLICommandInput = Omit<WPCLICommand, "id" | "createdAt" | "updatedAt">;

export const defaultCategories = [
  "Core",
  "Plugins",
  "Themes",
  "Database",
  "Migrations",
  "Users",
  "Roles",
  "Posts",
  "Comments",
  "Terms",
  "Media",
  "Cache",
  "Config",
  "Maintenance",
  "Multisite",
  "Scaffold",
  "Package",
  "Eval",
  "Language",
  "Export",
  "WooCommerce",
];

export const difficultyColors: Record<DifficultyLevel, { bg: string; text: string }> = {
  débutant: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  intermédiaire: { bg: "bg-amber-500/20", text: "text-amber-400" },
  avancé: { bg: "bg-rose-500/20", text: "text-rose-400" },
};
