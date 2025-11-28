import { useState } from "react";
import { Zap, Calculator, Lightbulb, Monitor, Tv, Fan } from "lucide-react";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { cn } from "@/lib/utils";

interface Appareil {
  id: string;
  nom: string;
  icon: React.ComponentType<{ className?: string }>;
  puissance: number;
  heuresParJour: number;
}

const defaultAppareils: Appareil[] = [
  { id: "1", nom: "Ampoule LED", icon: Lightbulb, puissance: 10, heuresParJour: 5 },
  { id: "2", nom: "Ordinateur", icon: Monitor, puissance: 150, heuresParJour: 8 },
  { id: "3", nom: "Télévision", icon: Tv, puissance: 100, heuresParJour: 4 },
  { id: "4", nom: "Ventilateur", icon: Fan, puissance: 50, heuresParJour: 6 },
];

const MonCalculEnergie = () => {
  const tool = tools.find((t) => t.id === "mon-calcul-energie")!;
  const [appareils, setAppareils] = useState<Appareil[]>(defaultAppareils);
  const [prixKwh, setPrixKwh] = useState(0.2276); // Prix moyen en France

  const updateAppareil = (id: string, field: "puissance" | "heuresParJour", value: number) => {
    setAppareils((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const calculerConso = (appareil: Appareil) => {
    return (appareil.puissance * appareil.heuresParJour) / 1000; // kWh par jour
  };

  const consoTotaleJour = appareils.reduce((acc, a) => acc + calculerConso(a), 0);
  const consoTotaleMois = consoTotaleJour * 30;
  const coutMensuel = consoTotaleMois * prixKwh;

  return (
    <ToolLayout tool={tool}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Calculateur Énergie</h2>
            <p className="text-muted-foreground text-sm">
              Estimez votre consommation et vos coûts énergétiques
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Conso/jour</span>
            </div>
            <p className="text-2xl font-bold text-foreground font-mono">
              {consoTotaleJour.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">kWh</span>
            </p>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-muted-foreground">Conso/mois</span>
            </div>
            <p className="text-2xl font-bold text-foreground font-mono">
              {consoTotaleMois.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">kWh</span>
            </p>
          </div>

          <div className="p-5 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                <span className="text-lg">€</span>
              </div>
              <span className="text-sm text-muted-foreground">Coût/mois</span>
            </div>
            <p className="text-2xl font-bold text-foreground font-mono">
              {coutMensuel.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">€</span>
            </p>
          </div>
        </div>

        {/* Prix kWh */}
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Prix du kWh</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={prixKwh}
                onChange={(e) => setPrixKwh(parseFloat(e.target.value) || 0)}
                step="0.01"
                className="w-24 px-3 py-1.5 rounded-lg bg-input border border-border text-right font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className="text-sm text-muted-foreground">€/kWh</span>
            </div>
          </div>
        </div>

        {/* Appareils */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Appareils</h3>
          {appareils.map((appareil) => {
            const IconComponent = appareil.icon;
            const consoJour = calculerConso(appareil);
            const coutJour = consoJour * prixKwh;

            return (
              <div
                key={appareil.id}
                className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <IconComponent className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">{appareil.nom}</h4>
                    <p className="text-xs text-muted-foreground">
                      {consoJour.toFixed(3)} kWh/jour • {coutJour.toFixed(2)} €/jour
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <label className="text-xs text-muted-foreground block mb-1">Puissance</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={appareil.puissance}
                          onChange={(e) => updateAppareil(appareil.id, "puissance", parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 rounded bg-input border border-border text-right font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <span className="text-xs text-muted-foreground">W</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <label className="text-xs text-muted-foreground block mb-1">Heures/jour</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={appareil.heuresParJour}
                          onChange={(e) => updateAppareil(appareil.id, "heuresParJour", parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 rounded bg-input border border-border text-right font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <span className="text-xs text-muted-foreground">h</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToolLayout>
  );
};

export default MonCalculEnergie;
