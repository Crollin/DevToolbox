import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Licence, LicenceType, licenceTypeLabels } from "@/types/licence";
import { cn } from "@/lib/utils";

interface LicenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (licence: Omit<Licence, "id" | "createdAt">) => void;
  editLicence?: Licence | null;
}

const LicenceModal = ({ isOpen, onClose, onSave, editLicence }: LicenceModalProps) => {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [type, setType] = useState<LicenceType>("saas");
  const [isLifetime, setIsLifetime] = useState(false);
  const [renewalDate, setRenewalDate] = useState("");
  const [notes, setNotes] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (editLicence) {
      setName(editLicence.name);
      setKey(editLicence.key);
      setType(editLicence.type);
      setIsLifetime(editLicence.isLifetime);
      setRenewalDate(editLicence.renewalDate || "");
      setNotes(editLicence.notes || "");
      setNotificationsEnabled(editLicence.notificationsEnabled !== false);
    } else {
      setName("");
      setKey("");
      setType("saas");
      setIsLifetime(false);
      setRenewalDate("");
      setNotes("");
      setNotificationsEnabled(true);
    }
  }, [editLicence, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      key,
      type,
      isLifetime,
      renewalDate: isLifetime ? undefined : renewalDate || undefined,
      notes: notes || undefined,
      notificationsEnabled,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-xl animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {editLicence ? "Modifier la licence" : "Nouvelle licence"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nom de la licence *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Adobe Creative Cloud"
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Clé */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Clé de licence *
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(licenceTypeLabels) as LicenceType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                    type === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-muted-foreground"
                  )}
                >
                  {licenceTypeLabels[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Lifetime */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsLifetime(!isLifetime)}
              className={cn(
                "w-10 h-6 rounded-full transition-colors relative",
                isLifetime ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-foreground transition-transform",
                  isLifetime ? "translate-x-5" : "translate-x-1"
                )}
              />
            </button>
            <span className="text-sm text-foreground">Licence lifetime (illimitée)</span>
          </div>

          {/* Date de renouvellement */}
          {!isLifetime && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Date de renouvellement
              </label>
              <input
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Informations supplémentaires..."
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Notifications */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
            <div>
              <span className="text-sm text-foreground">Activer les notifications d'expiration</span>
              <p className="text-xs text-muted-foreground">Recevoir des alertes pour cette licence</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              {editLicence ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LicenceModal;
