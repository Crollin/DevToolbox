import { useMemo } from "react";
import { History, Download, Trash2, TrendingUp, TrendingDown, Minus, Car } from "lucide-react";
import { Calculation } from "@/types/electricalc";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface HistoryTabProps {
  history: Calculation[];
  onExportCSV: () => void;
  onClear: () => void;
}

const HistoryTab = ({ history, onExportCSV, onClear }: HistoryTabProps) => {
  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const totalKwh = history.reduce((sum, c) => sum + c.consommationKwh, 0);
    const totalCout = history.reduce((sum, c) => sum + c.cout, 0);
    const avgKwh = totalKwh / history.length;
    const avgCout = totalCout / history.length;

    // Trend (compare last 5 vs previous 5)
    const recent = history.slice(0, 5);
    const previous = history.slice(5, 10);
    let trend: "up" | "down" | "stable" = "stable";
    if (recent.length > 0 && previous.length > 0) {
      const recentAvg = recent.reduce((s, c) => s + c.cout, 0) / recent.length;
      const prevAvg = previous.reduce((s, c) => s + c.cout, 0) / previous.length;
      if (recentAvg > prevAvg * 1.1) trend = "up";
      else if (recentAvg < prevAvg * 0.9) trend = "down";
    }

    return { totalKwh, totalCout, avgKwh, avgCout, trend };
  }, [history]);

  const chartData = useMemo(() => {
    const monthlyData: Record<string, { kWh: number; cout: number; count: number }> = {};

    history.forEach((c) => {
      const month = new Date(c.date).toLocaleDateString("fr-FR", { year: "numeric", month: "short" });
      if (!monthlyData[month]) {
        monthlyData[month] = { kWh: 0, cout: 0, count: 0 };
      }
      monthlyData[month].kWh += c.consommationKwh;
      monthlyData[month].cout += c.cout;
      monthlyData[month].count++;
    });

    return Object.entries(monthlyData)
      .reverse()
      .slice(-12)
      .map(([month, data]) => ({
        month,
        kWh: parseFloat(data.kWh.toFixed(2)),
        cout: parseFloat(data.cout.toFixed(2)),
      }));
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">Aucun calcul enregistré</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Vos calculs apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Total kWh</p>
            <p className="text-xl font-bold font-mono text-foreground">{stats.totalKwh.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Total coût</p>
            <p className="text-xl font-bold font-mono text-primary">{stats.totalCout.toFixed(2)} €</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Moyenne/calcul</p>
            <p className="text-xl font-bold font-mono text-foreground">{stats.avgCout.toFixed(2)} €</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Tendance</p>
            <div className="flex items-center gap-2">
              {stats.trend === "up" && <TrendingUp className="w-5 h-5 text-red-400" />}
              {stats.trend === "down" && <TrendingDown className="w-5 h-5 text-emerald-400" />}
              {stats.trend === "stable" && <Minus className="w-5 h-5 text-muted-foreground" />}
              <span className={cn(
                "text-sm font-medium",
                stats.trend === "up" && "text-red-400",
                stats.trend === "down" && "text-emerald-400",
                stats.trend === "stable" && "text-muted-foreground"
              )}>
                {stats.trend === "up" ? "En hausse" : stats.trend === "down" ? "En baisse" : "Stable"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <h3 className="text-sm font-medium text-foreground mb-4">Évolution mensuelle</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line type="monotone" dataKey="cout" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive font-medium text-sm hover:bg-destructive/20 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Effacer
        </button>
      </div>

      {/* History List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {history.map((calc) => (
          <div
            key={calc.id}
            className="p-3 rounded-lg bg-card border border-border/50 flex items-center justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {calc.isEV && <Car className="w-3 h-3 text-emerald-400" />}
                <span className="font-medium text-foreground truncate">{calc.appareilName}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {calc.tarifType.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(calc.date).toLocaleString("fr-FR")} • {calc.puissance}W
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono font-semibold text-primary">{calc.cout.toFixed(2)} €</p>
              <p className="text-xs text-muted-foreground">{calc.consommationKwh.toFixed(3)} kWh</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryTab;
