import { Search, Command } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="Rechercher un outil..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="search-input pr-20"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">
          <Command className="w-2.5 h-2.5 inline" />
        </kbd>
        <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">
          K
        </kbd>
      </div>
    </div>
  );
};

export default SearchBar;
