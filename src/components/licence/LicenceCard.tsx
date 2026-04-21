import { useState } from "react";
import { Key, Eye, EyeOff, Copy, Check, Pencil, Trash2, StickyNote, BellOff, Users } from "lucide-react";
import { Licence, licenceTypeLabels, licenceTypeColors } from "@/types/licence";
import LicenceStatusBadge from "./LicenceStatusBadge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface LicenceCardProps {
  licence: Licence;
  onEdit: (licence: Licence) => void;
  onDelete: (id: string) => void;
}

const LicenceCard = ({ licence, onEdit, onDelete }: LicenceCardProps) => {
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const colors = licenceTypeColors[licence.type];

  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(licence.key);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({
      title: "Clé copiée",
      description: `La clé de ${licence.name} a été copiée.`,
    });
  };

  const handleDelete = () => {
    if (confirm(`Supprimer la licence "${licence.name}" ?`)) {
      onDelete(licence.id);
      toast({
        title: "Licence supprimée",
        description: `${licence.name} a été supprimée.`,
      });
    }
  };

  return (
    <div className="group p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            colors.bg, colors.border, "border"
          )}>
            <Key className={cn("w-5 h-5", colors.text)} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-foreground">{licence.name}</h3>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium border",
                colors.bg, colors.text, colors.border
              )}>
                {licenceTypeLabels[licence.type]}
              </span>
              <LicenceStatusBadge licence={licence} />
              {licence.notificationsEnabled === false && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border" title="Notifications désactivées">
                  <BellOff className="w-3 h-3" />
                </span>
              )}
            </div>

            {/* Key */}
            <div className="flex items-center gap-2 mt-2">
              <code className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                {isKeyVisible ? licence.key : maskKey(licence.key)}
              </code>
              <button
                onClick={() => setIsKeyVisible(!isKeyVisible)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                title={isKeyVisible ? "Masquer" : "Afficher"}
              >
                {isKeyVisible ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={copyKey}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isCopied ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-muted text-muted-foreground"
                )}
                title="Copier"
              >
                {isCopied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Notes */}
            {licence.notes && (
              <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{licence.notes}</span>
              </div>
            )}

            {licence.seatCount && (
              <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                <Users className="w-3 h-3" />
                <span>{licence.seatCount} siège{licence.seatCount > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(licence)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LicenceCard;
