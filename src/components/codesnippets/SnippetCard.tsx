import { Copy, Edit, Trash2, Eye, Power, Download } from "lucide-react";
import { CodeSnippet, languageLabels, scopeLabels } from "@/types/codesnippet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface SnippetCardProps {
  snippet: CodeSnippet;
  onEdit: (snippet: CodeSnippet) => void;
  onDelete: (id: string) => void;
  onView: (snippet: CodeSnippet) => void;
  onToggleActive: (id: string) => void;
}

const languageColors: Record<string, string> = {
  php: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  javascript: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  css: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  html: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  sql: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  bash: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  python: "bg-green-500/20 text-green-300 border-green-500/30",
  json: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const SnippetCard = ({ snippet, onEdit, onDelete, onView, onToggleActive }: SnippetCardProps) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      toast({ title: "Code copié !" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de copier", variant: "destructive" });
    }
  };

  const handleDownload = () => {
    const ext = snippet.language === "javascript" ? "js" : snippet.language;
    const blob = new Blob([snippet.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${snippet.title.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        "group p-3 sm:p-4 rounded-xl bg-card border transition-all hover:shadow-lg hover:border-primary/30",
        snippet.active ? "border-border" : "border-border/50 opacity-70"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge
              variant="outline"
              className={cn("text-xs shrink-0", languageColors[snippet.language])}
            >
              {languageLabels[snippet.language]}
            </Badge>
            {snippet.folder && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {snippet.folder}
              </Badge>
            )}
          </div>
          <h3 className="font-medium text-foreground text-sm sm:text-base line-clamp-1">
            {snippet.title}
          </h3>
        </div>
        <Button
          variant={snippet.active ? "default" : "outline"}
          size="icon"
          className={cn(
            "h-7 w-7 sm:h-8 sm:w-8 shrink-0",
            snippet.active && "bg-emerald-500 hover:bg-emerald-600"
          )}
          onClick={() => onToggleActive(snippet.id)}
        >
          <Power className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* Description */}
      {snippet.description && (
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3">
          {snippet.description}
        </p>
      )}

      {/* Code Preview */}
      <div className="relative mb-2 sm:mb-3">
        <pre className="p-2 sm:p-3 rounded-lg bg-muted/50 text-xs overflow-hidden max-h-20 sm:max-h-24 font-mono text-muted-foreground">
          {snippet.code.slice(0, 200)}
          {snippet.code.length > 200 && "..."}
        </pre>
      </div>

      {/* Scope & Priority - Hidden on mobile */}
      <div className="hidden sm:flex items-center gap-2 mb-3 text-xs text-muted-foreground">
        <span>{scopeLabels[snippet.scope]}</span>
        <span>•</span>
        <span>Priorité: {snippet.priority}</span>
        {snippet.runOnce && (
          <>
            <span>•</span>
            <span className="text-amber-400">Exécution unique</span>
          </>
        )}
      </div>

      {/* Tags - Fewer on mobile */}
      {snippet.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
          {snippet.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-primary/10 text-primary"
            >
              {tag}
            </span>
          ))}
          {snippet.tags.length > 2 && (
            <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-muted text-muted-foreground">
              +{snippet.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 pt-2 sm:pt-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 h-7 sm:h-8 text-xs"
          onClick={() => onView(snippet)}
        >
          <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
          <span className="hidden sm:inline">Voir</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 h-7 sm:h-8 text-xs"
          onClick={handleCopy}
        >
          <Copy className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
          <span className="hidden sm:inline">Copier</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 sm:h-8 text-xs hidden sm:flex"
          onClick={handleDownload}
        >
          <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          Fichier
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 sm:h-8 sm:w-8"
          onClick={() => onEdit(snippet)}
        >
          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(snippet.id)}
        >
          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>
    </div>
  );
};

export default SnippetCard;
