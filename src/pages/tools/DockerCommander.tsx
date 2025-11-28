import { useState } from "react";
import { Plus, Search, Heart, Layers, Container, Box, Filter } from "lucide-react";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { useDockerCommands } from "@/hooks/useDockerCommands";
import DockerCommandCard from "@/components/docker/DockerCommandCard";
import DockerCommandEditor from "@/components/docker/DockerCommandEditor";
import { DockerCommand } from "@/types/docker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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

const DockerCommander = () => {
  const tool = tools.find((t) => t.id === "docker-commander")!;
  const {
    commands,
    allCommands,
    categories,
    categoriesWithCounts,
    favoritesCount,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showFavoritesOnly,
    setShowFavoritesOnly,
    addCommand,
    updateCommand,
    deleteCommand,
    toggleFavorite,
    addCategory,
  } = useDockerCommands();

  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<DockerCommand | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const handleEdit = (command: DockerCommand) => {
    setEditingCommand(command);
    setEditorOpen(true);
  };

  const handleAdd = () => {
    setEditingCommand(null);
    setEditorOpen(true);
  };

  const handleSave = (commandData: Omit<DockerCommand, "id"> | DockerCommand) => {
    if ("id" in commandData) {
      updateCommand(commandData.id, commandData);
      toast({
        title: "Commande modifiée",
        description: "Les modifications ont été enregistrées",
      });
    } else {
      addCommand(commandData);
      toast({
        title: "Commande ajoutée",
        description: "La commande a été ajoutée au glossaire",
      });
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteCommand(deleteConfirmId);
      toast({
        title: "Commande supprimée",
        description: "La commande a été supprimée du glossaire",
      });
      setDeleteConfirmId(null);
    }
  };

  const handleFilterSelect = (category: string | null, favorites: boolean) => {
    setSelectedCategory(category);
    setShowFavoritesOnly(favorites);
    setMobileFilterOpen(false);
  };

  const SidebarContent = () => (
    <div className="space-y-4">
      {/* Stats */}
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <Container className="w-4 h-4 text-sky-400" />
          <span className="text-muted-foreground">{allCommands.length} commandes</span>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-1">
        {/* All */}
        <button
          onClick={() => handleFilterSelect(null, false)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            !selectedCategory && !showFavoritesOnly
              ? "bg-sky-500/10 text-sky-400"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Box className="w-4 h-4" />
          <span>Toutes</span>
          <span className="ml-auto text-xs opacity-70">{allCommands.length}</span>
        </button>

        {/* Favorites */}
        <button
          onClick={() => handleFilterSelect(null, true)}
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
        <div className="max-h-[calc(100vh-400px)] overflow-y-auto space-y-1">
          {categoriesWithCounts.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleFilterSelect(cat.name, false)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                selectedCategory === cat.name
                  ? "bg-sky-500/10 text-sky-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <span className="truncate">{cat.name}</span>
              <span className="ml-auto text-xs opacity-70">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <ToolLayout tool={tool}>
      <div className="flex gap-6 h-[calc(100vh-120px)]">
        {/* Desktop Sidebar */}
        <aside className="w-64 shrink-0 space-y-4 hidden md:block">
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

          {/* Add Button */}
          <Button onClick={handleAdd} className="w-full bg-sky-600 hover:bg-sky-700">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une commande
          </Button>

          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-hidden">
          {/* Mobile Header */}
          <div className="flex gap-2 mb-4 md:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="pl-9"
              />
            </div>
            
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Filter className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <Button 
                    onClick={() => {
                      handleAdd();
                      setMobileFilterOpen(false);
                    }} 
                    className="w-full bg-sky-600 hover:bg-sky-700 mb-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une commande
                  </Button>
                  <SidebarContent />
                </div>
              </SheetContent>
            </Sheet>

            <Button onClick={handleAdd} className="shrink-0 bg-sky-600 hover:bg-sky-700">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Results info */}
          <div className="text-sm text-muted-foreground mb-4 md:hidden">
            {commands.length} commande{commands.length !== 1 ? "s" : ""}
            {(selectedCategory || showFavoritesOnly) && (
              <span className="ml-2 text-xs bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full">
                {showFavoritesOnly ? "Favoris" : selectedCategory}
              </span>
            )}
          </div>

          {/* Commands Grid */}
          <div className="h-[calc(100vh-200px)] md:h-full overflow-y-auto">
            {commands.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Container className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery ? "Aucun résultat" : "Aucune commande"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {searchQuery
                    ? `Aucune commande ne correspond à "${searchQuery}"`
                    : "Ajoutez votre première commande Docker au glossaire"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
                {commands.map((command) => (
                  <DockerCommandCard
                    key={command.id}
                    command={command}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Editor Modal */}
      <DockerCommandEditor
        command={editingCommand}
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
            <AlertDialogTitle>Supprimer la commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La commande sera définitivement
              supprimée du glossaire.
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

export default DockerCommander;