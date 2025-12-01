import { Package, Layers, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface StatsBarProps {
  totalTools: number;
  totalCategories: number;
}

const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') return;
    
    let startTime: number;
    const startValue = 0;
    const endValue = value;
    const steps = 60;
    const stepDuration = duration / steps;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentValue = Math.floor(startValue + (endValue - startValue) * progress);
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{count}</span>;
};

const StatsBar = ({ totalTools, totalCategories }: StatsBarProps) => {
  const stats = [
    { icon: Package, label: "Outils", value: totalTools, isNumber: true },
    { icon: Layers, label: "Catégories", value: totalCategories, isNumber: true },
    { icon: Clock, label: "Récents", value: 3, isNumber: true },
    { icon: TrendingUp, label: "Cette semaine", value: "+2", isNumber: false },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="stat-card flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border/50 cursor-default"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <stat.icon className="w-4 h-4 text-primary group-hover:text-primary-glow transition-colors" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground font-mono animate-count-up">
              {stat.isNumber ? <AnimatedCounter value={stat.value as number} /> : stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
