import { useState, useMemo } from "react";
import { Search, Plus, Filter, X, Code2 } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { tools } from "@/data/tools";
import { useWPScripts } from "@/hooks/useWPScripts";
import { WPScript } from "@/types/wpscript";
import ScriptCard from "@/components/wpscripts/ScriptCard";
import ScriptEditor from "@/components/wpscripts/ScriptEditor";
import ScriptViewer from "@/components/wpscripts/ScriptViewer";
import ImportExportPanel from "@/components/wpscripts/ImportExportPanel";
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

const WPScriptLibrary = () => {
  const tool = tools.find((t) => t.id === "wp-script-library")!;
  
  const {
    scripts,
    isLoaded,
    getAllCategories,
    getAllTags,
    addScript,
    updateScript,
    deleteScript,
    importScripts,
    exportScripts,
    addCategory,
    addTag,
  } = useWPScripts();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<WPScript | null>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingScript, setViewingScript] = useState<WPScript | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scriptToDelete, setScriptToDelete] = useState<string | null>(null);

  const categories = getAllCategories();
  const tags = getAllTags();

  // Filter scripts
  const filteredScripts = useMemo(() => {
    return scripts.filter((script) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          script.name.toLowerCase().includes(query) ||
          script.description.toLowerCase().includes(query) ||
          script.code.toLowerCase().includes(query) ||
          script.tags.some((t) => t.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // Category filter
      if (selectedCategory && script.category !== selectedCategory) {
        return false;
      }

      // Language filter
      if (selectedLanguage && script.language !== selectedLanguage) {
        return false;
      }

      // Tags filter
      if (selectedTags.length > 0 && !selectedTags.some((t) => script.tags.includes(t))) {
        return false;
      }

      return true;
    });
  }, [scripts, searchQuery, selectedCategory, selectedLanguage, selectedTags]);

  const handleEdit = (script: WPScript) => {
    setEditingScript(script);
    setEditorOpen(true);
  };

  const handleView = (script: WPScript) => {
    setViewingScript(script);
    setViewerOpen(true);
  };

  const handleDelete = (id: string) => {
    setScriptToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (scriptToDelete) {
      deleteScript(scriptToDelete);
      toast({ title: "Script supprimé" });
      setScriptToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleSave = (scriptData: Omit<WPScript, "id" | "createdAt" | "updatedAt">) => {
    if (editingScript) {
      updateScript(editingScript.id, scriptData);
      toast({ title: "Script mis à jour" });
    } else {
      addScript(scriptData);
      toast({ title: "Script créé" });
    }
    setEditingScript(null);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTags([]);
    setSelectedLanguage(null);
    setSearchQuery("");
  };

  const hasActiveFilters = selectedCategory || selectedTags.length > 0 || selectedLanguage || searchQuery;

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
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un script..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "bg-primary/10 border-primary")}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <ImportExportPanel onImport={importScripts} onExport={exportScripts} />
            <Button onClick={() => setEditorOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">Filtres</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>

            {/* Language */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Langage</label>
              <div className="flex gap-2">
                {["php", "sh", "bash"].map((lang) => (
                  <Button
                    key={lang}
                    variant={selectedLanguage === lang ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLanguage(selectedLanguage === lang ? null : lang)}
                  >
                    {lang.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Catégorie</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 15).map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {filteredScripts.length} script{filteredScripts.length !== 1 ? "s" : ""} trouvé
          {filteredScripts.length !== 1 ? "s" : ""}
        </div>

        {/* Scripts Grid */}
        {filteredScripts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredScripts.map((script) => (
              <ScriptCard
                key={script.id}
                script={script}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Code2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Aucun script trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? "Modifiez vos filtres ou créez un nouveau script"
                : "Commencez par créer ou importer des scripts"}
            </p>
            <Button onClick={() => setEditorOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un script
            </Button>
          </div>
        )}
      </div>

      {/* Script Editor */}
      <ScriptEditor
        script={editingScript}
        categories={categories}
        tags={tags}
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingScript(null);
        }}
        onSave={handleSave}
        onAddCategory={addCategory}
        onAddTag={addTag}
      />

      {/* Script Viewer */}
      <ScriptViewer
        script={viewingScript}
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewingScript(null);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce script ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le script sera définitivement supprimé.
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

export default WPScriptLibrary;
