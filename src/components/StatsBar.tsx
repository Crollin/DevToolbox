import { Package, Layers, Clock, TrendingUp } from "lucide-react";

interface StatsBarProps {
  totalTools: number;
  totalCategories: number;
}

const StatsBar = ({ totalTools, totalCategories }: StatsBarProps) => {
  const stats = [
    { icon: Package, label: "Outils", value: totalTools },
    { icon: Layers, label: "Catégories", value: totalCategories },
    { icon: Clock, label: "Récents", value: 3 },
    { icon: TrendingUp, label: "Cette semaine", value: "+2" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border/50"
        >
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
            <stat.icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground font-mono">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
