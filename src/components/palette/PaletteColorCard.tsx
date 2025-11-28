import { useState } from "react";
import { Lock, Unlock, Copy, Trash2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { PaletteColor, ColorRole, roleLabels, roleColors } from "@/types/palette";
import { getContrastColor, hexToRgb, hexToHslString } from "@/lib/colorUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

interface PaletteColorCardProps {
  color: PaletteColor;
  colorFormat: "hex" | "rgb" | "hsl";
  onUpdate: (updates: Partial<PaletteColor>) => void;
  onToggleLock: () => void;
  onRemove: () => void;
}

const PaletteColorCard = ({
  color,
  colorFormat,
  onUpdate,
  onToggleLock,
  onRemove,
}: PaletteColorCardProps) => {
  const [showShades, setShowShades] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(color.name);

  const getDisplayValue = (hex: string) => {
    if (colorFormat === "rgb") return hexToRgb(hex);
    if (colorFormat === "hsl") return hexToHslString(hex);
    return hex.toUpperCase();
  };

  const copyColor = (hex: string) => {
    const value = getDisplayValue(hex);
    navigator.clipboard.writeText(value);
    toast.success("Copié", { description: value });
  };

  const handleSaveName = () => {
    onUpdate({ name: editName });
    setIsEditing(false);
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      {/* Main color block */}
      <div
        className="relative h-32 flex items-center justify-center group"
        style={{ backgroundColor: color.hex }}
      >
        {/* Lock button */}
        <button
          onClick={onToggleLock}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-lg transition-all",
            "opacity-0 group-hover:opacity-100",
            color.locked && "opacity-100"
          )}
          style={{
            backgroundColor: `${getContrastColor(color.hex)}20`,
            color: getContrastColor(color.hex),
          }}
        >
          {color.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        {/* Color value */}
        <div
          className="text-center"
          style={{ color: getContrastColor(color.hex) }}
        >
          <div className="font-mono text-sm font-bold">
            {getDisplayValue(color.hex)}
          </div>
        </div>

        {/* Actions */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => copyColor(color.hex)}
            className="p-1.5 rounded-lg transition-all"
            style={{
              backgroundColor: `${getContrastColor(color.hex)}20`,
              color: getContrastColor(color.hex),
            }}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg transition-all"
            style={{
              backgroundColor: `${getContrastColor(color.hex)}20`,
              color: getContrastColor(color.hex),
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Color info */}
      <div className="p-3 space-y-3">
        {/* Name */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              className="h-7 text-sm"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="font-medium text-sm truncate">{color.name}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-muted rounded shrink-0"
              >
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* Role */}
        <Select
          value={color.role}
          onValueChange={(v) => onUpdate({ role: v as ColorRole })}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(roleLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[10px] px-1.5", roleColors[key as ColorRole])}>
                    {label}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Color picker */}
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={color.hex}
            onChange={(e) => onUpdate({ hex: e.target.value })}
            className="w-8 h-7 p-0 border-0 cursor-pointer"
          />
          <Input
            value={color.hex}
            onChange={(e) => {
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                onUpdate({ hex: e.target.value });
              }
            }}
            className="h-7 text-xs font-mono flex-1"
            placeholder="#000000"
          />
        </div>

        {/* Shades toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowShades(!showShades)}
          className="w-full h-7 text-xs"
        >
          {showShades ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
          {showShades ? "Masquer" : "Nuances"}
        </Button>

        {/* Shades */}
        {showShades && (
          <div className="grid grid-cols-11 gap-0.5 mt-2">
            {color.shades.map((shade) => (
              <button
                key={shade.shade}
                onClick={() => copyColor(shade.hex)}
                className="aspect-square rounded text-[8px] font-mono flex items-center justify-center hover:scale-110 transition-transform"
                style={{
                  backgroundColor: shade.hex,
                  color: getContrastColor(shade.hex),
                }}
                title={`${shade.shade}: ${shade.hex}`}
              >
                {shade.shade}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaletteColorCard;
