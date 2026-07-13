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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border rounded-md overflow-hidden">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 px-4 py-4 bg-card"
        >
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
            <stat.icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground font-mono leading-none">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-1">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
