import { Copy, Download, X, AlertTriangle, Clock, User, Tag } from "lucide-react";
import { WPScript } from "@/types/wpscript";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ScriptViewerProps {
  script: WPScript | null;
  isOpen: boolean;
  onClose: () => void;
}

const languageColors: Record<string, { bg: string; text: string; label: string }> = {
  php: { bg: "bg-indigo-500/20", text: "text-indigo-400", label: "PHP" },
  sh: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Shell" },
  bash: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Bash" },
};

const difficultyColors: Record<string, { bg: string; text: string }> = {
  débutant: { bg: "bg-green-500/20", text: "text-green-400" },
  intermédiaire: { bg: "bg-amber-500/20", text: "text-amber-400" },
  avancé: { bg: "bg-red-500/20", text: "text-red-400" },
};

const ScriptViewer = ({ script, isOpen, onClose }: ScriptViewerProps) => {
  if (!script) return null;

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">{script.name}</DialogTitle>
              <p className="text-muted-foreground mt-1">{script.description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("px-3 py-1 rounded-full text-sm font-mono", langColor.bg, langColor.text)}>
              {langColor.label}
            </span>
            <Badge variant="outline">{script.category}</Badge>
            <span className={cn("px-2 py-1 rounded text-sm", diffColor.bg, diffColor.text)}>
              {script.difficulty}
            </span>
            {script.wpVersionMin && (
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                WP {script.wpVersionMin}{script.wpVersionMax ? ` - ${script.wpVersionMax}` : "+"}
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-muted-foreground" />
            {script.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm">
                {tag}
              </span>
            ))}
          </div>

          {/* Code block with dark theme */}
          <div className="relative rounded-lg overflow-hidden border border-border">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
              <span className="text-sm text-zinc-400 font-mono">{script.language}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 text-zinc-400 hover:text-white">
                  <Copy className="w-4 h-4 mr-1" />
                  Copier
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDownload} className="h-7 text-zinc-400 hover:text-white">
                  <Download className="w-4 h-4 mr-1" />
                  Télécharger
                </Button>
              </div>
            </div>
            <pre className="p-4 bg-zinc-950 overflow-x-auto">
              <code className="text-sm font-mono text-zinc-100 whitespace-pre">{script.code}</code>
            </pre>
          </div>

          {/* Instructions */}
          {script.instructions && (
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Instructions</h4>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap">{script.instructions}</pre>
              </div>
            </div>
          )}

          {/* Dependencies */}
          {script.dependencies && script.dependencies.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Dépendances</h4>
              <div className="flex flex-wrap gap-2">
                {script.dependencies.map((dep) => (
                  <span key={dep} className="px-3 py-1 rounded bg-accent/20 text-accent-foreground text-sm font-mono">
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {script.warnings && script.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Avertissements
              </h4>
              <div className="space-y-2">
                {script.warnings.map((warning, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm"
                  >
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Author & Date */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{script.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Mis à jour le {new Date(script.updatedAt).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScriptViewer;
