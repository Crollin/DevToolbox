import { useState } from "react";
import { Plus, Search, Heart, Layers, Grid3X3, RotateCcw } from "lucide-react";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { useSVGIcons } from "@/hooks/useSVGIcons";
import IconCard from "@/components/svgicons/IconCard";
import IconEditor from "@/components/svgicons/IconEditor";
import { SVGIcon } from "@/types/svgicon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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

const SVGIconLibrary = () => {
  const tool = tools.find((t) => t.id === "svg-icon-library")!;
  const {
    icons,
    categories,
    categoriesWithCounts,
    favoritesCount,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showFavoritesOnly,
    setShowFavoritesOnly,
    addIcon,
    updateIcon,
    deleteIcon,
    toggleFavorite,
    addCategory,
    resetToDefaults,
  } = useSVGIcons();

  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIcon, setEditingIcon] = useState<SVGIcon | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleEdit = (icon: SVGIcon) => {
    setEditingIcon(icon);
    setEditorOpen(true);
  };

  const handleAdd = () => {
    setEditingIcon(null);
    setEditorOpen(true);
  };

  const handleSave = (iconData: Omit<SVGIcon, "id" | "createdAt" | "updatedAt"> | Partial<SVGIcon>) => {
    if ("id" in iconData && iconData.id) {
      updateIcon(iconData.id, iconData);
      toast({
        title: "Icône modifiée",
        description: "Les modifications ont été enregistrées",
      });
    } else {
      addIcon(iconData as Omit<SVGIcon, "id" | "createdAt" | "updatedAt">);
      toast({
        title: "Icône ajoutée",
        description: "L'icône a été ajoutée à votre bibliothèque",
      });
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteIcon(deleteConfirmId);
      toast({
        title: "Icône supprimée",
        description: "L'icône a été supprimée de votre bibliothèque",
      });
      setDeleteConfirmId(null);
    }
  };

  const handleReset = () => {
    resetToDefaults();
    toast({
      title: "Bibliothèque réinitialisée",
      description: "Toutes les icônes par défaut ont été restaurées",
    });
  };

  return (
    <ToolLayout tool={tool}>
      <div className="flex gap-6 h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleAdd} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
            <Button onClick={handleReset} variant="outline" size="icon" title="Réinitialiser">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Filters */}
          <div className="space-y-1">
            {/* All */}
            <button
              onClick={() => {
                setSelectedCategory(null);
                setShowFavoritesOnly(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                !selectedCategory && !showFavoritesOnly
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
              <span>Toutes</span>
              <span className="ml-auto text-xs opacity-70">{icons.length}</span>
            </button>

            {/* Favorites */}
            <button
              onClick={() => {
                setSelectedCategory(null);
                setShowFavoritesOnly(true);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                showFavoritesOnly
                  ? "bg-rose-500/10 text-rose-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Heart className="w-4 h-4" />
              <span>Favoris</span>
              <span className="ml-auto text-xs opacity-70">{favoritesCount}</span>
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Layers className="w-3 h-3" />
              Catégories
            </div>
            {categoriesWithCounts.map((cat) => (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setShowFavoritesOnly(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  selectedCategory === cat.name
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <span className="truncate">{cat.name}</span>
                <span className="ml-auto text-xs opacity-70">{cat.count}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {icons.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Grid3X3 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? "Aucun résultat" : "Aucune icône"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchQuery
                  ? `Aucune icône ne correspond à "${searchQuery}"`
                  : "Ajoutez votre première icône à la bibliothèque"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {icons.map((icon) => (
                <IconCard
                  key={icon.id}
                  icon={icon}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Editor Modal */}
      <IconEditor
        icon={editingIcon}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        categories={categories}
        onAddCategory={addCategory}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'icône ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'icône sera définitivement supprimée
              de votre bibliothèque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ToolLayout>
  );
};

export default SVGIconLibrary;
