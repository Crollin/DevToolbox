import { useState, useEffect } from "react";
import { X, Bell, Send, Loader2 } from "lucide-react";
import { NtfyConfig, Licence } from "@/types/licence";
import { getLicenceStatus, getDaysUntilRenewal } from "./LicenceStatusBadge";
import { toast } from "@/hooks/use-toast";

interface NtfyModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: NtfyConfig;
  onSave: (config: Partial<NtfyConfig>) => void;
  licences: Licence[];
}

const NtfyModal = ({ isOpen, onClose, config, onSave, licences }: NtfyModalProps) => {
  const [serverUrl, setServerUrl] = useState(config.serverUrl);
  const [topic, setTopic] = useState(config.topic);
  const [token, setToken] = useState(config.token || "");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setServerUrl(config.serverUrl);
    setTopic(config.topic);
    setToken(config.token || "");
  }, [config, isOpen]);

  const licencesToRenew = licences.filter((l) => {
    const status = getLicenceStatus(l);
    return status === "expired" || status === "warning";
  });

  const handleSave = () => {
    onSave({ serverUrl, topic, token: token || undefined, enabled: true });
    toast({
      title: "Configuration sauvegardée",
      description: "Les paramètres ntfy ont été mis à jour.",
    });
  };

  const sendNotification = async () => {
    if (!topic) {
      toast({
        title: "Erreur",
        description: "Veuillez configurer un topic ntfy.",
        variant: "destructive",
      });
      return;
    }

    if (licencesToRenew.length === 0) {
      toast({
        title: "Aucune alerte",
        description: "Aucune licence ne nécessite de renouvellement.",
      });
      return;
    }

    setIsSending(true);

    const expiredCount = licencesToRenew.filter((l) => getLicenceStatus(l) === "expired").length;
    const warningCount = licencesToRenew.filter((l) => getLicenceStatus(l) === "warning").length;

    const message = licencesToRenew
      .map((l) => {
        const days = getDaysUntilRenewal(l);
        if (days !== null && days < 0) {
          return `❌ ${l.name} - Expirée depuis ${Math.abs(days)} jours`;
        }
        return `⚠️ ${l.name} - ${days} jours restants`;
      })
      .join("\n");

    try {
      const headers: Record<string, string> = {
        "Content-Type": "text/plain",
        Title: `🔑 Licences à renouveler (${licencesToRenew.length})`,
        Priority: expiredCount > 0 ? "high" : "default",
        Tags: expiredCount > 0 ? "warning,key" : "key",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${serverUrl}/${topic}`, {
        method: "POST",
        headers,
        body: message,
      });

      if (response.ok) {
        toast({
          title: "Notification envoyée",
          description: `${licencesToRenew.length} alerte(s) envoyée(s) via ntfy.`,
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      toast({
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer la notification. Vérifiez votre configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-xl animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Notifications ntfy</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Alert count */}
          <div className="p-3 rounded-lg bg-muted border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{licencesToRenew.length}</span> licence(s) à renouveler (expirées ou &lt;30 jours)
            </p>
          </div>

          {/* Server URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              URL du serveur ntfy
            </label>
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://ntfy.sh"
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Topic *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="mon-topic-licences"
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Token */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Token d'authentification (optionnel)
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="tk_..."
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
            >
              Sauvegarder
            </button>
            <button
              type="button"
              onClick={sendNotification}
              disabled={isSending || !topic}
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NtfyModal;
