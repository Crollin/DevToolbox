import { useState } from "react";
import { Copy, Heart, Pencil, Trash2, Code, Check } from "lucide-react";
import { SVGIcon } from "@/types/svgicon";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface IconCardProps {
  icon: SVGIcon;
  onEdit: (icon: SVGIcon) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const IconCard = ({ icon, onEdit, onDelete, onToggleFavorite }: IconCardProps) => {
  const { toast } = useToast();
  const [copiedType, setCopiedType] = useState<"svg" | "jsx" | null>(null);

  const getStyledSvg = () => {
    let svg = icon.svgCode;
    svg = svg.replace(/width="[^"]*"/, `width="${icon.size}"`);
    svg = svg.replace(/height="[^"]*"/, `height="${icon.size}"`);
    if (icon.color !== "currentColor") {
      svg = svg.replace(/stroke="[^"]*"/, `stroke="${icon.color}"`);
      svg = svg.replace(/fill="[^"]*"/, `fill="${icon.color}"`);
    }
    return svg;
  };

  const getJsxCode = () => {
    let jsx = getStyledSvg();
    jsx = jsx.replace(/stroke-width/g, "strokeWidth");
    jsx = jsx.replace(/stroke-linecap/g, "strokeLinecap");
    jsx = jsx.replace(/stroke-linejoin/g, "strokeLinejoin");
    jsx = jsx.replace(/fill-rule/g, "fillRule");
    jsx = jsx.replace(/clip-rule/g, "clipRule");
    jsx = jsx.replace(/xmlns:xlink/g, "xmlnsXlink");
    return jsx;
  };

  const handleCopy = async (type: "svg" | "jsx") => {
    const code = type === "svg" ? getStyledSvg() : getJsxCode();
    await navigator.clipboard.writeText(code);
    setCopiedType(type);
    toast({
      title: "Copié !",
      description: `Code ${type.toUpperCase()} copié dans le presse-papier`,
    });
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="group relative bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all duration-200">
      {/* Preview */}
      <div className="flex items-center justify-center h-24 mb-4 bg-muted/30 rounded-lg">
        <div
          dangerouslySetInnerHTML={{ __html: getStyledSvg() }}
          className="text-foreground"
          style={{ color: icon.color === "currentColor" ? undefined : icon.color }}
        />
      </div>

      {/* Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground truncate">{icon.name}</h3>
          <button
            onClick={() => onToggleFavorite(icon.id)}
            className={cn(
              "p-1 rounded transition-colors",
              icon.isFavorite
                ? "text-rose-500"
                : "text-muted-foreground hover:text-rose-500"
            )}
          >
            <Heart
              className="w-4 h-4"
              fill={icon.isFavorite ? "currentColor" : "none"}
            />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {icon.category}
          </span>
          <span className="text-xs text-muted-foreground">{icon.size}px</span>
        </div>

        {icon.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {icon.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy("svg")}
              className="flex-1 h-8 text-xs"
            >
              {copiedType === "svg" ? (
                <Check className="w-3 h-3 mr-1" />
              ) : (
                <Copy className="w-3 h-3 mr-1" />
              )}
              SVG
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copier le code SVG</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy("jsx")}
              className="flex-1 h-8 text-xs"
            >
              {copiedType === "jsx" ? (
                <Check className="w-3 h-3 mr-1" />
              ) : (
                <Code className="w-3 h-3 mr-1" />
              )}
              JSX
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copier le code JSX</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(icon)}
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
              onClick={() => onDelete(icon.id)}
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

export default IconCard;
