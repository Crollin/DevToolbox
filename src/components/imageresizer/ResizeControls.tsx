import { ImageResizeSettings } from "@/types/image-resizer";
import { wordPressPresets } from "@/lib/imagePresets";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResizeControlsProps {
  settings: ImageResizeSettings;
  onSettingsChange: (updates: Partial<ImageResizeSettings>) => void;
}

export const ResizeControls = ({ settings, onSettingsChange }: ResizeControlsProps) => {
  const handlePresetChange = (presetId: string) => {
    const preset = wordPressPresets.find((p) => p.id === presetId);
    if (preset) {
      onSettingsChange({
        preset: presetId as ImageResizeSettings["preset"],
        width: preset.width || settings.width,
        height: preset.height || settings.height,
      });
    }
  };

  const handleDimensionChange = (field: "width" | "height", value: string) => {
    const numValue = parseInt(value) || 0;
    onSettingsChange({
      [field]: numValue,
      preset: numValue > 0 ? "custom" : settings.preset,
    });
  };

  return (
    <div className="space-y-6">
      {/* Preset Selector */}
      <div className="space-y-2">
        <Label htmlFor="preset">Type d'image</Label>
        <Select value={settings.preset} onValueChange={handlePresetChange}>
          <SelectTrigger id="preset">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {wordPressPresets.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{preset.name}</span>
                  {preset.description && (
                    <span className="text-xs text-muted-foreground">
                      {preset.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Manual Dimensions */}
      {(settings.preset === "custom" || settings.preset === "full") && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Largeur (px)</Label>
              <Input
                id="width"
                type="number"
                min="1"
                value={settings.width || ""}
                onChange={(e) => handleDimensionChange("width", e.target.value)}
                placeholder="Largeur"
                disabled={settings.preset === "full"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Hauteur (px)</Label>
              <Input
                id="height"
                type="number"
                min="1"
                value={settings.height || ""}
                onChange={(e) => handleDimensionChange("height", e.target.value)}
                placeholder="Hauteur"
                disabled={settings.preset === "full"}
              />
            </div>
          </div>
        </div>
      )}

      {/* Preset Dimensions Display */}
      {settings.preset !== "custom" && settings.preset !== "full" && (
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Dimensions</span>
            <span className="font-mono font-medium">
              {settings.width} × {settings.height} px
            </span>
          </div>
        </div>
      )}

      {/* Maintain Aspect Ratio */}
      {settings.preset !== "full" && (
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="aspect-ratio" className="cursor-pointer">
              Conserver le ratio d'aspect
            </Label>
            <p className="text-xs text-muted-foreground">
              Maintient les proportions de l'image originale
            </p>
          </div>
          <Switch
            id="aspect-ratio"
            checked={settings.maintainAspectRatio}
            onCheckedChange={(checked) =>
              onSettingsChange({ maintainAspectRatio: checked })
            }
          />
        </div>
      )}
    </div>
  );
};








