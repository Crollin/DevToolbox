import { useState, useMemo, useCallback, useRef } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import ToolGrid from "@/components/ToolGrid";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { GripVertical, Check, ArrowUpRight } from "lucide-react";
import { tools, ToolCategory } from "@/data/tools";
import { useToolOrder } from "@/hooks/useToolOrder";
import { useAuth } from "@/contexts/AuthContext";
import { HomeDashboard } from "@/components/HomeDashboard";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | "all">("all");
  const [isEditMode, setIsEditMode] = useState(false);
  const { isAuthenticated } = useAuth();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Utiliser le hook pour gérer l'ordre personnalisé
  const { orderedTools, isLoading: isLoadingOrder, saveOrder } = useToolOrder(filteredTools);

  const toolCounts = useMemo(() => {
    const counts: Record<ToolCategory | "all", number> = {
      all: tools.length,
      scripts: 0,
      convertisseurs: 0,
      commandes: 0,
      utilitaires: 0,
      génération: 0,
    };

    tools.forEach((tool) => {
      counts[tool.category]++;
    });

    return counts;
  }, []);

  // Gérer le changement d'ordre avec debounce
  const handleOrderChange = useCallback((toolIds: string[]) => {
    // Annuler le timeout précédent s'il existe
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Définir un nouveau timeout pour sauvegarder après 500ms
    saveTimeoutRef.current = setTimeout(() => {
      saveOrder(toolIds);
    }, 500);
  }, [saveOrder]);

  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev);
    if (isEditMode) {
      // Si on désactive le mode édition, annuler tout timeout en attente
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-10 lg:py-14">
        {/* Hero Section */}
        <section className="mb-14 animate-fade-in">
          <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:items-end mb-10">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary mb-4">/ workspace / index</p>
              <h2 className="max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[0.98]">
                Le bon outil,<br /><span className="gradient-text">au bon moment.</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mt-5 leading-relaxed">
                Une collection locale de scripts, références et petits utilitaires pour garder le travail en mouvement.
              </p>
            </div>
            <div className="border-l border-primary pl-5 pb-1">
              <p className="font-mono text-xs text-muted-foreground mb-2">SESSION NOTE</p>
              <p className="text-sm text-foreground leading-relaxed">{tools.length} outils prêts à l’emploi. Cherchez par nom, usage ou technologie.</p>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-primary"><ArrowUpRight className="w-3.5 h-3.5" /> Ouvrir un outil</div>
            </div>
          </div>

          <HomeDashboard />
        </section>

        {/* Search & Filters */}
        <section className="mb-8 space-y-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="w-full sm:max-w-xl"><SearchBar value={searchQuery} onChange={setSearchQuery} /></div>
            <div className="flex items-center gap-4">
              {isAuthenticated && (
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleEditMode}
                  className="flex items-center gap-2"
                >
                  {isEditMode ? (
                    <>
                      <Check className="w-4 h-4" />
                      Terminer
                    </>
                  ) : (
                    <>
                      <GripVertical className="w-4 h-4" />
                      Réorganiser
                    </>
                  )}
                </Button>
              )}
              <p className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                {filteredTools.length} outil{filteredTools.length !== 1 ? "s" : ""} trouvé{filteredTools.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            toolCounts={toolCounts}
          />
        </section>

        {/* Tools Grid */}
        <section className="border-t border-border pt-5">
          {filteredTools.length > 0 ? (
            <ToolGrid
              tools={orderedTools}
              isEditMode={isEditMode && isAuthenticated}
              onOrderChange={handleOrderChange}
            />
          ) : (
            <EmptyState searchQuery={searchQuery} />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-[11px] text-muted-foreground font-mono">
            DEVTOOLBOX / local utilities / 2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
