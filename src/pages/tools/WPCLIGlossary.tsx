import { useState, useMemo } from "react";
import { Search, Plus, Star, Terminal, Filter } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { tools } from "@/data/tools";
import { useWPCLI } from "@/hooks/useWPCLI";
import { WPCLICommand } from "@/types/wpcli";
import CommandCard from "@/components/wpcli/CommandCard";
import CommandEditor from "@/components/wpcli/CommandEditor";
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

const WPCLIGlossary = () => {
  const tool = tools.find((t) => t.id === "wpcli-glossary")!;

  const {
    commands,
    categories,
    isLoaded,
    addCommand,
    updateCommand,
    deleteCommand,
    toggleFavorite,
    addCategory,
    getCommandsByCategory,
    getFavorites,
  } = useWPCLI();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "favorites" | "all">("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<WPCLICommand | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commandToDelete, setCommandToDelete] = useState<string | null>(null);

  // Filter commands
  const filteredCommands = useMemo(() => {
    let result = commands;

    // Category filter
    if (selectedCategory === "favorites") {
      result = getFavorites();
    } else if (selectedCategory !== "all") {
      result = getCommandsByCategory(selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (cmd) =>
          cmd.command.toLowerCase().includes(query) ||
          cmd.description.toLowerCase().includes(query) ||
          cmd.notes.toLowerCase().includes(query)
      );
    }

    return result;
  }, [commands, selectedCategory, searchQuery, getFavorites, getCommandsByCategory]);

  // Count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: commands.length, favorites: getFavorites().length };
    categories.forEach((cat) => {
      counts[cat] = getCommandsByCategory(cat).length;
    });
    return counts;
  }, [commands, categories, getFavorites, getCommandsByCategory]);

  const handleEdit = (command: WPCLICommand) => {
    setEditingCommand(command);
    setEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    setCommandToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (commandToDelete) {
      deleteCommand(commandToDelete);
      toast({ title: "Commande supprimée" });
      setCommandToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleSave = (data: Omit<WPCLICommand, "id" | "createdAt" | "updatedAt">) => {
    if (editingCommand) {
      updateCommand(editingCommand.id, data);
      toast({ title: "Commande mise à jour" });
    } else {
      addCommand(data);
      toast({ title: "Commande ajoutée" });
    }
    setEditingCommand(null);
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
          <Terminal className="w-4 h-4" />
          Toutes
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

      <div className="h-px bg-border my-2" />

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
          <span className="truncate">{cat}</span>
          <span className="text-xs opacity-60">{categoryCounts[cat] || 0}</span>
        </button>
      ))}
    </nav>
  );

  if (!isLoaded) {
    return (
      <ToolLayout tool={tool}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout tool={tool}>
      <div className="flex gap-6 h-[calc(100vh-140px)]">
        {/* Desktop Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="sticky top-0">
            <Button
              onClick={() => setEditorOpen(true)}
              className="w-full mb-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle commande
            </Button>

            <ScrollArea className="h-[calc(100vh-220px)]">
              <SidebarContent />
            </ScrollArea>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une commande..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Mobile Filter Button */}
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden shrink-0">
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
                      setEditorOpen(true);
                      setMobileFilterOpen(false);
                    }}
                    className="w-full mb-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle commande
                  </Button>
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <SidebarContent />
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>

            <Button className="md:hidden shrink-0" onClick={() => setEditorOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground mb-4">
            {filteredCommands.length} commande{filteredCommands.length !== 1 ? "s" : ""}
            {selectedCategory !== "all" && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {selectedCategory === "favorites" ? "Favoris" : selectedCategory}
              </span>
            )}
          </div>

          {/* Commands List */}
          <ScrollArea className="h-[calc(100vh-240px)] md:h-[calc(100vh-220px)]">
            {filteredCommands.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pr-4">
                {filteredCommands.map((cmd) => (
                  <CommandCard
                    key={cmd.id}
                    command={cmd}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Terminal className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Aucune commande trouvée
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Essayez avec d'autres termes"
                    : "Commencez par ajouter une commande"}
                </p>
                <Button onClick={() => setEditorOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une commande
                </Button>
              </div>
            )}
          </ScrollArea>
        </main>
      </div>

      {/* Command Editor */}
      <CommandEditor
        command={editingCommand}
        categories={categories}
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingCommand(null);
        }}
        onSave={handleSave}
        onAddCategory={addCategory}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ToolLayout>
  );
};

export default WPCLIGlossary;