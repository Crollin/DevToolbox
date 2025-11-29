import { Copy, Download, X } from "lucide-react";
import { CodeSnippet, languageLabels, scopeLabels } from "@/types/codesnippet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SnippetViewerProps {
  snippet: CodeSnippet | null;
  isOpen: boolean;
  onClose: () => void;
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

const SnippetViewer = ({ snippet, isOpen, onClose }: SnippetViewerProps) => {
  if (!snippet) return null;

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
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl p-0 overflow-hidden">
        <SheetHeader className="px-4 sm:px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("text-xs", languageColors[snippet.language])}>
                {languageLabels[snippet.language]}
              </Badge>
              {snippet.folder && (
                <Badge variant="secondary" className="text-xs">
                  {snippet.folder}
                </Badge>
              )}
              <Badge variant={snippet.active ? "default" : "outline"} className="text-xs">
                {snippet.active ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </div>
          <SheetTitle className="text-left">{snippet.title}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Description */}
            {snippet.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                <p className="text-sm text-foreground">{snippet.description}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Scope</h4>
                <p className="text-sm text-foreground">{scopeLabels[snippet.scope]}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Priorité</h4>
                <p className="text-sm text-foreground">{snippet.priority}</p>
              </div>
              {snippet.runOnce && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Mode</h4>
                  <p className="text-sm text-amber-400">Exécution unique</p>
                </div>
              )}
            </div>

            {/* Tags */}
            {snippet.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {snippet.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Code */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-muted-foreground">Code</h4>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copier
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-1" />
                    Fichier
                  </Button>
                </div>
              </div>
              <pre className="p-3 sm:p-4 rounded-xl bg-muted/50 border border-border overflow-x-auto">
                <code className="text-xs sm:text-sm font-mono text-foreground whitespace-pre">
                  {snippet.code}
                </code>
              </pre>
            </div>

            {/* Dates */}
            <div className="pt-4 border-t border-border text-xs text-muted-foreground">
              <p>Créé le: {new Date(snippet.createdAt).toLocaleDateString("fr-FR")}</p>
              <p>Modifié le: {new Date(snippet.updatedAt).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default SnippetViewer;
