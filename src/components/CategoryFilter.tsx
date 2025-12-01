import { cn } from "@/lib/utils";
import { ToolCategory, categoryLabels, categoryColors } from "@/data/tools";
import { Layers, Code2, RefreshCw, Terminal, Sparkles, Wrench } from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: ToolCategory | "all";
  onCategoryChange: (category: ToolCategory | "all") => void;
  toolCounts: Record<ToolCategory | "all", number>;
}

const categoryIcons: Record<ToolCategory | "all", React.ReactNode> = {
  all: <Layers className="w-3.5 h-3.5" />,
  scripts: <Code2 className="w-3.5 h-3.5" />,
  convertisseurs: <RefreshCw className="w-3.5 h-3.5" />,
  commandes: <Terminal className="w-3.5 h-3.5" />,
  utilitaires: <Wrench className="w-3.5 h-3.5" />,
  génération: <Sparkles className="w-3.5 h-3.5" />,
};

const CategoryFilter = ({ selectedCategory, onCategoryChange, toolCounts }: CategoryFilterProps) => {
  const categories: (ToolCategory | "all")[] = [
    "all",
    "scripts",
    "convertisseurs",
    "commandes",
    "utilitaires",
    "génération",
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category, index) => {
        const isSelected = selectedCategory === category;
        const colors = category === "all" 
          ? { bg: "bg-secondary", text: "text-secondary-foreground", border: "border-border" }
          : categoryColors[category];

        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={cn(
              "category-badge border gap-1.5 relative overflow-hidden transition-all duration-300",
              "hover:scale-105 active:scale-95",
              isSelected
                ? cn(
                    colors.bg, 
                    colors.text, 
                    colors.border,
                    "category-badge-selected shadow-lg",
                    "animate-slide-in"
                  )
                : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground/50 hover:text-foreground hover:bg-muted/50"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {isSelected && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 animate-shimmer" />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span className={cn(
                "transition-transform duration-300",
                isSelected ? "scale-110" : "group-hover:scale-110"
              )}>
                {categoryIcons[category]}
              </span>
              <span>{category === "all" ? "Tous" : categoryLabels[category]}</span>
            </span>
            <span className={cn(
              "ml-1 text-[10px] px-1.5 py-0.5 rounded-full relative z-10 transition-all duration-300",
              isSelected 
                ? "bg-background/20 font-semibold scale-110" 
                : "bg-muted group-hover:bg-muted/80"
            )}>
              {toolCounts[category]}
            </span>
            {isSelected && (
              <div className="absolute inset-0 rounded-md border-2 border-primary/50 animate-glow-pulse pointer-events-none" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
