import { useState, useMemo, useCallback, useRef } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import ToolGrid from "@/components/ToolGrid";
import StatsBar from "@/components/StatsBar";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { GripVertical, Check } from "lucide-react";
import { tools, ToolCategory, categoryLabels } from "@/data/tools";
import { useToolOrder } from "@/hooks/useToolOrder";
import { useAuth } from "@/contexts/AuthContext";

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

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-10 animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Votre <span className="gradient-text">boîte à outils</span> dev
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Tous vos outils, scripts et utilitaires de développement centralisés en un seul endroit.
            </p>
          </div>

          {/* Stats */}
          <StatsBar 
            totalTools={tools.length} 
            totalCategories={Object.keys(categoryLabels).length} 
          />
        </section>

        {/* Search & Filters */}
        <section className="mb-8 space-y-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
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
              <p className="text-sm text-muted-foreground">
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
        <section>
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
          <p className="text-center text-xs text-muted-foreground">
            DevToolbox — Boîte à outils personnelle pour développeurs
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
