export type ColorRole = 
  | "primary" 
  | "secondary" 
  | "accent" 
  | "background" 
  | "foreground" 
  | "muted" 
  | "border"
  | "destructive"
  | "success"
  | "warning"
  | "custom";

export type HarmonyType = 
  | "analogous" 
  | "complementary" 
  | "triadic" 
  | "tetradic" 
  | "split-complementary" 
  | "monochromatic"
  | "custom";

export interface ColorShade {
  shade: number; // 50, 100, 200, ..., 900, 950
  hex: string;
}

export interface PaletteColor {
  id: string;
  name: string;
  hex: string;
  role: ColorRole;
  locked: boolean;
  shades: ColorShade[];
}

export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  harmony: HarmonyType;
  colors: PaletteColor[];
  createdAt: string;
  updatedAt: string;
}

export type ExportFormat = "css" | "tailwind" | "scss" | "json";

export interface ContrastResult {
  ratio: number;
  aa: boolean;
  aaLarge: boolean;
  aaa: boolean;
  aaaLarge: boolean;
}

export const roleLabels: Record<ColorRole, string> = {
  primary: "Principal",
  secondary: "Secondaire",
  accent: "Accent",
  background: "Fond",
  foreground: "Texte",
  muted: "Atténué",
  border: "Bordure",
  destructive: "Danger",
  success: "Succès",
  warning: "Alerte",
  custom: "Personnalisé",
};

export const harmonyLabels: Record<HarmonyType, string> = {
  analogous: "Analogues",
  complementary: "Complémentaires",
  triadic: "Triadiques",
  tetradic: "Tétradiques",
  "split-complementary": "Complémentaires divisés",
  monochromatic: "Monochromatiques",
  custom: "Personnalisé",
};

export const shadeSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export const roleColors: Record<ColorRole, string> = {
  primary: "bg-primary/20 text-primary border-primary/30",
  secondary: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  accent: "bg-accent/20 text-accent-foreground border-accent/30",
  background: "bg-muted/20 text-foreground border-muted/30",
  foreground: "bg-foreground/10 text-foreground border-foreground/30",
  muted: "bg-muted/30 text-muted-foreground border-muted/30",
  border: "bg-border/20 text-foreground border-border",
  destructive: "bg-destructive/20 text-destructive border-destructive/30",
  success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  custom: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};
