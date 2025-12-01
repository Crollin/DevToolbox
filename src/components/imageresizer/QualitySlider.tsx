import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface QualitySliderProps {
  quality: number;
  onQualityChange: (quality: number) => void;
}

export const QualitySlider = ({ quality, onQualityChange }: QualitySliderProps) => {
  const handleSliderChange = (values: number[]) => {
    onQualityChange(values[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 50;
    const clampedValue = Math.max(50, Math.min(100, value));
    onQualityChange(clampedValue);
  };

  const getQualityLabel = (q: number): string => {
    if (q >= 90) return "Excellente";
    if (q >= 75) return "Bonne";
    if (q >= 60) return "Moyenne";
    return "Faible";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="quality">Qualité WebP</Label>
        <div className="flex items-center gap-2">
          <Input
            id="quality"
            type="number"
            min="50"
            max="100"
            value={quality}
            onChange={handleInputChange}
            className="w-20 text-right font-mono"
          />
          <span className="text-sm text-muted-foreground">%</span>
          <span className="text-sm font-medium text-muted-foreground">
            ({getQualityLabel(quality)})
          </span>
        </div>
      </div>

      <Slider
        value={[quality]}
        onValueChange={handleSliderChange}
        min={50}
        max={100}
        step={1}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>50% (Faible)</span>
        <span>75% (Recommandé)</span>
        <span>100% (Max)</span>
      </div>

      <p className="text-xs text-muted-foreground">
        Qualité recommandée pour WordPress : 75%. Ajustez selon vos besoins entre 50% (plus léger)
        et 100% (meilleure qualité).
      </p>
    </div>
  );
};

