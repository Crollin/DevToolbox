import { ImagePreset } from "@/types/image-resizer";

export const wordPressPresets: ImagePreset[] = [
  {
    id: "hero",
    name: "Hero",
    width: 1920,
    height: 1080,
    description: "Image hero pour en-tête de page (1920x1080)",
  },
  {
    id: "banner",
    name: "Banner / Open Graph",
    width: 1200,
    height: 630,
    description: "Banner pour réseaux sociaux et Open Graph (1200x630)",
  },
  {
    id: "container",
    name: "Container",
    width: 1200,
    height: 800,
    description: "Image pour conteneur de contenu (1200x800)",
  },
  {
    id: "thumbnail",
    name: "Thumbnail",
    width: 150,
    height: 150,
    description: "Miniature WordPress (150x150)",
  },
  {
    id: "medium",
    name: "Medium",
    width: 300,
    height: 300,
    description: "Taille moyenne WordPress (300x300)",
  },
  {
    id: "large",
    name: "Large",
    width: 1024,
    height: 1024,
    description: "Grande taille WordPress (1024x1024)",
  },
  {
    id: "full",
    name: "Full (Original)",
    width: 0,
    height: 0,
    description: "Conserver les dimensions originales",
  },
  {
    id: "custom",
    name: "Personnalisé",
    width: 0,
    height: 0,
    description: "Dimensions personnalisées",
  },
];

export const getPresetById = (id: string): ImagePreset | undefined => {
  return wordPressPresets.find((preset) => preset.id === id);
};

export const getPresetLabel = (id: string): string => {
  const preset = getPresetById(id);
  return preset ? `${preset.name} (${preset.width}x${preset.height})` : id;
};


