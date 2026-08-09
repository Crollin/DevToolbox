import { Task } from "@/types/task";
import TaskStatusSwitcher from "./TaskStatusSwitcher";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, ExternalLink, Calendar, User, Link as LinkIcon, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onView?: (task: Task) => void;
  onStatusChange: (id: string, status: "pending" | "in_progress" | "completed") => void;
  clientColors?: Record<string, string>;
}

const TaskCard = ({ task, onEdit, onDelete, onView, onStatusChange, clientColors }: TaskCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = () => {
    if (confirm(`Supprimer la tâche "${task.title}" ?`)) {
      onDelete(task.id);
    }
  };

  return (
    <div
      className={cn(
        "group p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all",
        onView && "cursor-pointer"
      )}
      onClick={(e) => {
        if (!onView) return;
        const target = e.target as HTMLElement;
        if (
          target.closest("button") ||
          target.closest("a") ||
          target.closest("select") ||
          target.closest("[role='menu']") ||
          target.closest("[data-radix-collection-item]")
        ) {
          return;
        }
        onView(task);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-semibold text-foreground">{task.title}</h3>
              <TaskStatusSwitcher
                status={task.status}
                onChange={(status) => onStatusChange(task.id, status)}
              />
              {task.priority !== "normal" && (
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-medium",
                    task.priority === "urgent"
                      ? "bg-red-500/15 text-red-400"
                      : task.priority === "high"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {task.priority === "urgent"
                    ? "Urgente"
                    : task.priority === "high"
                      ? "Haute"
                      : "Faible"}
                </span>
              )}
            </div>

            {task.tags?.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {task.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
            )}

            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
              {task.client && (
                <div className="flex items-center gap-2">
                  {clientColors?.[task.client] ? (
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: clientColors[task.client] }}
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span>{task.client}</span>
                </div>
              )}
              {task.link && (
                <div className="flex items-center gap-2 min-w-0">
                  <LinkIcon className="w-4 h-4 shrink-0" />
                  <a
                    href={task.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 min-w-0"
                  >
                    <span className="truncate">{task.link}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task)}
            className="h-10 w-10 p-0 md:h-8 md:w-8"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-10 w-10 p-0 text-destructive hover:text-destructive md:h-8 md:w-8"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
