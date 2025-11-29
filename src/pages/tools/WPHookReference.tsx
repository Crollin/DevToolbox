import { useState, useMemo } from "react";
import { Search, Plus, Star, Link, Filter } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { tools } from "@/data/tools";
import { useWPHooks } from "@/hooks/useWPHooks";
import { WPHook } from "@/types/wphook";
import HookCard from "@/components/wphooks/HookCard";
import HookEditor from "@/components/wphooks/HookEditor";
import HookViewer from "@/components/wphooks/HookViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const WPHookReference = () => {
  const tool = tools.find((t) => t.id === "wp-hook-reference")!;

  const {
    hooks,
    categories,
    isLoaded,
    addHook,
    updateHook,
    deleteHook,
    toggleFavorite,
    addCategory,
    getHooksByCategory,
    getHooksByType,
    getFavorites,
  } = useWPHooks();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "favorites" | "all">("all");
  const [selectedType, setSelectedType] = useState<"action" | "filter" | "all">("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingHook, setEditingHook] = useState<WPHook | null>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingHook, setViewingHook] = useState<WPHook | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hookToDelete, setHookToDelete] = useState<string | null>(null);

  // Filter hooks
  const filteredHooks = useMemo(() => {
    let result = hooks;

    // Category filter
    if (selectedCategory === "favorites") {
      result = getFavorites();
    } else if (selectedCategory !== "all") {
      result = getHooksByCategory(selectedCategory);
    }

    // Type filter
    if (selectedType !== "all") {
      result = result.filter((hook) => hook.type === selectedType);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (hook) =>
          hook.name.toLowerCase().includes(query) ||
          hook.description.toLowerCase().includes(query) ||
          hook.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [hooks, selectedCategory, selectedType, searchQuery, getFavorites, getHooksByCategory]);

  // Count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: hooks.length, favorites: getFavorites().length };
    categories.forEach((cat) => {
      counts[cat] = getHooksByCategory(cat).length;
    });
    return counts;
  }, [hooks, categories, getFavorites, getHooksByCategory]);

  const handleEdit = (hook: WPHook) => {
    setEditingHook(hook);
    setEditorOpen(true);
  };

  const handleView = (hook: WPHook) => {
    setViewingHook(hook);
    setViewerOpen(true);
  };

  const handleDelete = (id: string) => {
    setHookToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (hookToDelete) {
      deleteHook(hookToDelete);
      toast({ title: "Hook supprimé" });
      setHookToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleSave = (data: Omit<WPHook, "id" | "createdAt" | "updatedAt">) => {
    if (editingHook) {
      updateHook(editingHook.id, data);
      toast({ title: "Hook mis à jour" });
    } else {
      addHook(data);
      toast({ title: "Hook ajouté" });
    }
    setEditingHook(null);
  };

  const handleCategorySelect = (cat: string | "favorites" | "all") => {
    setSelectedCategory(cat);
    setMobileFilterOpen(false);
  };

  const SidebarContent = () => (
    <nav className="space-y-1">
      {/* All */}
      <button
        onClick={() => handleCategorySelect("all")}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
          selectedCategory === "all"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <span className="flex items-center gap-2">
          <Link className="w-4 h-4" />
          Tous
        </span>
        <span className="text-xs opacity-60">{categoryCounts.all}</span>
      </button>

      {/* Favorites */}
      <button
        onClick={() => handleCategorySelect("favorites")}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
          selectedCategory === "favorites"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <span className="flex items-center gap-2">
          <Star className="w-4 h-4" />
          Favoris
        </span>
        <span className="text-xs opacity-60">{categoryCounts.favorites}</span>
      </button>

      {/* Categories */}
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => handleCategorySelect(cat)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
            selectedCategory === cat
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <span>{cat}</span>
          <span className="text-xs opacity-60">{categoryCounts[cat] || 0}</span>
        </button>
      ))}
    </nav>
  );

  if (!isLoaded) {
    return (
      <ToolLayout tool={tool}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout tool={tool}>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Référence des Hooks WordPress</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredHooks.length} hook{filteredHooks.length !== 1 ? "s" : ""} trouvé{filteredHooks.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
              <SheetTrigger asChild>
                <Button onClick={() => setEditingHook(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau hook
                </Button>
              </SheetTrigger>
              <HookEditor
                hook={editingHook}
                categories={categories}
                isOpen={editorOpen}
                onClose={() => {
                  setEditorOpen(false);
                  setEditingHook(null);
                }}
                onSave={handleSave}
                onAddCategory={addCategory}
              />
            </Sheet>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un hook..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Button
              variant={selectedType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("all")}
            >
              Tous
            </Button>
            <Button
              variant={selectedType === "action" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("action")}
            >
              Actions
            </Button>
            <Button
              variant={selectedType === "filter" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("filter")}
            >
              Filters
            </Button>
          </div>

          {/* Mobile Filter */}
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="sm:hidden">
                <Filter className="w-4 h-4 mr-2" />
                Catégories
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Catégories</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <SidebarContent />
              </ScrollArea>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {filteredHooks.length > 0 ? (
              <div className="space-y-3">
                {filteredHooks.map((hook) => (
                  <div
                    key={hook.id}
                    onClick={() => handleView(hook)}
                    className="cursor-pointer"
                  >
                    <HookCard
                      hook={hook}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleFavorite={toggleFavorite}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory !== "all" || selectedType !== "all"
                    ? "Aucun hook trouvé avec ces filtres"
                    : "Aucun hook enregistré"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hook Viewer */}
      <HookViewer hook={viewingHook} isOpen={viewerOpen} onClose={() => setViewerOpen(false)} />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le hook ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le hook sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ToolLayout>
  );
};

export default WPHookReference;

