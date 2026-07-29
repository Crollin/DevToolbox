import { Search } from "lucide-react";
import { useSearch } from "@/contexts/SearchContext";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface SearchTriggerProps {
  className?: string;
}

export function SearchTrigger({ className }: SearchTriggerProps) {
  const { openSearch } = useSearch();

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className={cn(
          "hidden sm:flex items-center gap-2 h-8 min-w-[200px] max-w-[240px] px-3 rounded-md border border-border bg-muted/40 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
          className
        )}
        aria-label="Ouvrir la recherche"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left truncate">Rechercher…</span>
        <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="sm:hidden h-8 w-8 p-0"
        onClick={openSearch}
        aria-label="Ouvrir la recherche"
      >
        <Search className="w-4 h-4" />
      </Button>
    </>
  );
}
