import { useNavigate } from "react-router-dom";
import { ExternalLink, Key, FileSpreadsheet, Zap, Braces, GitBranch, Palette, Code2, Server } from "lucide-react";
import { Tool, categoryLabels, categoryColors } from "@/data/tools";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Key,
  FileSpreadsheet,
  Zap,
  Braces,
  GitBranch,
  Palette,
  Code2,
  Server,
};

// Tools that have internal pages
const internalTools = ["licence-key-hub", "csv-preview-pro", "mon-calcul-energie", "wp-script-library", "color-palette-gen"];

interface ToolCardProps {
  tool: Tool;
  index: number;
}

const ToolCard = ({ tool, index }: ToolCardProps) => {
  const navigate = useNavigate();
  const IconComponent = iconMap[tool.icon] || Code2;
  const colors = categoryColors[tool.category];
  const isInternal = internalTools.includes(tool.id);

  const handleClick = () => {
    if (isInternal) {
      navigate(`/tools/${tool.id}`);
    } else if (tool.url) {
      window.open(tool.url, "_blank");
    }
  };

  return (
    <article
      className="tool-card group cursor-pointer animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={handleClick}
    >
      {/* Category Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className={cn("category-badge border", colors.bg, colors.text, colors.border)}>
          {categoryLabels[tool.category]}
        </span>
        {!isInternal && (
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* Icon & Title */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          colors.bg, colors.border, "border"
        )}>
          <IconComponent className={cn("w-5 h-5", colors.text)} />
        </div>
        <div className="min-w-0">
          <h3 className="font-mono font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {tool.name}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
        {tool.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {tool.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Hover Gradient Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </article>
  );
};

export default ToolCard;
