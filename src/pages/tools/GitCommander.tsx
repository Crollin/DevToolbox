import { useState } from "react";
import { Plus, Search, Heart, Layers, GitBranch, Terminal } from "lucide-react";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { useGitCommands } from "@/hooks/useGitCommands";
import GitCommandCard from "@/components/git/GitCommandCard";
import GitCommandEditor from "@/components/git/GitCommandEditor";
import { GitCommand } from "@/types/git";
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

const GitCommander = () => {
  const tool = tools.find((t) => t.id === "git-commander")!;
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
  } = useGitCommands();

  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<GitCommand | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleEdit = (command: GitCommand) => {
    setEditingCommand(command);
    setEditorOpen(true);
  };

  const handleAdd = () => {
    setEditingCommand(null);
    setEditorOpen(true);
  };

  const handleSave = (commandData: Omit<GitCommand, "id"> | GitCommand) => {
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

          {/* Add Button */}
          <Button onClick={handleAdd} className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une commande
          </Button>

          {/* Stats */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-muted-foreground">{allCommands.length} commandes</span>
            </div>
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
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <GitBranch className="w-4 h-4" />
              <span>Toutes</span>
              <span className="ml-auto text-xs opacity-70">{allCommands.length}</span>
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
            <div className="max-h-[calc(100vh-480px)] overflow-y-auto space-y-1">
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
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="ml-auto text-xs opacity-70">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {commands.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Terminal className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? "Aucun résultat" : "Aucune commande"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchQuery
                  ? `Aucune commande ne correspond à "${searchQuery}"`
                  : "Ajoutez votre première commande Git au glossaire"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {commands.map((command) => (
                <GitCommandCard
                  key={command.id}
                  command={command}
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
      <GitCommandEditor
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

export default GitCommander;
