import { useNavigate } from "react-router-dom";
import { ExternalLink, Key, FileSpreadsheet, Zap, Braces, GitBranch, Palette, Code2, Server, Terminal, Shapes, Container, FileText, Link, Database } from "lucide-react";
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
  Terminal,
  Shapes,
  Container,
  FileText,
  Link,
  Database,
};

// Tools that have internal pages
const internalTools = ["licence-key-hub", "csv-preview-pro", "mon-calcul-energie", "wp-script-library", "color-palette-gen", "wpcli-glossary", "svg-icon-library", "git-commander", "docker-commander", "code-snippet-library", "wp-hook-reference", "wp-query-builder", "markdown-editor"];

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
      className="tool-card tool-card-glow group cursor-pointer animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={handleClick}
    >
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Animated border */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/30 transition-all duration-300 pointer-events-none animate-border-glow" />

      {/* Category Badge */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className={cn("category-badge border", colors.bg, colors.text, colors.border)}>
          {categoryLabels[tool.category]}
        </span>
        {!isInternal && (
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
        )}
      </div>

      {/* Icon & Title */}
      <div className="flex items-start gap-3 mb-3 relative z-10">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
          colors.bg, colors.border, "border"
        )}>
          <IconComponent className={cn("w-5 h-5 transition-all duration-300 group-hover:scale-110", colors.text)} />
        </div>
        <div className="min-w-0">
          <h3 className="font-mono font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {tool.name}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2 relative z-10">
        {tool.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 relative z-10">
        {tool.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Hover Gradient Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </article>
  );
};

export default ToolCard;
