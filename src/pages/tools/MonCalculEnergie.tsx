import { useState } from "react";
import { Zap, Calculator, History, Settings } from "lucide-react";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { useElectriCalc } from "@/hooks/useElectriCalc";
import CalculatorTab from "@/components/electricalc/CalculatorTab";
import HistoryTab from "@/components/electricalc/HistoryTab";
import SettingsTab from "@/components/electricalc/SettingsTab";
import { cn } from "@/lib/utils";

type Tab = "calculator" | "history" | "settings";

const MonCalculEnergie = () => {
  const tool = tools.find((t) => t.id === "mon-calcul-energie")!;
  const [activeTab, setActiveTab] = useState<Tab>("calculator");

  const {
    settings,
    history,
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
  } = useElectriCalc();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "calculator", label: "Calculateur", icon: <Calculator className="w-4 h-4" /> },
    { id: "history", label: "Historique", icon: <History className="w-4 h-4" /> },
    { id: "settings", label: "Paramètres", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <ToolLayout tool={tool}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              ElectriCalc
            </h2>
            <p className="text-muted-foreground text-sm">
              Calculez votre consommation électrique • Tarif actif : {getActiveTarif().name}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "calculator" && (
            <CalculatorTab
              tarifs={settings.tarifs}
              activeTarif={getActiveTarif()}
              appareils={settings.appareils}
              onAddCalculation={addCalculation}
            />
          )}

          {activeTab === "history" && (
            <HistoryTab
              history={history}
              onExportCSV={exportHistoryCSV}
              onClear={clearHistory}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              tarifs={settings.tarifs}
              activeTarifId={settings.activeTarifId}
              appareils={settings.appareils}
              onAddTarif={addTarif}
              onUpdateTarif={updateTarif}
              onDeleteTarif={deleteTarif}
              onSetActiveTarif={setActiveTarif}
              onAddAppareil={addAppareil}
              onUpdateAppareil={updateAppareil}
              onDeleteAppareil={deleteAppareil}
            />
          )}
        </div>
      </div>
    </ToolLayout>
  );
};

export default MonCalculEnergie;
