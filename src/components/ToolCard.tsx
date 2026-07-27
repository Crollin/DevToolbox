import { useNavigate } from "react-router-dom";
import { ExternalLink, Key, FileSpreadsheet, Braces, GitBranch, Palette, Code2, Server, Terminal, Shapes, Container, FileText, Link, Database, Image, CheckSquare, BookMarked, Settings, Package } from "lucide-react";
import { Tool, categoryLabels, categoryColors } from "@/data/tools";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Key,
  FileSpreadsheet,
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
  Image,
  CheckSquare,
  BookMarked,
  Settings,
  Package,
};

// Tools that have internal pages
const internalTools = ["licence-key-hub", "csv-preview-pro", "wp-script-library", "color-palette-gen", "wpcli-glossary", "svg-icon-library", "git-commander", "docker-commander", "code-snippet-library", "wp-hook-reference", "wp-query-builder", "markdown-editor", "image-resizer", "task-reminder", "knowledge-base", "wp-config-generator", "plugin-header-builder"];

interface ToolCardProps {
  tool: Tool;
  index: number;
  isDragging?: boolean;
  isEditMode?: boolean;
}

const ToolCard = ({ tool, index, isDragging = false, isEditMode = false }: ToolCardProps) => {
  const navigate = useNavigate();
  const IconComponent = iconMap[tool.icon] || Code2;
  const colors = categoryColors[tool.category];
  const isInternal = internalTools.includes(tool.id);

  const handleClick = () => {
    // Désactiver le clic pendant le drag ou en mode édition
    if (isDragging || isEditMode) {
      return;
    }
    
    if (isInternal) {
      navigate(`/tools/${tool.id}`);
    } else if (tool.url) {
      window.open(tool.url, "_blank");
    }
  };

  return (
    <article
      className={cn(
        "tool-card group animate-fade-in min-h-[220px] flex flex-col",
        isDragging ? "cursor-grabbing" : isEditMode ? "cursor-grab" : "cursor-pointer"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-6">
        <span className={cn("category-badge border", colors.bg, colors.text, colors.border)}>
          {categoryLabels[tool.category]}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/60">{String(index + 1).padStart(2, "0")}</span>
        {!isInternal && (
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* Icon & Title */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          "w-9 h-9 rounded-md flex items-center justify-center shrink-0",
          colors.bg, colors.border, "border"
        )}>
          <IconComponent className={cn("w-5 h-5", colors.text)} />
        </div>
        <div className="min-w-0">
          <h3 className="font-mono font-medium text-[15px] text-foreground group-hover:text-primary transition-colors truncate">
            {tool.name}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-[13px] text-muted-foreground leading-relaxed mb-5 line-clamp-3">
        {tool.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {tool.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground font-mono"
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
