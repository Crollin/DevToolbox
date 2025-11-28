import { Copy, Star, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { WPCLICommand, difficultyColors } from "@/types/wpcli";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface CommandCardProps {
  command: WPCLICommand;
  onEdit: (command: WPCLICommand) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const CommandCard = ({ command, onEdit, onDelete, onToggleFavorite }: CommandCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const diffColors = difficultyColors[command.difficulty];

  const copyCommand = () => {
    navigator.clipboard.writeText(command.command);
    toast({ title: "Commande copiée" });
  };

  return (
    <div className="group rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Command */}
            <div className="flex items-center gap-2 mb-2">
              <code className="font-mono text-sm text-primary bg-primary/10 px-2 py-1 rounded truncate max-w-full">
                {command.command}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={copyCommand}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {command.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleFavorite(command.id)}
            >
              <Star
                className={cn(
                  "w-4 h-4 transition-colors",
                  command.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onEdit(command)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
              onClick={() => onDelete(command.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className={cn("text-xs", diffColors.bg, diffColors.text)}>
            {command.difficulty}
          </Badge>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto"
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
        <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/30">
          {command.example && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Exemple
              </span>
              <pre className="mt-1 text-xs font-mono bg-background p-2 rounded border border-border overflow-x-auto whitespace-pre-wrap">
                {command.example}
              </pre>
            </div>
          )}
          {command.options && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Options
              </span>
              <pre className="mt-1 text-xs font-mono bg-background p-2 rounded border border-border overflow-x-auto whitespace-pre-wrap">
                {command.options}
              </pre>
            </div>
          )}
          {command.notes && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notes
              </span>
              <p className="mt-1 text-sm text-muted-foreground">{command.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommandCard;
