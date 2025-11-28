import { useState } from "react";
import { Copy, Download, Eye, Edit, Trash2, AlertTriangle } from "lucide-react";
import { WPScript } from "@/types/wpscript";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ScriptCardProps {
  script: WPScript;
  onEdit: (script: WPScript) => void;
  onDelete: (id: string) => void;
  onView: (script: WPScript) => void;
}

const languageColors: Record<string, { bg: string; text: string }> = {
  php: { bg: "bg-indigo-500/20", text: "text-indigo-400" },
  sh: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  bash: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
};

const difficultyColors: Record<string, { bg: string; text: string }> = {
  débutant: { bg: "bg-green-500/20", text: "text-green-400" },
  intermédiaire: { bg: "bg-amber-500/20", text: "text-amber-400" },
  avancé: { bg: "bg-red-500/20", text: "text-red-400" },
};

const ScriptCard = ({ script, onEdit, onDelete, onView }: ScriptCardProps) => {
  const [showActions, setShowActions] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(script.code);
    toast({ title: "Code copié !", description: script.name });
  };

  const handleDownload = () => {
    const ext = script.language === "php" ? "php" : "sh";
    const blob = new Blob([script.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.name.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Fichier téléchargé" });
  };

  const langColor = languageColors[script.language] || languageColors.php;
  const diffColor = difficultyColors[script.difficulty] || difficultyColors.débutant;

  return (
    <div
      className="group relative rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-200 overflow-hidden"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground line-clamp-1">{script.name}</h3>
          <span className={cn("px-2 py-0.5 rounded text-xs font-mono uppercase", langColor.bg, langColor.text)}>
            {script.language}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{script.description}</p>
      </div>

      {/* Code Preview */}
      <div className="relative">
        <pre className="p-4 text-xs font-mono text-muted-foreground bg-background/50 overflow-hidden h-24">
          <code className="line-clamp-5">{script.code}</code>
        </pre>
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent pointer-events-none" />
      </div>

      {/* Metadata */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {script.category}
          </Badge>
          <span className={cn("px-2 py-0.5 rounded text-xs", diffColor.bg, diffColor.text)}>
            {script.difficulty}
          </span>
          {script.wpVersionMin && (
            <span className="text-xs text-muted-foreground">WP {script.wpVersionMin}+</span>
          )}
        </div>

        <div className="flex gap-1 flex-wrap">
          {script.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
              {tag}
            </span>
          ))}
          {script.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-muted-foreground">+{script.tags.length - 3}</span>
          )}
        </div>

        {script.warnings && script.warnings.length > 0 && (
          <div className="flex items-center gap-1 text-amber-400 text-xs">
            <AlertTriangle className="w-3 h-3" />
            <span>Attention requise</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-card via-card to-transparent transition-opacity duration-200",
          showActions ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onView(script)}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            title="Voir"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            title="Copier"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground transition-colors"
            title="Télécharger"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(script)}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(script.id)}
            className="p-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScriptCard;
