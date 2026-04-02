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
import { toast } from "@/hooks/use-toast";
import { ExternalLink, Plus, Search, Star, Trash2 } from "lucide-react";

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
  tagsText: string; // comma separated
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

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  // Prefill for bookmarklet flow: /tools/knowledge-base/new?url=...&title=...
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
      // Si on venait du flow /new, revenir à la liste
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
    // Le front est servi à la racine; en prod, adapte si tu as un sous-path.
    return `javascript:(function(){var u=encodeURIComponent(location.href);var t=encodeURIComponent(document.title||'');window.open('/tools/knowledge-base/new?url='+u+'&title='+t,'_blank');})();`;
  }, []);

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
            <Button variant={favoritesOnly ? "default" : "outline"} onClick={() => setFavoritesOnly((v) => !v)}>
              <Star className="w-4 h-4 mr-2" />
              Favoris
            </Button>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle entrée
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant={status === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus("active")}
            >
              Actives
            </Button>
            <Button
              variant={status === "archived" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus("archived")}
            >
              Archivées
            </Button>

            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant={selectedCategoryId === null ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setSelectedCategoryId(null)}
              >
                Toutes les catégories
              </Badge>
              {categories.slice(0, 12).map((c) => (
                <Badge
                  key={c.id}
                  variant={selectedCategoryId === c.id ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategoryId(selectedCategoryId === c.id ? null : c.id)}
                >
                  {c.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {entries.length} résultat{entries.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card">
              <ScrollArea className="h-[60vh]">
                <div className="divide-y divide-border">
                  {entries.map((e) => (
                    <div key={e.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button
                            className="text-left font-medium text-foreground hover:underline truncate"
                            onClick={() => openEdit(e.id)}
                          >
                            {e.title}
                          </button>
                          {e.url && (
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="truncate">{e.url}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openExternal(e.id, e.url!)}
                                aria-label="Ouvrir le lien"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          {(e.tags?.length ?? 0) > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {e.tags.slice(0, 8).map((t) => (
                                <Badge
                                  key={t.id}
                                  variant={selectedTagIds.includes(t.id) ? "default" : "secondary"}
                                  className="cursor-pointer"
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
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {e.isFavorite && <Star className="w-4 h-4 text-yellow-400" />}
                          <Button variant="ghost" size="icon" onClick={() => remove(e.id)} aria-label="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {entries.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      Aucune entrée. Crée ta première ressource.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-1">Bookmarklet (MVP)</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Glisse ce lien dans ta barre de favoris, puis clique-le sur n’importe quelle page.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(bookmarklet);
                    toast({ title: "Bookmarklet copié" });
                  }}
                >
                  Copier le bookmarklet
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground break-all">{bookmarklet}</p>
            </div>

            <div className="pt-2 border-t border-border">
              <h3 className="text-sm font-medium text-foreground mb-2">Tags disponibles</h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 30).map((t) => (
                  <Badge
                    key={t.id}
                    variant={selectedTagIds.includes(t.id) ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedTagIds((prev) =>
                        prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                      )
                    }
                  >
                    {t.name}
                  </Badge>
                ))}
                {tags.length === 0 && <p className="text-xs text-muted-foreground">Aucun tag pour le moment.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingId ? "Éditer l’entrée" : "Nouvelle entrée"}</SheetTitle>
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
                <Star className="w-4 h-4 mr-2" />
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

