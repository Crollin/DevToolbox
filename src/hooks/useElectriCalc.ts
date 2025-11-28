import { useState, useEffect } from "react";
import {
  Tarif,
  Appareil,
  Calculation,
  ElectriCalcSettings,
  defaultTarifs,
  defaultAppareils,
} from "@/types/electricalc";

const SETTINGS_KEY = "electricalc-settings";
const HISTORY_KEY = "electricalc-history";
const MAX_HISTORY = 50;

export function useElectriCalc() {
  const [settings, setSettings] = useState<ElectriCalcSettings>({
    tarifs: defaultTarifs,
    activeTarifId: "default",
    appareils: defaultAppareils,
  });
  const [history, setHistory] = useState<Calculation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    const storedHistory = localStorage.getItem(HISTORY_KEY);

    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }

    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    setIsLoaded(true);
  }, []);

  // Save settings
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  // Save history
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }, [history, isLoaded]);

  const getActiveTarif = (): Tarif => {
    return settings.tarifs.find((t) => t.id === settings.activeTarifId) || settings.tarifs[0];
  };

  const addTarif = (tarif: Omit<Tarif, "id">) => {
    const newTarif: Tarif = { ...tarif, id: crypto.randomUUID() };
    setSettings((prev) => ({ ...prev, tarifs: [...prev.tarifs, newTarif] }));
    return newTarif;
  };

  const updateTarif = (id: string, updates: Partial<Omit<Tarif, "id">>) => {
    setSettings((prev) => ({
      ...prev,
      tarifs: prev.tarifs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const deleteTarif = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      tarifs: prev.tarifs.filter((t) => t.id !== id),
      activeTarifId: prev.activeTarifId === id ? prev.tarifs[0]?.id || "" : prev.activeTarifId,
    }));
  };

  const setActiveTarif = (id: string) => {
    setSettings((prev) => ({ ...prev, activeTarifId: id }));
  };

  const addAppareil = (appareil: Omit<Appareil, "id">) => {
    const newAppareil: Appareil = { ...appareil, id: crypto.randomUUID() };
    setSettings((prev) => ({ ...prev, appareils: [...prev.appareils, newAppareil] }));
    return newAppareil;
  };

  const updateAppareil = (id: string, updates: Partial<Omit<Appareil, "id">>) => {
    setSettings((prev) => ({
      ...prev,
      appareils: prev.appareils.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  };

  const deleteAppareil = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      appareils: prev.appareils.filter((a) => a.id !== id),
    }));
  };

  const addCalculation = (calculation: Omit<Calculation, "id" | "date">) => {
    const newCalc: Calculation = {
      ...calculation,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    setHistory((prev) => [newCalc, ...prev].slice(0, MAX_HISTORY));
    return newCalc;
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const exportHistoryCSV = () => {
    const headers = [
      "Date",
      "Appareil",
      "Puissance (W)",
      "Durée",
      "Type tarif",
      "Consommation (kWh)",
      "Coût (€)",
    ];
    const rows = history.map((c) => [
      new Date(c.date).toLocaleString("fr-FR"),
      c.appareilName,
      c.puissance,
      `${c.duree} ${c.dureeUnit}`,
      c.tarifType.toUpperCase(),
      c.consommationKwh.toFixed(4),
      c.cout.toFixed(2),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `electricalc-historique-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    settings,
    history,
    isLoaded,
    getActiveTarif,
    addTarif,
    updateTarif,
    deleteTarif,
    setActiveTarif,
    addAppareil,
    updateAppareil,
    deleteAppareil,
    addCalculation,
    clearHistory,
    exportHistoryCSV,
  };
}
