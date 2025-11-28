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
      {categories.map((category) => {
        const isSelected = selectedCategory === category;
        const colors = category === "all" 
          ? { bg: "bg-secondary", text: "text-secondary-foreground", border: "border-border" }
          : categoryColors[category];

        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={cn(
              "category-badge border gap-1.5",
              isSelected
                ? cn(colors.bg, colors.text, colors.border)
                : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground/50 hover:text-foreground"
            )}
          >
            {categoryIcons[category]}
            <span>{category === "all" ? "Tous" : categoryLabels[category]}</span>
            <span className={cn(
              "ml-1 text-[10px] px-1.5 py-0.5 rounded-full",
              isSelected ? "bg-background/20" : "bg-muted"
            )}>
              {toolCounts[category]}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
