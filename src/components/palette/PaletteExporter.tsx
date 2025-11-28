import { useState } from "react";
import { Copy, Download } from "lucide-react";
import { ColorPalette, ExportFormat } from "@/types/palette";
import { hexToHsl, hexToRgb, slugify } from "@/lib/colorUtils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

interface PaletteExporterProps {
  palette: ColorPalette;
}

const PaletteExporter = ({ palette }: PaletteExporterProps) => {
  const [format, setFormat] = useState<ExportFormat>("css");

  const generateCss = (): string => {
    const lines = [":root {"];
    
    palette.colors.forEach((color) => {
      const name = slugify(color.name);
      const [h, s, l] = hexToHsl(color.hex);
      lines.push(`  --${name}: ${h} ${s}% ${l}%;`);
      
      // Add shades
      color.shades.forEach((shade) => {
        const [sh, ss, sl] = hexToHsl(shade.hex);
        lines.push(`  --${name}-${shade.shade}: ${sh} ${ss}% ${sl}%;`);
      });
      lines.push("");
    });
    
    lines.push("}");
    return lines.join("\n");
  };

  const generateTailwind = (): string => {
    const colors: Record<string, Record<string | number, string>> = {};
    
    palette.colors.forEach((color) => {
      const name = slugify(color.name);
      colors[name] = {
        DEFAULT: color.hex,
      };
      color.shades.forEach((shade) => {
        colors[name][shade.shade] = shade.hex;
      });
    });

    return `// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 8).replace(/"([^"]+)":/g, '$1:')}
    }
  }
}`;
  };

  const generateScss = (): string => {
    const lines: string[] = [];
    
    palette.colors.forEach((color) => {
      const name = slugify(color.name);
      lines.push(`$${name}: ${color.hex};`);
      
      color.shades.forEach((shade) => {
        lines.push(`$${name}-${shade.shade}: ${shade.hex};`);
      });
      lines.push("");
    });

    // Add map
    lines.push("// Color maps");
    palette.colors.forEach((color) => {
      const name = slugify(color.name);
      const shadeEntries = color.shades.map((s) => `  ${s.shade}: $${name}-${s.shade}`).join(",\n");
      lines.push(`$${name}-shades: (\n${shadeEntries}\n);`);
      lines.push("");
    });

    return lines.join("\n");
  };

  const generateJson = (): string => {
    const data = {
      name: palette.name,
      description: palette.description,
      colors: palette.colors.map((c) => ({
        name: c.name,
        role: c.role,
        hex: c.hex,
        rgb: hexToRgb(c.hex),
        shades: c.shades.reduce((acc, s) => {
          acc[s.shade] = s.hex;
          return acc;
        }, {} as Record<number, string>),
      })),
    };
    return JSON.stringify(data, null, 2);
  };

  const getOutput = (): string => {
    switch (format) {
      case "css":
        return generateCss();
      case "tailwind":
        return generateTailwind();
      case "scss":
        return generateScss();
      case "json":
        return generateJson();
      default:
        return "";
    }
  };

  const output = getOutput();

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copié dans le presse-papier");
  };

  const handleDownload = () => {
    const extensions: Record<ExportFormat, string> = {
      css: "css",
      tailwind: "ts",
      scss: "scss",
      json: "json",
    };
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(palette.name)}-palette.${extensions[format]}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Fichier téléchargé");
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Exporter la palette</h3>
      
      <Tabs value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="css">CSS</TabsTrigger>
          <TabsTrigger value="tailwind">Tailwind</TabsTrigger>
          <TabsTrigger value="scss">SCSS</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>

        <TabsContent value={format} className="mt-4">
          <Textarea
            value={output}
            readOnly
            className="font-mono text-xs h-64 resize-none"
          />
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Button onClick={handleCopy} variant="outline" size="sm" className="flex-1">
          <Copy className="w-4 h-4 mr-2" />
          Copier
        </Button>
        <Button onClick={handleDownload} size="sm" className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Télécharger
        </Button>
      </div>
    </div>
  );
};

export default PaletteExporter;
