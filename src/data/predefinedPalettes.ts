import { ColorRole } from "@/types/palette";

export type PredefinedPaletteCategory = "Design System" | "Framework" | "Brand";

export interface PredefinedColor {
  name: string;
  hex: string;
  role: ColorRole;
}

export interface PredefinedPalette {
  id: string;
  name: string;
  description: string;
  category: PredefinedPaletteCategory;
  colors: PredefinedColor[];
}

export const predefinedPalettes: PredefinedPalette[] = [
  {
    id: "material-design-3",
    name: "Material Design 3",
    description: "Système de design de Google avec des couleurs vibrantes et accessibles",
    category: "Design System",
    colors: [
      { name: "Primary", hex: "#6750A4", role: "primary" },
      { name: "Secondary", hex: "#625B71", role: "secondary" },
      { name: "Tertiary", hex: "#7D5260", role: "accent" },
      { name: "Error", hex: "#BA1A1A", role: "destructive" },
      { name: "Surface", hex: "#FFFBFE", role: "background" },
      { name: "On Surface", hex: "#1C1B1F", role: "foreground" },
    ],
  },
  {
    id: "tailwind-css",
    name: "Tailwind CSS",
    description: "Palette de couleurs par défaut de Tailwind CSS",
    category: "Framework",
    colors: [
      { name: "Blue", hex: "#3B82F6", role: "primary" },
      { name: "Indigo", hex: "#6366F1", role: "secondary" },
      { name: "Purple", hex: "#8B5CF6", role: "accent" },
      { name: "Red", hex: "#EF4444", role: "destructive" },
      { name: "Green", hex: "#10B981", role: "success" },
      { name: "Yellow", hex: "#F59E0B", role: "warning" },
      { name: "Gray", hex: "#6B7280", role: "muted" },
    ],
  },
  {
    id: "ant-design",
    name: "Ant Design",
    description: "Système de design d'Ant Design avec des couleurs professionnelles",
    category: "Design System",
    colors: [
      { name: "Primary", hex: "#1890FF", role: "primary" },
      { name: "Success", hex: "#52C41A", role: "success" },
      { name: "Warning", hex: "#FAAD14", role: "warning" },
      { name: "Error", hex: "#F5222D", role: "destructive" },
      { name: "Info", hex: "#1890FF", role: "accent" },
      { name: "Neutral", hex: "#8C8C8C", role: "muted" },
    ],
  },
  {
    id: "chakra-ui",
    name: "Chakra UI",
    description: "Palette de couleurs de Chakra UI, simple et moderne",
    category: "Framework",
    colors: [
      { name: "Blue", hex: "#3182CE", role: "primary" },
      { name: "Cyan", hex: "#00B5D8", role: "accent" },
      { name: "Green", hex: "#38A169", role: "success" },
      { name: "Orange", hex: "#DD6B20", role: "warning" },
      { name: "Red", hex: "#E53E3E", role: "destructive" },
      { name: "Gray", hex: "#718096", role: "muted" },
    ],
  },
  {
    id: "shadcn-ui",
    name: "Shadcn/ui",
    description: "Palette utilisée par shadcn/ui, adaptée pour les interfaces modernes",
    category: "Framework",
    colors: [
      { name: "Primary", hex: "#0F172A", role: "primary" },
      { name: "Secondary", hex: "#64748B", role: "secondary" },
      { name: "Accent", hex: "#8B5CF6", role: "accent" },
      { name: "Destructive", hex: "#EF4444", role: "destructive" },
      { name: "Muted", hex: "#F1F5F9", role: "muted" },
      { name: "Border", hex: "#E2E8F0", role: "border" },
    ],
  },
  {
    id: "apple-hig",
    name: "Apple HIG",
    description: "Couleurs inspirées des Human Interface Guidelines d'Apple",
    category: "Design System",
    colors: [
      { name: "Blue", hex: "#007AFF", role: "primary" },
      { name: "Green", hex: "#34C759", role: "success" },
      { name: "Orange", hex: "#FF9500", role: "warning" },
      { name: "Red", hex: "#FF3B30", role: "destructive" },
      { name: "Purple", hex: "#AF52DE", role: "accent" },
      { name: "Gray", hex: "#8E8E93", role: "muted" },
    ],
  },
  {
    id: "github-primer",
    name: "GitHub Primer",
    description: "Système de design de GitHub, sobre et professionnel",
    category: "Design System",
    colors: [
      { name: "Blue", hex: "#0969DA", role: "primary" },
      { name: "Green", hex: "#1A7F37", role: "success" },
      { name: "Yellow", hex: "#9A6700", role: "warning" },
      { name: "Red", hex: "#CF222E", role: "destructive" },
      { name: "Purple", hex: "#8250DF", role: "accent" },
      { name: "Gray", hex: "#656D76", role: "muted" },
    ],
  },
  {
    id: "bootstrap",
    name: "Bootstrap",
    description: "Palette de couleurs classique de Bootstrap",
    category: "Framework",
    colors: [
      { name: "Primary", hex: "#0D6EFD", role: "primary" },
      { name: "Secondary", hex: "#6C757D", role: "secondary" },
      { name: "Success", hex: "#198754", role: "success" },
      { name: "Danger", hex: "#DC3545", role: "destructive" },
      { name: "Warning", hex: "#FFC107", role: "warning" },
      { name: "Info", hex: "#0DCAF0", role: "accent" },
    ],
  },
];

