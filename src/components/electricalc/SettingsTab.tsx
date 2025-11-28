import { useState } from "react";
import { Plus, Trash2, Check, X, Car, Euro, Lightbulb } from "lucide-react";
import { Tarif, Appareil } from "@/types/electricalc";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface SettingsTabProps {
  tarifs: Tarif[];
  activeTarifId: string;
  appareils: Appareil[];
  onAddTarif: (tarif: Omit<Tarif, "id">) => void;
  onUpdateTarif: (id: string, updates: Partial<Omit<Tarif, "id">>) => void;
  onDeleteTarif: (id: string) => void;
  onSetActiveTarif: (id: string) => void;
  onAddAppareil: (appareil: Omit<Appareil, "id">) => void;
  onUpdateAppareil: (id: string, updates: Partial<Omit<Appareil, "id">>) => void;
  onDeleteAppareil: (id: string) => void;
}

const SettingsTab = ({
  tarifs,
  activeTarifId,
  appareils,
  onAddTarif,
  onUpdateTarif,
  onDeleteTarif,
  onSetActiveTarif,
  onAddAppareil,
  onUpdateAppareil,
  onDeleteAppareil,
}: SettingsTabProps) => {
  const [newTarif, setNewTarif] = useState({ name: "", hp: "", hc: "" });
  const [newAppareil, setNewAppareil] = useState({ name: "", puissance: "", isEV: false, batteryCapacity: "" });
  const [showAddTarif, setShowAddTarif] = useState(false);
  const [showAddAppareil, setShowAddAppareil] = useState(false);

  const activeTarif = tarifs.find((t) => t.id === activeTarifId);

  const handleAddTarif = () => {
    if (!newTarif.name || !newTarif.hp || !newTarif.hc) {
      toast({ title: "Erreur", description: "Remplissez tous les champs", variant: "destructive" });
      return;
    }
    onAddTarif({
      name: newTarif.name,
      heuresPleines: parseFloat(newTarif.hp),
      heuresCreuses: parseFloat(newTarif.hc),
    });
    setNewTarif({ name: "", hp: "", hc: "" });
    setShowAddTarif(false);
    toast({ title: "Tarif ajouté" });
  };

  const handleAddAppareil = () => {
    if (!newAppareil.name || !newAppareil.puissance) {
      toast({ title: "Erreur", description: "Remplissez le nom et la puissance", variant: "destructive" });
      return;
    }
    onAddAppareil({
      name: newAppareil.name,
      puissance: parseInt(newAppareil.puissance),
      isEV: newAppareil.isEV,
      batteryCapacity: newAppareil.isEV && newAppareil.batteryCapacity ? parseInt(newAppareil.batteryCapacity) : undefined,
    });
    setNewAppareil({ name: "", puissance: "", isEV: false, batteryCapacity: "" });
    setShowAddAppareil(false);
    toast({ title: "Appareil ajouté" });
  };

  const handleUpdateActiveTarifHP = (value: string) => {
    if (activeTarif) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        onUpdateTarif(activeTarif.id, { heuresPleines: numValue });
      }
    }
  };

  const handleUpdateActiveTarifHC = (value: string) => {
    if (activeTarif) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        onUpdateTarif(activeTarif.id, { heuresCreuses: numValue });
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Active Tarif Quick Edit */}
      {activeTarif && (
        <section className="p-5 rounded-xl bg-card border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Euro className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Tarifs par défaut</h3>
              <p className="text-xs text-muted-foreground">{activeTarif.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Tarif Heures Pleines (€/kWh)
              </label>
              <input
                type="number"
                step="0.0001"
                value={activeTarif.heuresPleines}
                onChange={(e) => handleUpdateActiveTarifHP(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Tarif Heures Creuses (€/kWh)
              </label>
              <input
                type="number"
                step="0.0001"
                value={activeTarif.heuresCreuses}
                onChange={(e) => handleUpdateActiveTarifHC(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Ces tarifs seront automatiquement utilisés dans le calculateur
          </div>
        </section>
      )}

      {/* Tarifs Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Tous les tarifs</h3>
          <button
            onClick={() => setShowAddTarif(!showAddTarif)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        {showAddTarif && (
          <div className="p-4 rounded-xl bg-card border border-border mb-4 space-y-3">
            <input
              type="text"
              placeholder="Nom du tarif"
              value={newTarif.name}
              onChange={(e) => setNewTarif({ ...newTarif, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">HP (€/kWh)</label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="0.2516"
                  value={newTarif.hp}
                  onChange={(e) => setNewTarif({ ...newTarif, hp: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">HC (€/kWh)</label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="0.2068"
                  value={newTarif.hc}
                  onChange={(e) => setNewTarif({ ...newTarif, hc: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddTarif} className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                <Check className="w-4 h-4 inline mr-1" /> Ajouter
              </button>
              <button onClick={() => setShowAddTarif(false)} className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {tarifs.map((tarif) => (
            <div
              key={tarif.id}
              className={cn(
                "p-3 rounded-lg border flex items-center justify-between gap-4",
                activeTarifId === tarif.id ? "bg-primary/10 border-primary/30" : "bg-card border-border/50"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{tarif.name}</span>
                  {tarif.isDefault && <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Défaut</span>}
                  {activeTarifId === tarif.id && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">Actif</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  HP: {tarif.heuresPleines.toFixed(4)} € • HC: {tarif.heuresCreuses.toFixed(4)} €
                </p>
              </div>
              <div className="flex items-center gap-1">
                {activeTarifId !== tarif.id && (
                  <button
                    onClick={() => onSetActiveTarif(tarif.id)}
                    className="px-2 py-1 rounded text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  >
                    Activer
                  </button>
                )}
                {!tarif.isDefault && (
                  <button
                    onClick={() => onDeleteTarif(tarif.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Appareils Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Appareils préréglés</h3>
          <button
            onClick={() => setShowAddAppareil(!showAddAppareil)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        {showAddAppareil && (
          <div className="p-4 rounded-xl bg-card border border-border mb-4 space-y-3">
            <input
              type="text"
              placeholder="Nom de l'appareil"
              value={newAppareil.name}
              onChange={(e) => setNewAppareil({ ...newAppareil, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm"
            />
            <input
              type="number"
              placeholder="Puissance (W)"
              value={newAppareil.puissance}
              onChange={(e) => setNewAppareil({ ...newAppareil, puissance: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNewAppareil({ ...newAppareil, isEV: !newAppareil.isEV })}
                className={cn(
                  "w-10 h-6 rounded-full transition-colors relative",
                  newAppareil.isEV ? "bg-emerald-500" : "bg-muted"
                )}
              >
                <span className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-foreground transition-transform",
                  newAppareil.isEV ? "translate-x-5" : "translate-x-1"
                )} />
              </button>
              <span className="text-sm text-foreground flex items-center gap-1.5">
                <Car className="w-4 h-4" /> Véhicule électrique
              </span>
            </div>
            {newAppareil.isEV && (
              <input
                type="number"
                placeholder="Capacité batterie (kWh)"
                value={newAppareil.batteryCapacity}
                onChange={(e) => setNewAppareil({ ...newAppareil, batteryCapacity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm"
              />
            )}
            <div className="flex gap-2">
              <button onClick={handleAddAppareil} className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                <Check className="w-4 h-4 inline mr-1" /> Ajouter
              </button>
              <button onClick={() => setShowAddAppareil(false)} className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {appareils.map((appareil) => (
            <div key={appareil.id} className="p-3 rounded-lg bg-card border border-border/50 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {appareil.isEV && <Car className="w-3 h-3 text-emerald-400" />}
                  <span className="font-medium text-foreground text-sm truncate">{appareil.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {appareil.puissance} W {appareil.batteryCapacity && `• ${appareil.batteryCapacity} kWh`}
                </p>
              </div>
              <button
                onClick={() => onDeleteAppareil(appareil.id)}
                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SettingsTab;
