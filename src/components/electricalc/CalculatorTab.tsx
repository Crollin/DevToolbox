import { useState, useMemo, useEffect } from "react";
import { Calculator, Zap, Clock, FileText, Car, Radio } from "lucide-react";
import { Tarif, Appareil, Calculation, isInHeuresCreuses } from "@/types/electricalc";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface CalculatorTabProps {
  tarifs: Tarif[];
  activeTarif: Tarif;
  appareils: Appareil[];
  onAddCalculation: (calc: Omit<Calculation, "id" | "date">) => void;
}

const CalculatorTab = ({ tarifs, activeTarif, appareils, onAddCalculation }: CalculatorTabProps) => {
  const [selectedAppareil, setSelectedAppareil] = useState<Appareil | null>(null);
  const [puissance, setPuissance] = useState<number>(100);
  const [duree, setDuree] = useState<number>(1);
  const [dureeUnit, setDureeUnit] = useState<"minutes" | "heures">("heures");
  const [tarifType, setTarifType] = useState<"hp" | "hc" | "mixte" | "auto">("hp");
  const [mixteRatio, setMixteRatio] = useState<number>(50);
  const [currentTarifMode, setCurrentTarifMode] = useState<"hp" | "hc">("hp");

  // EV specific
  const [chargeStart, setChargeStart] = useState<number>(20);
  const [chargeTarget, setChargeTarget] = useState<number>(80);
  const [efficiency, setEfficiency] = useState<number>(90);

  const isEV = selectedAppareil?.isEV || false;

  // Update auto detection every minute
  useEffect(() => {
    const updateAutoMode = () => {
      const isHC = isInHeuresCreuses(activeTarif);
      setCurrentTarifMode(isHC ? "hc" : "hp");
    };

    updateAutoMode();
    const interval = setInterval(updateAutoMode, 60000);
    return () => clearInterval(interval);
  }, [activeTarif]);

  const calculation = useMemo(() => {
    let consommationKwh: number;
    let dureeHeures: number;

    if (isEV && selectedAppareil?.batteryCapacity) {
      const energyNeeded = (selectedAppareil.batteryCapacity * (chargeTarget - chargeStart)) / 100;
      consommationKwh = energyNeeded / (efficiency / 100);
      dureeHeures = consommationKwh / (puissance / 1000);
    } else {
      dureeHeures = dureeUnit === "minutes" ? duree / 60 : duree;
      consommationKwh = (puissance / 1000) * dureeHeures;
    }

    let cout: number;
    const effectiveTarifType = tarifType === "auto" ? currentTarifMode : tarifType;

    if (effectiveTarifType === "hp") {
      cout = consommationKwh * activeTarif.heuresPleines;
    } else if (effectiveTarifType === "hc") {
      cout = consommationKwh * activeTarif.heuresCreuses;
    } else {
      const hpPart = consommationKwh * (mixteRatio / 100) * activeTarif.heuresPleines;
      const hcPart = consommationKwh * ((100 - mixteRatio) / 100) * activeTarif.heuresCreuses;
      cout = hpPart + hcPart;
    }

    return { consommationKwh, cout, dureeHeures };
  }, [puissance, duree, dureeUnit, tarifType, mixteRatio, activeTarif, isEV, selectedAppareil, chargeStart, chargeTarget, efficiency, currentTarifMode]);

  const handleSelectAppareil = (appareil: Appareil) => {
    setSelectedAppareil(appareil);
    setPuissance(appareil.puissance);
  };

  const handleSaveCalculation = () => {
    const calc: Omit<Calculation, "id" | "date"> = {
      appareilName: selectedAppareil?.name || "Manuel",
      puissance,
      duree: isEV ? Math.round(calculation.dureeHeures * 60) : duree,
      dureeUnit: isEV ? "minutes" : dureeUnit,
      tarifType: tarifType === "auto" ? currentTarifMode : tarifType,
      tarifName: activeTarif.name,
      consommationKwh: calculation.consommationKwh,
      cout: calculation.cout,
      isEV,
      evDetails: isEV && selectedAppareil?.batteryCapacity
        ? { batteryCapacity: selectedAppareil.batteryCapacity, chargeStart, chargeTarget, efficiency }
        : undefined,
    };
    onAddCalculation(calc);
    toast({ title: "Calcul enregistré", description: "Ajouté à l'historique." });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("ElectriCalc - Résultat", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Généré le ${new Date().toLocaleString("fr-FR")}`, 14, 28);

    doc.setTextColor(0);
    doc.setFontSize(14);
    let y = 45;

    doc.text(`Appareil : ${selectedAppareil?.name || "Manuel"}`, 14, y);
    y += 10;
    doc.text(`Puissance : ${puissance} W`, 14, y);
    y += 10;

    if (isEV && selectedAppareil?.batteryCapacity) {
      doc.text(`Batterie : ${selectedAppareil.batteryCapacity} kWh`, 14, y);
      y += 10;
      doc.text(`Charge : ${chargeStart}% → ${chargeTarget}%`, 14, y);
      y += 10;
      doc.text(`Efficacité : ${efficiency}%`, 14, y);
      y += 10;
      doc.text(`Temps de charge estimé : ${Math.floor(calculation.dureeHeures)}h ${Math.round((calculation.dureeHeures % 1) * 60)}min`, 14, y);
    } else {
      doc.text(`Durée : ${duree} ${dureeUnit}`, 14, y);
    }
    y += 10;

    const effectiveType = tarifType === "auto" ? `AUTO (${currentTarifMode.toUpperCase()})` : tarifType.toUpperCase();
    doc.text(`Tarif : ${activeTarif.name} (${effectiveType})`, 14, y);
    y += 15;

    doc.setFontSize(16);
    doc.setTextColor(6, 182, 212);
    doc.text(`Consommation : ${calculation.consommationKwh.toFixed(4)} kWh`, 14, y);
    y += 10;
    doc.text(`Coût : ${calculation.cout.toFixed(2)} €`, 14, y);

    doc.save(`electricalc-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "PDF exporté" });
  };

  // Format plages for display
  const plagesDisplay = activeTarif.plagesHC?.map(p => `${p.start}-${p.end}`).join(", ") || "";

  return (
    <div className="space-y-6">
      {/* Preset Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Sélectionner un appareil (optionnel)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
          {appareils.map((appareil) => (
            <button
              key={appareil.id}
              onClick={() => handleSelectAppareil(appareil)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm text-left border transition-all",
                selectedAppareil?.id === appareil.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/50",
                appareil.isEV && "border-l-2 border-l-emerald-500"
              )}
            >
              <div className="flex items-center gap-1.5">
                {appareil.isEV && <Car className="w-3 h-3 text-emerald-400" />}
                <span className="truncate">{appareil.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{appareil.puissance} W</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Puissance (W)
          </label>
          <div className="relative">
            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="number"
              value={puissance}
              onChange={(e) => setPuissance(Number(e.target.value))}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {!isEV && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Durée
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  value={duree}
                  onChange={(e) => setDuree(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <select
                value={dureeUnit}
                onChange={(e) => setDureeUnit(e.target.value as "minutes" | "heures")}
                className="px-3 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="minutes">min</option>
                <option value="heures">h</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* EV Specific */}
      {isEV && selectedAppareil?.batteryCapacity && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <Car className="w-4 h-4" />
            Mode Véhicule Électrique
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Charge départ (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={chargeStart}
                onChange={(e) => setChargeStart(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Charge cible (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={chargeTarget}
                onChange={(e) => setChargeTarget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Efficacité (%)</label>
              <input
                type="number"
                min="50"
                max="100"
                value={efficiency}
                onChange={(e) => setEfficiency(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tarif Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Type de tarif
        </label>
        <div className="flex gap-2 flex-wrap">
          {(["auto", "hp", "hc", "mixte"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTarifType(type)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                tarifType === type
                  ? type === "auto" 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {type === "auto" && <Radio className="w-3 h-3" />}
              {type === "auto" ? "Auto" : type === "hp" ? "Heures Pleines" : type === "hc" ? "Heures Creuses" : "Mixte"}
            </button>
          ))}
        </div>

        {tarifType === "auto" && (
          <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/30 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "w-2 h-2 rounded-full",
                currentTarifMode === "hc" ? "bg-emerald-400" : "bg-amber-400"
              )} />
              <span className="font-medium text-foreground">
                Actuellement : {currentTarifMode === "hc" ? "Heures Creuses" : "Heures Pleines"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Plages HC : {plagesDisplay || "Non définies"}
            </p>
          </div>
        )}

        {tarifType === "mixte" && (
          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-1">
              Ratio HP : {mixteRatio}% / HC : {100 - mixteRatio}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={mixteRatio}
              onChange={(e) => setMixteRatio(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        )}
      </div>

      {/* Results */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Résultat</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Consommation</p>
            <p className="text-2xl font-bold font-mono text-foreground">
              {calculation.consommationKwh.toFixed(4)} <span className="text-sm font-normal">kWh</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Coût estimé</p>
            <p className="text-2xl font-bold font-mono text-primary">
              {calculation.cout.toFixed(2)} <span className="text-sm font-normal">€</span>
            </p>
          </div>
        </div>
        {isEV && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">Temps de charge estimé</p>
            <p className="text-lg font-semibold text-foreground">
              {Math.floor(calculation.dureeHeures)}h {Math.round((calculation.dureeHeures % 1) * 60)}min
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSaveCalculation}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Enregistrer
        </button>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
        >
          <FileText className="w-4 h-4" />
          PDF
        </button>
      </div>
    </div>
  );
};

export default CalculatorTab;
