import { useState, useCallback } from "react";
import { RefreshCw, Copy, Download, Lock, Unlock } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { tools } from "@/data/tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type HarmonyType = "analogous" | "complementary" | "triadic" | "tetradic" | "split-complementary" | "monochromatic";

interface ColorSlot {
  hex: string;
  locked: boolean;
}

const harmonyLabels: Record<HarmonyType, string> = {
  analogous: "Analogues",
  complementary: "Complémentaires",
  triadic: "Triadiques",
  tetradic: "Tétradiques",
  "split-complementary": "Complémentaires divisés",
  monochromatic: "Monochromatiques",
};

// Convert hex to HSL
const hexToHsl = (hex: string): [number, number, number] => {
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
const hslToHex = (h: number, s: number, l: number): string => {
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
const randomHex = (): string => {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
};

// Generate palette based on harmony type
const generateHarmonyPalette = (baseHex: string, harmony: HarmonyType): string[] => {
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

// Get contrast color for text
const getContrastColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

// Convert hex to RGB string
const hexToRgb = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
};

// Convert hex to HSL string
const hexToHslString = (hex: string): string => {
  const [h, s, l] = hexToHsl(hex);
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const ColorPaletteGen = () => {
  const tool = tools.find((t) => t.id === "color-palette-gen")!;

  const [harmony, setHarmony] = useState<HarmonyType>("analogous");
  const [colors, setColors] = useState<ColorSlot[]>(() => {
    const base = randomHex();
    return generateHarmonyPalette(base, "analogous").map((hex) => ({ hex, locked: false }));
  });
  const [colorFormat, setColorFormat] = useState<"hex" | "rgb" | "hsl">("hex");

  const generateNewPalette = useCallback(() => {
    const lockedIndex = colors.findIndex((c) => c.locked);
    const baseHex = lockedIndex >= 0 ? colors[lockedIndex].hex : randomHex();
    const newPalette = generateHarmonyPalette(baseHex, harmony);

    setColors((prev) =>
      newPalette.map((hex, i) => ({
        hex: prev[i]?.locked ? prev[i].hex : hex,
        locked: prev[i]?.locked || false,
      }))
    );
  }, [harmony, colors]);

  const toggleLock = (index: number) => {
    setColors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, locked: !c.locked } : c))
    );
  };

  const updateColor = (index: number, hex: string) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setColors((prev) =>
        prev.map((c, i) => (i === index ? { ...c, hex } : c))
      );
    }
  };

  const copyColor = (hex: string) => {
    let value = hex;
    if (colorFormat === "rgb") value = hexToRgb(hex);
    if (colorFormat === "hsl") value = hexToHslString(hex);

    navigator.clipboard.writeText(value);
    toast({ title: "Copié", description: value });
  };

  const copyAllColors = () => {
    const values = colors.map((c) => {
      if (colorFormat === "rgb") return hexToRgb(c.hex);
      if (colorFormat === "hsl") return hexToHslString(c.hex);
      return c.hex;
    });
    navigator.clipboard.writeText(values.join("\n"));
    toast({ title: "Palette copiée" });
  };

  const exportPalette = () => {
    const data = {
      harmony,
      colors: colors.map((c) => ({
        hex: c.hex,
        rgb: hexToRgb(c.hex),
        hsl: hexToHslString(c.hex),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `palette-${harmony}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Palette exportée" });
  };

  const getDisplayValue = (hex: string) => {
    if (colorFormat === "rgb") return hexToRgb(hex);
    if (colorFormat === "hsl") return hexToHslString(hex);
    return hex.toUpperCase();
  };

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label>Harmonie</Label>
            <Select value={harmony} onValueChange={(v) => setHarmony(v as HarmonyType)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(harmonyLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={colorFormat} onValueChange={(v) => setColorFormat(v as "hex" | "rgb" | "hsl")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hex">HEX</SelectItem>
                <SelectItem value="rgb">RGB</SelectItem>
                <SelectItem value="hsl">HSL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={generateNewPalette} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Générer
          </Button>

          <Button variant="outline" onClick={copyAllColors} className="gap-2">
            <Copy className="w-4 h-4" />
            Copier tout
          </Button>

          <Button variant="outline" onClick={exportPalette} className="gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>

        {/* Palette Display */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 min-h-[300px]">
          {colors.map((color, index) => (
            <div
              key={index}
              className="relative group rounded-xl overflow-hidden border border-border transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: color.hex }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                {/* Lock button */}
                <button
                  onClick={() => toggleLock(index)}
                  className={cn(
                    "absolute top-3 right-3 p-2 rounded-lg transition-all",
                    "opacity-0 group-hover:opacity-100",
                    color.locked ? "opacity-100" : ""
                  )}
                  style={{ 
                    backgroundColor: `${getContrastColor(color.hex)}20`,
                    color: getContrastColor(color.hex)
                  }}
                >
                  {color.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>

                {/* Color info */}
                <div 
                  className="text-center space-y-2"
                  style={{ color: getContrastColor(color.hex) }}
                >
                  <div className="font-mono text-lg font-bold">
                    {getDisplayValue(color.hex)}
                  </div>
                  
                  {/* Color picker */}
                  <Input
                    type="color"
                    value={color.hex}
                    onChange={(e) => updateColor(index, e.target.value)}
                    className="w-12 h-8 p-0 border-0 cursor-pointer mx-auto"
                  />
                </div>

                {/* Copy button */}
                <button
                  onClick={() => copyColor(color.hex)}
                  className={cn(
                    "absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    "opacity-0 group-hover:opacity-100"
                  )}
                  style={{ 
                    backgroundColor: `${getContrastColor(color.hex)}20`,
                    color: getContrastColor(color.hex)
                  }}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {/* Min height for mobile */}
              <div className="h-32 sm:h-full sm:min-h-[300px]" />
            </div>
          ))}
        </div>

        {/* Keyboard hint */}
        <p className="text-sm text-muted-foreground text-center">
          Astuce : Verrouillez une couleur pour la conserver lors de la génération
        </p>
      </div>
    </ToolLayout>
  );
};

export default ColorPaletteGen;
