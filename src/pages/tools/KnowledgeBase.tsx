import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ToolLayout from "@/components/ToolLayout";
import { tools } from "@/data/tools";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import {
  ExternalLink,
  Plus,
  Search,
  Star,
  Trash2,
  Settings,
  ChevronDown,
  Filter,
  Tag,
  Archive,
  BookOpen,
} from "lucide-react";

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

type Draft = {
  title: string;
  url: string;
  summary: string;
  content: string;
  categoryId: string | null;
  tagsText: string;
  isFavorite: boolean;
  status: "active" | "archived";
};

const emptyDraft: Draft = {
  title: "",
  url: "",
  summary: "",
  content: "",
  categoryId: null,
  tagsText: "",
  isFavorite: false,
  status: "active",
};

function parseTags(tagsText: string): string[] {
  return tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

const KnowledgeBase = () => {
  const tool = tools.find((t) => t.id === "knowledge-base")!;
  const loc = useLocation();
  const navigate = useNavigate();
  const params = useQueryParams();

  const {
    entries,
    categories,
    tags,
    isLoaded,
    refreshEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    markOpened,
  } = useKnowledgeBase();

  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "archived">("active");
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  // Prefill for bookmarklet flow
  useEffect(() => {
    const isNewFlow = loc.pathname.endsWith("/new");
    if (!isNewFlow) return;
    const url = params.get("url") || "";
    const title = params.get("title") || "";
    setEditingId(null);
    setDraft({ ...emptyDraft, url, title });
    setSheetOpen(true);
  }, [loc.pathname, params]);

  useEffect(() => {
    if (!isLoaded) return;
    refreshEntries({
      query,
      favorite: favoritesOnly ? true : undefined,
      categoryId: selectedCategoryId,
      tagIds: selectedTagIds.length ? selectedTagIds : undefined,
      status,
      sort: "updated_desc",
      page: 1,
      pageSize: 50,
    }).catch((e) => {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Erreur lors du chargement",
        variant: "destructive",
      });
    });
  }, [isLoaded, query, favoritesOnly, selectedCategoryId, selectedTagIds, status, refreshEntries]);

  // Sort entries: favorites first, then by original order
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });
  }, [entries]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setSheetOpen(true);
  };

  const openEdit = (id: string) => {
    const e = entries.find((x) => x.id === id);
    if (!e) return;
    setEditingId(id);
    setDraft({
      title: e.title,
      url: e.url || "",
      summary: e.summary || "",
      content: e.content || "",
      categoryId: e.categoryId,
      tagsText: (e.tags || []).map((t) => t.name).join(", "),
      isFavorite: e.isFavorite,
      status: e.status,
    });
    setSheetOpen(true);
  };

  const openExternal = async (id: string, url: string) => {
    try {
      await markOpened(id);
    } catch {
      // non bloquant
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const save = async () => {
    try {
      const payload = {
        title: draft.title,
        url: draft.url ? draft.url : null,
        summary: draft.summary ? draft.summary : null,
        content: draft.content ? draft.content : null,
        categoryId: draft.categoryId,
        tags: parseTags(draft.tagsText),
        isFavorite: draft.isFavorite,
        status: draft.status,
      };

      if (editingId) {
        await updateEntry(editingId, payload);
        toast({ title: "Entrée mise à jour" });
      } else {
        await createEntry(payload);
        toast({ title: "Entrée créée" });
      }

      setSheetOpen(false);
      if (loc.pathname.endsWith("/new")) {
        navigate("/tools/knowledge-base", { replace: true });
      }
      await refreshEntries({ query, status, favorite: favoritesOnly ? true : undefined, categoryId: selectedCategoryId, tagIds: selectedTagIds });
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Impossible de sauvegarder",
        variant: "destructive",
      });
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteEntry(id);
      toast({ title: "Entrée supprimée" });
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Impossible de supprimer",
        variant: "destructive",
      });
    }
  };

  const bookmarklet = useMemo(() => {
    return `javascript:(function(){var u=encodeURIComponent(location.href);var t=encodeURIComponent(document.title||'');window.open('/tools/knowledge-base/new?url='+u+'&title='+t,'_blank');})();`;
  }, []);

  const activeFilterCount = [
    favoritesOnly,
    selectedCategoryId !== null,
    selectedTagIds.length > 0,
  ].filter(Boolean).length;

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
      <div className="space-y-4">
        {/* Top bar: search + actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher (titre, URL, notes, tags)…"
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
              className="relative"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings((v) => !v)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Options
            </Button>
            <Button onClick={openCreate} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle entrée
            </Button>
          </div>
        </div>

        {/* Collapsible filters panel */}
        {showFilters && (
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtres
              </h3>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => {
                    setFavoritesOnly(false);
                    setSelectedCategoryId(null);
                    setSelectedTagIds([]);
                  }}
                >
                  Réinitialiser
                </Button>
              )}
            </div>

            {/* Status + Favorites row */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center rounded-lg border border-border overflow-hidden">
                <button
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    status === "active"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setStatus("active")}
                >
                  <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />
                  Actives
                </button>
                <button
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    status === "archived"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setStatus("archived")}
                >
                  <Archive className="w-3.5 h-3.5 inline mr-1.5" />
                  Archivées
                </button>
              </div>

              <Button
                variant={favoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setFavoritesOnly((v) => !v)}
                className="gap-1.5"
              >
                <Star className={`w-3.5 h-3.5 ${favoritesOnly ? "fill-current" : ""}`} />
                Favoris uniquement
              </Button>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Catégories</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant={selectedCategoryId === null ? "default" : "secondary"}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => setSelectedCategoryId(null)}
                  >
                    Toutes
                  </Badge>
                  {categories.slice(0, 12).map((c) => (
                    <Badge
                      key={c.id}
                      variant={selectedCategoryId === c.id ? "default" : "secondary"}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => setSelectedCategoryId(selectedCategoryId === c.id ? null : c.id)}
                    >
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.slice(0, 30).map((t) => (
                    <Badge
                      key={t.id}
                      variant={selectedTagIds.includes(t.id) ? "default" : "secondary"}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() =>
                        setSelectedTagIds((prev) =>
                          prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                        )
                      }
                    >
                      {t.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsible settings/bookmarklet */}
        {showSettings && (
          <Collapsible defaultOpen className="animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Options & Bookmarklet
                </h3>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">Bookmarklet</p>
                  <p className="text-xs text-muted-foreground">
                    Glisse ce lien dans ta barre de favoris, puis clique-le sur n'importe quelle page pour sauvegarder rapidement un lien.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(bookmarklet);
                      toast({ title: "Bookmarklet copié dans le presse-papiers" });
                    }}
                  >
                    Copier le bookmarklet
                  </Button>
                  <details className="mt-1">
                    <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      Voir le code
                    </summary>
                    <p className="mt-1 text-[11px] text-muted-foreground break-all font-mono bg-muted rounded p-2">
                      {bookmarklet}
                    </p>
                  </details>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sortedEntries.length} résultat{sortedEntries.length !== 1 ? "s" : ""}
            {favoritesOnly && " (favoris)"}
            {selectedCategoryId && ` • catégorie filtrée`}
            {selectedTagIds.length > 0 && ` • ${selectedTagIds.length} tag${selectedTagIds.length > 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Entries list */}
        <div className="rounded-xl border border-border bg-card">
          <ScrollArea className="h-[62vh]">
            <div className="divide-y divide-border">
              {sortedEntries.map((e) => (
                <div
                  key={e.id}
                  className={`p-4 hover:bg-muted/30 transition-colors ${
                    e.isFavorite ? "border-l-2 border-l-yellow-400/70" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {e.isFavorite && (
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
                        )}
                        <button
                          className="text-left font-medium text-foreground hover:text-primary hover:underline truncate transition-colors"
                          onClick={() => openEdit(e.id)}
                        >
                          {e.title}
                        </button>
                      </div>
                      {e.summary && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{e.summary}</p>
                      )}
                      {e.url && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <button
                            className="truncate hover:text-primary transition-colors"
                            onClick={() => openExternal(e.id, e.url!)}
                          >
                            {e.url}
                          </button>
                        </div>
                      )}
                      {(e.tags?.length ?? 0) > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {e.tags.slice(0, 6).map((t) => (
                            <Badge
                              key={t.id}
                              variant="secondary"
                              className="text-[11px] px-1.5 py-0"
                            >
                              {t.name}
                            </Badge>
                          ))}
                          {e.tags.length > 6 && (
                            <span className="text-[11px] text-muted-foreground">
                              +{e.tags.length - 6}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(e.id)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {sortedEntries.length === 0 && (
                <div className="p-12 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">Aucune entrée</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Crée ta première ressource pour commencer.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Edit/Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingId ? "Éditer l'entrée" : "Nouvelle entrée"}</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titre</label>
              <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">URL (optionnel)</label>
              <Input value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} placeholder="https://…" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Résumé (optionnel)</label>
              <Textarea value={draft.summary} onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Markdown)</label>
              <Textarea
                value={draft.content}
                onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                className="min-h-[180px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags (séparés par des virgules)</label>
              <Input value={draft.tagsText} onChange={(e) => setDraft((d) => ({ ...d, tagsText: e.target.value }))} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={draft.isFavorite ? "default" : "outline"}
                size="sm"
                onClick={() => setDraft((d) => ({ ...d, isFavorite: !d.isFavorite }))}
              >
                <Star className={`w-4 h-4 mr-2 ${draft.isFavorite ? "fill-current" : ""}`} />
                Favori
              </Button>
              <Button
                type="button"
                variant={draft.status === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setDraft((d) => ({ ...d, status: "active" }))}
              >
                Active
              </Button>
              <Button
                type="button"
                variant={draft.status === "archived" ? "default" : "outline"}
                size="sm"
                onClick={() => setDraft((d) => ({ ...d, status: "archived" }))}
              >
                Archivée
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSheetOpen(false)}>
                Annuler
              </Button>
              <Button onClick={save} disabled={!draft.title.trim()}>
                Sauvegarder
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </ToolLayout>
  );
};

export default KnowledgeBase;
