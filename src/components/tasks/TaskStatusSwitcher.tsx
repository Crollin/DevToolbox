import { Task } from "@/types/task";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Circle, PlayCircle, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TaskStatus = Task["status"];

const STATUS_OPTIONS: {
  value: TaskStatus;
  label: string;
  icon: typeof Circle;
  className: string;
  activeClassName: string;
}[] = [
  {
    value: "pending",
    label: "En attente",
    icon: Circle,
    className: "text-muted-foreground",
    activeClassName: "bg-muted text-muted-foreground border-border",
  },
  {
    value: "in_progress",
    label: "En cours",
    icon: PlayCircle,
    className: "text-blue-400",
    activeClassName: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  {
    value: "completed",
    label: "Terminée",
    icon: CheckCircle2,
    className: "text-emerald-400",
    activeClassName: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
];

interface TaskStatusSwitcherProps {
  status: TaskStatus;
  onChange: (status: TaskStatus) => void;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

const TaskStatusSwitcher = ({
  status,
  onChange,
  size = "md",
  className,
  disabled,
}: TaskStatusSwitcherProps) => {
  const current = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];
  const Icon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border font-medium transition-colors",
            "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50",
            size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
            current.activeClassName,
            className
          )}
          aria-label={`Statut : ${current.label}`}
          title="Changer le statut"
        >
          <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
          <span>{current.label}</span>
          <ChevronDown className={cn("opacity-60", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[10rem]" onClick={(e) => e.stopPropagation()}>
        {STATUS_OPTIONS.map((option) => {
          const OptionIcon = option.icon;
          const isActive = option.value === status;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={(e) => {
                e.stopPropagation();
                if (!isActive) onChange(option.value);
              }}
              className="gap-2"
            >
              <OptionIcon className={cn("h-4 w-4", option.className)} />
              <span className="flex-1">{option.label}</span>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TaskStatusSwitcher;
export { STATUS_OPTIONS };
