import { Plus, Trash2, Copy, Upload } from "lucide-react";
import { ColorPalette } from "@/types/palette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { useRef } from "react";

interface PaletteSidebarProps {
  palettes: ColorPalette[];
  activePaletteId: string;
  onSelectPalette: (id: string) => void;
  onCreatePalette: () => void;
  onDeletePalette: (id: string) => void;
  onDuplicatePalette: (id: string) => void;
  onImportPalette: (data: ColorPalette | ColorPalette[]) => number;
}

const PaletteSidebar = ({
  palettes,
  activePaletteId,
  onSelectPalette,
  onCreatePalette,
  onDeletePalette,
  onDuplicatePalette,
  onImportPalette,
}: PaletteSidebarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const count = onImportPalette(data);
        toast.success(`${count} palette(s) importée(s)`);
      } catch {
        toast.error("Erreur lors de l'import du fichier");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="h-full flex flex-col border-r border-border bg-card/50">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm mb-3">Mes palettes</h2>
        <div className="flex gap-2">
          <Button onClick={onCreatePalette} size="sm" className="flex-1">
            <Plus className="w-4 h-4 mr-1" />
            Nouvelle
          </Button>
          <Button onClick={handleImportClick} variant="outline" size="sm">
            <Upload className="w-4 h-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Palette list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {palettes.map((palette) => (
            <div
              key={palette.id}
              className={cn(
                "group rounded-lg p-2 cursor-pointer transition-colors",
                palette.id === activePaletteId
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-muted border border-transparent"
              )}
              onClick={() => onSelectPalette(palette.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{palette.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {palette.colors.length} couleurs
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePalette(palette.id);
                    }}
                    className="p-1 hover:bg-background rounded"
                    title="Dupliquer"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePalette(palette.id);
                    }}
                    className="p-1 hover:bg-background rounded"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>

              {/* Color preview */}
              <div className="flex gap-0.5 mt-2">
                {palette.colors.slice(0, 6).map((color) => (
                  <div
                    key={color.id}
                    className="flex-1 h-4 first:rounded-l last:rounded-r"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PaletteSidebar;
