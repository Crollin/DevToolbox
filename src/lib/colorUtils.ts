import { ColorShade, ContrastResult, HarmonyType, shadeSteps } from "@/types/palette";

// Convert hex to HSL
export const hexToHsl = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

// Convert HSL to hex
export const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Generate random hex color
export const randomHex = (): string => {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
};

// Get contrast color for text
export const getContrastColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

// Convert hex to RGB string
export const hexToRgb = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
};

// Convert hex to RGB values
export const hexToRgbValues = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

// Convert hex to HSL string
export const hexToHslString = (hex: string): string => {
  const [h, s, l] = hexToHsl(hex);
  return `hsl(${h}, ${s}%, ${l}%)`;
};

// Generate color shades
export const generateShades = (hex: string): ColorShade[] => {
  const [h, s] = hexToHsl(hex);
  
  return shadeSteps.map((shade) => {
    // Map shade to lightness: 50 = 95%, 950 = 5%
    let l: number;
    if (shade === 50) l = 97;
    else if (shade === 100) l = 94;
    else if (shade === 200) l = 86;
    else if (shade === 300) l = 77;
    else if (shade === 400) l = 66;
    else if (shade === 500) l = 55;
    else if (shade === 600) l = 45;
    else if (shade === 700) l = 35;
    else if (shade === 800) l = 25;
    else if (shade === 900) l = 15;
    else l = 8; // 950
    
    return {
      shade,
      hex: hslToHex(h, s, l),
    };
  });
};

// Generate palette based on harmony type
export const generateHarmonyPalette = (baseHex: string, harmony: HarmonyType): string[] => {
  const [h, s, l] = hexToHsl(baseHex);

  switch (harmony) {
    case "analogous":
      return [
        hslToHex((h - 30 + 360) % 360, s, l),
        hslToHex((h - 15 + 360) % 360, s, l),
        baseHex,
        hslToHex((h + 15) % 360, s, l),
        hslToHex((h + 30) % 360, s, l),
      ];
    case "complementary":
      return [
        hslToHex((h - 15 + 360) % 360, s, l),
        baseHex,
        hslToHex((h + 15) % 360, s, l),
        hslToHex((h + 165) % 360, s, l),
        hslToHex((h + 180) % 360, s, l),
      ];
    case "triadic":
      return [
        baseHex,
        hslToHex((h + 60) % 360, s, l),
        hslToHex((h + 120) % 360, s, l),
        hslToHex((h + 240) % 360, s, l),
        hslToHex((h + 300) % 360, s, l),
      ];
    case "tetradic":
      return [
        baseHex,
        hslToHex((h + 90) % 360, s, l),
        hslToHex((h + 180) % 360, s, l),
        hslToHex((h + 270) % 360, s, l),
        hslToHex((h + 45) % 360, s, l),
      ];
    case "split-complementary":
      return [
        hslToHex((h - 30 + 360) % 360, s, l),
        baseHex,
        hslToHex((h + 30) % 360, s, l),
        hslToHex((h + 150) % 360, s, l),
        hslToHex((h + 210) % 360, s, l),
      ];
    case "monochromatic":
      return [
        hslToHex(h, s, Math.max(l - 30, 10)),
        hslToHex(h, s, Math.max(l - 15, 10)),
        baseHex,
        hslToHex(h, s, Math.min(l + 15, 90)),
        hslToHex(h, s, Math.min(l + 30, 90)),
      ];
    default:
      return [baseHex, randomHex(), randomHex(), randomHex(), randomHex()];
  }
};

// Calculate relative luminance
const getRelativeLuminance = (hex: string): number => {
  const [r, g, b] = hexToRgbValues(hex).map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Calculate contrast ratio between two colors
export const getContrastRatio = (hex1: string, hex2: string): number => {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

// Check WCAG compliance
export const checkWcagCompliance = (foreground: string, background: string): ContrastResult => {
  const ratio = getContrastRatio(foreground, background);
  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Slugify color name for CSS variable
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};
