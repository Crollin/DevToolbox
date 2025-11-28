import { useState } from "react";
import { Check, X } from "lucide-react";
import { PaletteColor } from "@/types/palette";
import { checkWcagCompliance, getContrastColor } from "@/lib/colorUtils";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContrastCheckerProps {
  colors: PaletteColor[];
}

const ContrastChecker = ({ colors }: ContrastCheckerProps) => {
  const [foregroundId, setForegroundId] = useState<string>(colors[4]?.id || colors[0]?.id || "");
  const [backgroundId, setBackgroundId] = useState<string>(colors[3]?.id || colors[0]?.id || "");

  const foreground = colors.find((c) => c.id === foregroundId);
  const background = colors.find((c) => c.id === backgroundId);

  if (!foreground || !background) return null;

  const result = checkWcagCompliance(foreground.hex, background.hex);

  const StatusIcon = ({ passed }: { passed: boolean }) => (
    passed ? (
      <Check className="w-4 h-4 text-emerald-400" />
    ) : (
      <X className="w-4 h-4 text-destructive" />
    )
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Vérificateur de contraste WCAG</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Texte</label>
          <Select value={foregroundId} onValueChange={setForegroundId}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colors.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-border"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Fond</label>
          <Select value={backgroundId} onValueChange={setBackgroundId}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colors.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-border"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Preview */}
      <div
        className="rounded-lg p-6 text-center"
        style={{ backgroundColor: background.hex }}
      >
        <p
          className="text-2xl font-bold mb-2"
          style={{ color: foreground.hex }}
        >
          Exemple de texte
        </p>
        <p
          className="text-sm"
          style={{ color: foreground.hex }}
        >
          Texte plus petit pour vérifier la lisibilité
        </p>
      </div>

      {/* Ratio */}
      <div className="text-center">
        <div className="text-3xl font-bold font-mono">
          {result.ratio}:1
        </div>
        <p className="text-sm text-muted-foreground">Ratio de contraste</p>
      </div>

      {/* WCAG Results */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg",
          result.aa ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-destructive/10 border border-destructive/30"
        )}>
          <span>AA Normal</span>
          <StatusIcon passed={result.aa} />
        </div>
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg",
          result.aaLarge ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-destructive/10 border border-destructive/30"
        )}>
          <span>AA Large</span>
          <StatusIcon passed={result.aaLarge} />
        </div>
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg",
          result.aaa ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-destructive/10 border border-destructive/30"
        )}>
          <span>AAA Normal</span>
          <StatusIcon passed={result.aaa} />
        </div>
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg",
          result.aaaLarge ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-destructive/10 border border-destructive/30"
        )}>
          <span>AAA Large</span>
          <StatusIcon passed={result.aaaLarge} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        AA : ratio ≥ 4.5:1 (normal) ou ≥ 3:1 (large) • AAA : ratio ≥ 7:1 (normal) ou ≥ 4.5:1 (large)
      </p>
    </div>
  );
};

export default ContrastChecker;
