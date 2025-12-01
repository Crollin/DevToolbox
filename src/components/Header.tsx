import { Terminal, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  onAddTool?: () => void;
}

const Header = ({ onAddTool }: HeaderProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`border-b border-border/50 bg-background/70 backdrop-blur-2xl sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-lg shadow-primary/5 bg-background/90" : ""
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30">
                <Terminal className="w-5 h-5 text-primary transition-all duration-300 group-hover:scale-110" />
              </div>
              <div className="absolute -inset-1 bg-primary/20 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground font-mono tracking-tight">
                DevToolbox
              </h1>
              <p className="text-xs text-muted-foreground">
                Boîte à outils personnelle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onAddTool}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter un outil</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
