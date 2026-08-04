import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/task";
import { getDaysUntilDue } from "./TaskStatusBadge";
import TaskStatusSwitcher from "./TaskStatusSwitcher";
import { cn } from "@/lib/utils";
import { Calendar, GripVertical, Pencil, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onView?: (task: Task) => void;
  onStatusChange: (id: string, status: Task["status"]) => void;
  isDragging?: boolean;
  clientColors?: Record<string, string>;
}

const priorityAccent: Record<Task["priority"], string> = {
  urgent: "bg-red-400",
  high: "bg-amber-400",
  normal: "bg-transparent",
  low: "bg-muted-foreground/40",
};

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

const KanbanTaskCard = ({
  task,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  isDragging,
  clientColors,
}: KanbanTaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const daysUntilDue = getDaysUntilDue(task);
  const isOverdue = task.status !== "completed" && daysUntilDue < 0;
  const isDueSoon = task.status !== "completed" && daysUntilDue >= 0 && daysUntilDue <= 3;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm transition-shadow",
        isSortableDragging || isDragging
          ? "border-primary/50 shadow-md opacity-90 ring-2 ring-primary/20"
          : "border-border/60 hover:border-primary/30 hover:shadow-md",
        task.priority !== "normal" && "border-l-[3px]",
        task.priority === "urgent" && "border-l-red-400",
        task.priority === "high" && "border-l-amber-400",
        task.priority === "low" && "border-l-muted-foreground/40",
        onView && "cursor-pointer"
      )}
      onClick={(e) => {
        if (!onView) return;
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest("[role='menu']") || target.closest("[data-radix-collection-item]")) {
          return;
        }
        onView(task);
      }}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground active:cursor-grabbing"
          aria-label="Déplacer la tâche"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium leading-snug text-foreground line-clamp-2">
              {task.title}
            </h4>
            {task.priority !== "normal" && (
              <span
                className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", priorityAccent[task.priority])}
                title={
                  task.priority === "urgent"
                    ? "Urgente"
                    : task.priority === "high"
                      ? "Haute"
                      : "Faible"
                }
              />
            )}
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}

          <div className="mt-2">
            <TaskStatusSwitcher
              status={task.status}
              size="sm"
              onChange={(status) => onStatusChange(task.id, status)}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span
              className={cn(
                "inline-flex items-center gap-1",
                isOverdue && "font-medium text-red-400",
                isDueSoon && !isOverdue && "font-medium text-amber-400"
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatShortDate(task.dueDate)}
              {isOverdue && ` (${Math.abs(daysUntilDue)}j)`}
            </span>
            {task.client && (
              <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                {clientColors?.[task.client] ? (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: clientColors[task.client] }}
                  />
                ) : (
                  <User className="h-3 w-3 shrink-0" />
                )}
                {task.client}
              </span>
            )}
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                >
                  #{tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{task.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-0.5 opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(task)}
          className="h-7 w-7 p-0"
          title="Modifier"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(task.id)}
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default KanbanTaskCard;
