import { useState } from "react";
import { predefinedPalettes, PredefinedPaletteCategory } from "@/data/predefinedPalettes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface PredefinedPalettesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadPalette: (paletteId: string) => void;
}

const categoryLabels: Record<PredefinedPaletteCategory, string> = {
  "Design System": "Système de design",
  Framework: "Framework",
  Brand: "Marque",
};

const PredefinedPalettes = ({ open, onOpenChange, onLoadPalette }: PredefinedPalettesProps) => {
  const [selectedCategory, setSelectedCategory] = useState<PredefinedPaletteCategory | "all">("all");

  const categories: PredefinedPaletteCategory[] = ["Design System", "Framework"];
  const filteredPalettes = selectedCategory === "all"
    ? predefinedPalettes
    : predefinedPalettes.filter((p) => p.category === selectedCategory);

  const handleLoadPalette = (paletteId: string) => {
    onLoadPalette(paletteId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Palettes prédéfinies
          </DialogTitle>
          <DialogDescription>
            Chargez rapidement des palettes de couleurs populaires depuis les systèmes de design et frameworks reconnus.
          </DialogDescription>
        </DialogHeader>

        {/* Category filter */}
        <div className="flex gap-2 pb-4 border-b">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            Toutes
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {categoryLabels[category]}
            </Button>
          ))}
        </div>

        {/* Palettes grid */}
        <ScrollArea className="max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
            {filteredPalettes.map((palette) => (
              <div
                key={palette.id}
                className={cn(
                  "group relative rounded-lg border border-border bg-card p-4",
                  "hover:border-primary/50 hover:shadow-md transition-all cursor-pointer",
                  "flex flex-col gap-3"
                )}
                onClick={() => handleLoadPalette(palette.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{palette.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {palette.description}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {categoryLabels[palette.category]}
                  </Badge>
                </div>

                {/* Color preview */}
                <div className="flex gap-1 rounded-md overflow-hidden border border-border">
                  {palette.colors.map((color, index) => (
                    <div
                      key={index}
                      className="flex-1 h-12 relative group/color"
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      <div className="absolute inset-0 bg-black/0 group-hover/color:bg-black/10 transition-colors" />
                    </div>
                  ))}
                </div>

                {/* Color names */}
                <div className="flex flex-wrap gap-1.5">
                  {palette.colors.slice(0, 4).map((color, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {color.name}
                    </span>
                  ))}
                  {palette.colors.length > 4 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      +{palette.colors.length - 4}
                    </span>
                  )}
                </div>

                {/* Load button overlay */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button size="sm" className="pointer-events-none">
                    Charger la palette
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PredefinedPalettes;

