import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useAvailableTools } from "@/hooks/useAvailableTools";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  path: string;
  group: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<SearchResult[]>([]);
  const { isAuthenticated } = useAuth();
  const { availableTools } = useAvailableTools();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open || !isAuthenticated || query.length < 2) {
      setRemoteResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results: SearchResult[] = [];
      try {
        const [snippets, kb] = await Promise.all([
          api.get<{ snippets: Array<{ id: string; title: string; language: string }> }>("/snippets").catch(() => ({ snippets: [] })),
          api.get<{ entries: Array<{ id: string; title: string }> }>(`/kb/entries?q=${encodeURIComponent(query)}&limit=5`).catch(() => ({ entries: [] })),
        ]);

        for (const s of snippets.snippets?.filter((s) =>
          s.title.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5) || []) {
          results.push({
            id: `snippet-${s.id}`,
            title: s.title,
            subtitle: s.language,
            path: "/tools/code-snippet-library",
            group: "Snippets",
          });
        }

        for (const e of kb.entries || []) {
          results.push({
            id: `kb-${e.id}`,
            title: e.title,
            path: "/tools/knowledge-base",
            group: "Knowledge Base",
          });
        }
      } catch {
        // ignore
      }
      setRemoteResults(results);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, open, isAuthenticated]);

  const toolResults = useMemo(() => {
    if (!query) return availableTools.slice(0, 8);
    const q = query.toLowerCase();
    return availableTools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [query, availableTools]);

  const runCommand = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      navigate(path);
    },
    [navigate]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Rechercher un outil, snippet, entrée KB… (⌘K)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Outils">
          {toolResults.map((tool) => (
            <CommandItem
              key={tool.id}
              value={tool.name}
              onSelect={() => runCommand(`/tools/${tool.id}`)}
            >
              <span>{tool.name}</span>
              <span className="ml-auto text-xs text-muted-foreground truncate max-w-[200px]">
                {tool.description.slice(0, 40)}…
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        {remoteResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Contenu">
              {remoteResults.map((r) => (
                <CommandItem key={r.id} value={r.title} onSelect={() => runCommand(r.path)}>
                  <span>{r.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{r.group}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
