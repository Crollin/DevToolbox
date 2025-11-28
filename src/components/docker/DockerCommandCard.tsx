import { useState } from "react";
import { Copy, Heart, Pencil, Trash2, Check, Container } from "lucide-react";
import { DockerCommand, difficultyColors } from "@/types/docker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface DockerCommandCardProps {
  command: DockerCommand;
  onEdit: (command: DockerCommand) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const DockerCommandCard = ({
  command,
  onEdit,
  onDelete,
  onToggleFavorite,
}: DockerCommandCardProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const difficultyColor = difficultyColors[command.difficulty];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command.command);
    setCopied(true);
    toast({
      title: "Copié !",
      description: "Commande copiée dans le presse-papier",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-card border border-border rounded-xl p-4 hover:border-sky-500/50 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium",
              difficultyColor.bg,
              difficultyColor.text
            )}
          >
            {command.difficulty}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-medium">
            {command.category}
          </span>
        </div>
        <button
          onClick={() => onToggleFavorite(command.id)}
          className={cn(
            "p-1 rounded transition-colors shrink-0",
            command.isFavorite
              ? "text-rose-500"
              : "text-muted-foreground hover:text-rose-500"
          )}
        >
          <Heart
            className="w-4 h-4"
            fill={command.isFavorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* Command */}
      <div
        className="group/cmd flex items-center gap-2 bg-muted/50 rounded-lg p-3 mb-3 cursor-pointer hover:bg-muted transition-colors"
        onClick={handleCopy}
      >
        <Container className="w-4 h-4 text-sky-400 shrink-0" />
        <code className="text-sm font-mono text-foreground flex-1 break-all">
          {command.command}
        </code>
        {copied ? (
          <Check className="w-4 h-4 text-sky-400 shrink-0" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover/cmd:opacity-100 transition-opacity shrink-0" />
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3">{command.description}</p>

      {/* Example */}
      {command.example && (
        <div className="mb-3">
          <span className="text-xs text-muted-foreground font-medium">
            Exemple:
          </span>
          <code className="block mt-1 text-xs font-mono text-foreground/80 bg-muted/30 rounded px-2 py-1 break-all">
            {command.example}
          </code>
        </div>
      )}

      {/* Options */}
      {command.options && (
        <div className="mb-3">
          <span className="text-xs text-muted-foreground font-medium">
            Options:
          </span>
          <p className="text-xs text-foreground/70 mt-1">{command.options}</p>
        </div>
      )}

      {/* Notes */}
      {command.notes && (
        <div className="mb-3 p-2 bg-sky-500/5 border border-sky-500/20 rounded-lg">
          <p className="text-xs text-sky-400/90">{command.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="flex-1 h-8 text-xs"
        >
          {copied ? (
            <Check className="w-3 h-3 mr-1" />
          ) : (
            <Copy className="w-3 h-3 mr-1" />
          )}
          Copier
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(command)}
              className="h-8 w-8"
            >
              <Pencil className="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Modifier</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(command.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Supprimer</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default DockerCommandCard;
