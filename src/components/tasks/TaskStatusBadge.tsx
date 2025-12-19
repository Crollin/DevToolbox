import { Task } from "@/types/task";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, Circle, PlayCircle } from "lucide-react";

interface TaskStatusBadgeProps {
  task: Task;
  className?: string;
}

export function getDaysUntilDue(task: Task): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const TaskStatusBadge = ({ task, className }: TaskStatusBadgeProps) => {
  const daysUntilDue = getDaysUntilDue(task);

  if (task.status === "completed") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
        className
      )}>
        <CheckCircle2 className="w-3 h-3" />
        Terminée
      </span>
    );
  }

  if (task.status === "in_progress") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30",
        className
      )}>
        <PlayCircle className="w-3 h-3" />
        En cours
      </span>
    );
  }

  // Status: pending
  if (daysUntilDue < 0) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30",
        className
      )}>
        <Clock className="w-3 h-3" />
        En retard ({Math.abs(daysUntilDue)}j)
      </span>
    );
  }

  if (daysUntilDue === 0) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30",
        className
      )}>
        <Clock className="w-3 h-3" />
        Aujourd'hui
      </span>
    );
  }

  if (daysUntilDue <= 3) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30",
        className
      )}>
        <Clock className="w-3 h-3" />
        {daysUntilDue}j restants
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/30",
      className
    )}>
      <Circle className="w-3 h-3" />
      {daysUntilDue}j restants
    </span>
  );
};

export default TaskStatusBadge;

