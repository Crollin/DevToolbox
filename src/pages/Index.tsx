import { useState, useMemo } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import ToolCard from "@/components/ToolCard";
import StatsBar from "@/components/StatsBar";
import EmptyState from "@/components/EmptyState";
import { tools, ToolCategory, categoryLabels } from "@/data/tools";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | "all">("all");

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

  const handleAddTool = () => {
    toast({
      title: "Fonctionnalité à venir",
      description: "L'ajout d'outils sera disponible dans une prochaine version.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onAddTool={handleAddTool} />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-10 animate-fade-in hero-background rounded-2xl p-8 sm:p-12 relative">
          <div className="text-center mb-8 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 animate-pulse-glow">
              Votre <span className="gradient-text">boîte à outils</span> dev
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Tous vos outils, scripts et utilitaires de développement centralisés en un seul endroit.
            </p>
          </div>

          {/* Stats */}
          <div className="relative z-10">
            <StatsBar 
              totalTools={tools.length} 
              totalCategories={Object.keys(categoryLabels).length} 
            />
          </div>
        </section>

        {/* Search & Filters */}
        <section className="mb-8 space-y-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <p className="text-sm text-muted-foreground">
              {filteredTools.length} outil{filteredTools.length !== 1 ? "s" : ""} trouvé{filteredTools.length !== 1 ? "s" : ""}
            </p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={index} />
              ))}
            </div>
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
