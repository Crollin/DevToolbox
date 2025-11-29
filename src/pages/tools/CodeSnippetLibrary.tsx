import { useState, useMemo } from "react";
import { Search, Plus, Filter, X, Code2, FolderOpen } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { tools } from "@/data/tools";
import { useCodeSnippets } from "@/hooks/useCodeSnippets";
import { CodeSnippet, languageLabels, SnippetLanguage } from "@/types/codesnippet";
import SnippetCard from "@/components/codesnippets/SnippetCard";
import SnippetEditor from "@/components/codesnippets/SnippetEditor";
import SnippetViewer from "@/components/codesnippets/SnippetViewer";
import SnippetImportExport from "@/components/codesnippets/SnippetImportExport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const CodeSnippetLibrary = () => {
  const tool = tools.find((t) => t.id === "code-snippet-library")!;

  const {
    snippets,
    isLoaded,
    getAllFolders,
    getAllTags,
    addSnippet,
    updateSnippet,
    deleteSnippet,
    toggleSnippetActive,
    importSnippets,
    exportToWPCodeBox,
    exportNative,
    addFolder,
    addTag,
  } = useCodeSnippets();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<SnippetLanguage | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CodeSnippet | null>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingSnippet, setViewingSnippet] = useState<CodeSnippet | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snippetToDelete, setSnippetToDelete] = useState<string | null>(null);

  const folders = getAllFolders();
  const tags = getAllTags();

  // Filter snippets
  const filteredSnippets = useMemo(() => {
    return snippets.filter((snippet) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          snippet.title.toLowerCase().includes(query) ||
          snippet.description.toLowerCase().includes(query) ||
          snippet.code.toLowerCase().includes(query) ||
          snippet.tags.some((t) => t.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // Folder filter
      if (selectedFolder && snippet.folder !== selectedFolder) {
        return false;
      }

      // Language filter
      if (selectedLanguage && snippet.language !== selectedLanguage) {
        return false;
      }

      // Tags filter
      if (selectedTags.length > 0 && !selectedTags.some((t) => snippet.tags.includes(t))) {
        return false;
      }

      // Active filter
      if (showActiveOnly && !snippet.active) {
        return false;
      }

      return true;
    });
  }, [snippets, searchQuery, selectedFolder, selectedLanguage, selectedTags, showActiveOnly]);

  const handleEdit = (snippet: CodeSnippet) => {
    setEditingSnippet(snippet);
    setEditorOpen(true);
  };

  const handleView = (snippet: CodeSnippet) => {
    setViewingSnippet(snippet);
    setViewerOpen(true);
  };

  const handleDelete = (id: string) => {
    setSnippetToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (snippetToDelete) {
      deleteSnippet(snippetToDelete);
      toast({ title: "Snippet supprimé" });
      setSnippetToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleSave = (snippetData: Omit<CodeSnippet, "id" | "createdAt" | "updatedAt">) => {
    if (editingSnippet) {
      updateSnippet(editingSnippet.id, snippetData);
      toast({ title: "Snippet mis à jour" });
    } else {
      addSnippet(snippetData);
      toast({ title: "Snippet créé" });
    }
    setEditingSnippet(null);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedFolder(null);
    setSelectedTags([]);
    setSelectedLanguage(null);
    setShowActiveOnly(false);
    setSearchQuery("");
  };

  const hasActiveFilters = selectedFolder || selectedTags.length > 0 || selectedLanguage || showActiveOnly || searchQuery;
  const activeFiltersCount = [selectedFolder, selectedLanguage, showActiveOnly].filter(Boolean).length + selectedTags.length;

  // Filter sidebar content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Active Filter */}
      <div>
        <Button
          variant={showActiveOnly ? "default" : "outline"}
          size="sm"
          className="w-full justify-start"
          onClick={() => setShowActiveOnly(!showActiveOnly)}
        >
          Actifs uniquement
        </Button>
      </div>

      {/* Languages */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Langage</h4>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(languageLabels) as SnippetLanguage[]).map((lang) => (
            <Button
              key={lang}
              variant={selectedLanguage === lang ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLanguage(selectedLanguage === lang ? null : lang)}
            >
              {languageLabels[lang]}
            </Button>
          ))}
        </div>
      </div>

      {/* Folders */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Dossiers</h4>
        <div className="space-y-1">
          {folders.map((folder) => (
            <Button
              key={folder}
              variant={selectedFolder === folder ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => setSelectedFolder(selectedFolder === folder ? null : folder)}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              {folder}
            </Button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Tags</h4>
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 20).map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "secondary"}
              className="cursor-pointer text-xs"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
          <X className="w-4 h-4 mr-1" />
          Réinitialiser les filtres
        </Button>
      )}
    </div>
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
      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 p-4 rounded-xl bg-card border border-border">
            <h3 className="font-medium text-foreground mb-4">Filtres</h3>
            <FilterContent />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Filter className="w-4 h-4" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                  <FilterContent />
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <Button size="icon" onClick={() => setEditorOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un snippet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <SnippetImportExport
                onImport={importSnippets}
                onExportWPCodeBox={exportToWPCodeBox}
                onExportNative={exportNative}
              />
              <Button onClick={() => setEditorOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau
              </Button>
            </div>
          </div>

          {/* Mobile Import/Export */}
          <div className="lg:hidden">
            <SnippetImportExport
              onImport={importSnippets}
              onExportWPCodeBox={exportToWPCodeBox}
              onExportNative={exportNative}
            />
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            {filteredSnippets.length} snippet{filteredSnippets.length !== 1 ? "s" : ""} trouvé
            {filteredSnippets.length !== 1 ? "s" : ""}
            {snippets.filter(s => s.active).length > 0 && (
              <span className="ml-2">
                ({snippets.filter(s => s.active).length} actif{snippets.filter(s => s.active).length !== 1 ? "s" : ""})
              </span>
            )}
          </div>

          {/* Snippets Grid */}
          {filteredSnippets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSnippets.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onToggleActive={toggleSnippetActive}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Code2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucun snippet trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Modifiez vos filtres ou créez un nouveau snippet"
                  : "Commencez par créer ou importer des snippets"}
              </p>
              <Button onClick={() => setEditorOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un snippet
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Snippet Editor */}
      <SnippetEditor
        snippet={editingSnippet}
        folders={folders}
        tags={tags}
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingSnippet(null);
        }}
        onSave={handleSave}
        onAddFolder={addFolder}
        onAddTag={addTag}
      />

      {/* Snippet Viewer */}
      <SnippetViewer
        snippet={viewingSnippet}
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewingSnippet(null);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce snippet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le snippet sera définitivement supprimé.
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

export default CodeSnippetLibrary;
