import { Copy, Star, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { WPHook, hookTypeColors } from "@/types/wphook";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface HookCardProps {
  hook: WPHook;
  onEdit: (hook: WPHook) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const HookCard = ({ hook, onEdit, onDelete, onToggleFavorite }: HookCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const typeColors = hookTypeColors[hook.type];

  const copyHook = () => {
    navigator.clipboard.writeText(hook.name);
    toast({ title: "Nom du hook copié" });
  };

  const copyExample = () => {
    navigator.clipboard.writeText(hook.example);
    toast({ title: "Exemple copié" });
  };

  return (
    <div className="group rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
      {/* Header */}
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            {/* Hook Name */}
            <div className="flex items-center gap-2 mb-2">
              <code className="font-mono text-xs sm:text-sm text-primary bg-primary/10 px-2 py-1 rounded truncate max-w-full">
                {hook.name}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-7 sm:w-7 shrink-0"
                onClick={copyHook}
              >
                <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Button>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {hook.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={() => onToggleFavorite(hook.id)}
            >
              <Star
                className={cn(
                  "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors",
                  hook.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              onClick={() => onEdit(hook)}
            >
              <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
              onClick={() => onDelete(hook.id)}
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 mt-2 sm:mt-3 flex-wrap">
          <Badge variant="outline" className={cn("text-[10px] sm:text-xs", typeColors.bg, typeColors.text)}>
            {hook.type === "action" ? "Action" : "Filter"}
          </Badge>
          {hook.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] sm:text-xs">
              {tag}
            </Badge>
          ))}
          {hook.tags.length > 2 && (
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              +{hook.tags.length - 2}
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto"
          >
            {expanded ? (
              <>
                Moins <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Détails <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border px-3 sm:px-4 py-2 sm:py-3 space-y-2 sm:space-y-3 bg-muted/30">
          {hook.example && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Exemple
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={copyExample}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copier
                </Button>
              </div>
              <pre className="text-[10px] sm:text-xs font-mono bg-background p-2 rounded border border-border overflow-x-auto whitespace-pre-wrap">
                {hook.example}
              </pre>
            </div>
          )}
          {hook.parameters && (
            <div>
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Paramètres
              </span>
              <pre className="mt-1 text-[10px] sm:text-xs font-mono bg-background p-2 rounded border border-border overflow-x-auto whitespace-pre-wrap">
                {hook.parameters}
              </pre>
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {hook.since && (
              <span>
                Depuis: <span className="font-medium">{hook.since}</span>
              </span>
            )}
            {hook.deprecated && (
              <span className="text-destructive">
                Déprécié: <span className="font-medium">{hook.deprecated}</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HookCard;





