import { Search, Command } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search 
          className={cn(
            "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-all duration-300",
            isFocused && "text-primary scale-110",
            value && "text-primary/80"
          )} 
        />
        <input
          type="text"
          placeholder="Rechercher un outil..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="search-input search-focus-glow pr-20"
        />
        {isFocused && (
          <div className="absolute inset-0 rounded-lg bg-primary/5 border-2 border-primary/30 pointer-events-none animate-glow-pulse" />
        )}
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
        <kbd className={cn(
          "px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px] transition-all duration-300",
          isFocused && "bg-primary/10 border-primary/30 text-primary"
        )}>
          <Command className="w-2.5 h-2.5 inline" />
        </kbd>
        <kbd className={cn(
          "px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px] transition-all duration-300",
          isFocused && "bg-primary/10 border-primary/30 text-primary"
        )}>
          K
        </kbd>
      </div>
      {value && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-1 h-4 bg-primary rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default SearchBar;
