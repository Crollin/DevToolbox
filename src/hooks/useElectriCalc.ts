import { useState, useEffect, useCallback } from "react";
import {
  Tarif,
  Appareil,
  Calculation,
  ElectriCalcSettings,
  defaultTarifs,
  defaultAppareils,
} from "@/types/electricalc";
import api from "@/lib/api";
import {
  USE_API,
  isMigrationDone,
  markMigrationDone,
  loadFromLocalStorage,
  saveToLocalStorage,
} from "@/lib/apiStorage";

const SETTINGS_KEY = "electricalc-settings";
const HISTORY_KEY = "electricalc-history";
const MIGRATION_KEY = "migration_done_electricalc";
const MAX_HISTORY = 50;

const defaultSettings: ElectriCalcSettings = {
  tarifs: defaultTarifs,
  activeTarifId: "default",
  appareils: defaultAppareils,
};

interface ApiHistoryItem {
  id: number;
  calculation: Calculation;
  createdAt: string;
}

function mapApiHistory(items: ApiHistoryItem[]): Calculation[] {
  return items.map((h) => ({
    ...h.calculation,
    id: h.calculation.id || String(h.id),
    date: h.calculation.date || h.createdAt,
  }));
}

export function useElectriCalc() {
  const [settings, setSettings] = useState<ElectriCalcSettings>(defaultSettings);
  const [history, setHistory] = useState<Calculation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const persistLocal = useCallback((s: ElectriCalcSettings, h: Calculation[]) => {
    saveToLocalStorage(SETTINGS_KEY, s);
    saveToLocalStorage(HISTORY_KEY, h);
  }, []);

  const migrateToApi = useCallback(
    async (localSettings: ElectriCalcSettings, localHistory: Calculation[]) => {
      if (isMigrationDone(MIGRATION_KEY)) return;
      try {
        await api.put("/electricalc/settings", { settings: localSettings });
      } catch (e) {
        console.error("Migration electricalc settings:", e);
      }
      for (const calc of localHistory.slice(0, MAX_HISTORY)) {
        try {
          await api.post("/electricalc/history", { calculation: calc });
        } catch (e) {
          console.error("Migration electricalc history:", e);
        }
      }
      markMigrationDone(MIGRATION_KEY);
    },
    []
  );

  const syncSettings = useCallback(async (next: ElectriCalcSettings) => {
    if (USE_API) {
      try {
        await api.put("/electricalc/settings", { settings: next });
      } catch (e) {
        console.error("Sync electricalc settings:", e);
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (USE_API) {
        try {
          const [settingsData, historyData] = await Promise.all([
            api.get<{ settings: ElectriCalcSettings | null }>("/electricalc/settings"),
            api.get<{ history: ApiHistoryItem[] }>("/electricalc/history"),
          ]);

          let loadedSettings = settingsData.settings || defaultSettings;
          let loadedHistory = mapApiHistory(historyData.history || []);

          if (!settingsData.settings) {
            const localSettings = loadFromLocalStorage<ElectriCalcSettings | null>(SETTINGS_KEY, null);
            const localHistory = loadFromLocalStorage<Calculation[]>(HISTORY_KEY, []);
            if ((localSettings || localHistory.length > 0) && !isMigrationDone(MIGRATION_KEY)) {
              await migrateToApi(localSettings || defaultSettings, localHistory);
              const [refreshedSettings, refreshedHistory] = await Promise.all([
                api.get<{ settings: ElectriCalcSettings | null }>("/electricalc/settings"),
                api.get<{ history: ApiHistoryItem[] }>("/electricalc/history"),
              ]);
              loadedSettings = refreshedSettings.settings || defaultSettings;
              loadedHistory = mapApiHistory(refreshedHistory.history || []);
            } else if (!settingsData.settings) {
              await syncSettings(defaultSettings);
            }
          }

          setSettings(loadedSettings);
          setHistory(loadedHistory);
        } catch (error) {
          console.error("Erreur API electricalc:", error);
          setSettings(loadFromLocalStorage(SETTINGS_KEY, defaultSettings));
          setHistory(loadFromLocalStorage(HISTORY_KEY, []));
        }
      } else {
        setSettings(loadFromLocalStorage(SETTINGS_KEY, defaultSettings));
        setHistory(loadFromLocalStorage(HISTORY_KEY, []));
      }
      setIsLoaded(true);
    };
    void load();
  }, [migrateToApi, syncSettings]);

  useEffect(() => {
    if (!isLoaded || USE_API) return;
    persistLocal(settings, history);
  }, [settings, history, isLoaded, persistLocal]);

  const updateSettings = useCallback(
    (updater: (prev: ElectriCalcSettings) => ElectriCalcSettings) => {
      setSettings((prev) => {
        const next = updater(prev);
        void syncSettings(next);
        return next;
      });
    },
    [syncSettings]
  );

  const getActiveTarif = useCallback((): Tarif => {
    return settings.tarifs.find((t) => t.id === settings.activeTarifId) || settings.tarifs[0];
  }, [settings]);

  const addTarif = useCallback(
    (tarif: Omit<Tarif, "id">) => {
      const newTarif: Tarif = { ...tarif, id: crypto.randomUUID() };
      updateSettings((prev) => ({ ...prev, tarifs: [...prev.tarifs, newTarif] }));
      return newTarif;
    },
    [updateSettings]
  );

  const updateTarif = useCallback(
    (id: string, updates: Partial<Omit<Tarif, "id">>) => {
      updateSettings((prev) => ({
        ...prev,
        tarifs: prev.tarifs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    },
    [updateSettings]
  );

  const deleteTarif = useCallback(
    (id: string) => {
      updateSettings((prev) => ({
        ...prev,
        tarifs: prev.tarifs.filter((t) => t.id !== id),
        activeTarifId: prev.activeTarifId === id ? prev.tarifs[0]?.id || "" : prev.activeTarifId,
      }));
    },
    [updateSettings]
  );

  const setActiveTarif = useCallback(
    (id: string) => {
      updateSettings((prev) => ({ ...prev, activeTarifId: id }));
    },
    [updateSettings]
  );

  const addAppareil = useCallback(
    (appareil: Omit<Appareil, "id">) => {
      const newAppareil: Appareil = { ...appareil, id: crypto.randomUUID() };
      updateSettings((prev) => ({ ...prev, appareils: [...prev.appareils, newAppareil] }));
      return newAppareil;
    },
    [updateSettings]
  );

  const updateAppareil = useCallback(
    (id: string, updates: Partial<Omit<Appareil, "id">>) => {
      updateSettings((prev) => ({
        ...prev,
        appareils: prev.appareils.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      }));
    },
    [updateSettings]
  );

  const deleteAppareil = useCallback(
    (id: string) => {
      updateSettings((prev) => ({
        ...prev,
        appareils: prev.appareils.filter((a) => a.id !== id),
      }));
    },
    [updateSettings]
  );

  const addCalculation = useCallback(
    async (calculation: Omit<Calculation, "id" | "date">) => {
      const newCalc: Calculation = {
        ...calculation,
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
      };

      if (USE_API) {
        try {
          await api.post("/electricalc/history", { calculation: newCalc });
        } catch (e) {
          console.error("Ajout calcul electricalc:", e);
        }
      }

      setHistory((prev) => [newCalc, ...prev].slice(0, MAX_HISTORY));
      return newCalc;
    },
    []
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (!USE_API) saveToLocalStorage(HISTORY_KEY, []);
  }, []);

  const exportHistoryCSV = useCallback(() => {
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
  }, [history]);

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
