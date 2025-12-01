import { Copy, ExternalLink } from "lucide-react";
import { WPHook, hookTypeColors } from "@/types/wphook";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HookViewerProps {
  hook: WPHook | null;
  isOpen: boolean;
  onClose: () => void;
}

const HookViewer = ({ hook, isOpen, onClose }: HookViewerProps) => {
  if (!hook) return null;

  const typeColors = hookTypeColors[hook.type];

  const copyHook = () => {
    navigator.clipboard.writeText(hook.name);
    toast({ title: "Nom du hook copié" });
  };

  const copyExample = () => {
    navigator.clipboard.writeText(hook.example);
    toast({ title: "Exemple copié" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <code className="font-mono text-lg text-primary bg-primary/10 px-3 py-1.5 rounded">
              {hook.name}
            </code>
            <Button variant="ghost" size="icon" onClick={copyHook}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <DialogTitle className="pt-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn(typeColors.bg, typeColors.text)}>
                {hook.type === "action" ? "Action" : "Filter"}
              </Badge>
              <span className="text-sm text-muted-foreground">{hook.category}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">{hook.description}</p>
          </div>

          {/* Tags */}
          {hook.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {hook.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Example */}
          {hook.example && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Exemple</h3>
                <Button variant="ghost" size="sm" onClick={copyExample}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </Button>
              </div>
              <pre className="text-sm font-mono bg-muted p-3 rounded border border-border overflow-x-auto">
                {hook.example}
              </pre>
            </div>
          )}

          {/* Parameters */}
          {hook.parameters && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Paramètres</h3>
              <pre className="text-sm font-mono bg-muted p-3 rounded border border-border overflow-x-auto whitespace-pre-wrap">
                {hook.parameters}
              </pre>
            </div>
          )}

          {/* Version Info */}
          <div className="flex items-center gap-4 text-sm">
            {hook.since && (
              <div>
                <span className="text-muted-foreground">Depuis: </span>
                <span className="font-medium">{hook.since}</span>
              </div>
            )}
            {hook.deprecated && (
              <div className="text-destructive">
                <span className="text-muted-foreground">Déprécié: </span>
                <span className="font-medium">{hook.deprecated}</span>
              </div>
            )}
          </div>

          {/* Documentation Link */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(
                  `https://developer.wordpress.org/reference/hooks/${hook.name}/`,
                  "_blank"
                );
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Documentation WordPress
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HookViewer;


