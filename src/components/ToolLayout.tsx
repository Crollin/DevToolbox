import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tool, categoryLabels, categoryColors } from "@/data/tools";
import { cn } from "@/lib/utils";

interface ToolLayoutProps {
  tool: Tool;
  children: React.ReactNode;
}

const ToolLayout = ({ tool, children }: ToolLayoutProps) => {
  const navigate = useNavigate();
  const colors = categoryColors[tool.category];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Retour</span>
            </button>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-3">
              <span className={cn("category-badge border", colors.bg, colors.text, colors.border)}>
                {categoryLabels[tool.category]}
              </span>
              <h1 className="font-mono font-medium text-foreground tracking-tight">
                {tool.name}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Tool Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default ToolLayout;
