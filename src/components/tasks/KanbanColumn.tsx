import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task } from "@/types/task";
import KanbanTaskCard from "./KanbanTaskCard";
import { cn } from "@/lib/utils";
import { Circle, PlayCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

/** Nombre de tuiles visibles par défaut dans la colonne Terminées */
const COMPLETED_PREVIEW_LIMIT = 5;

export interface KanbanColumnConfig {
  id: Task["status"];
  label: string;
  icon: typeof Circle;
  accent: string;
  headerBg: string;
}

interface KanbanColumnProps {
  column: KanbanColumnConfig;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onView?: (task: Task) => void;
  onStatusChange: (id: string, status: Task["status"]) => void;
  isOver?: boolean;
  clientColors?: Record<string, string>;
}

const KanbanColumn = ({
  column,
  tasks,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  isOver,
  clientColors,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({ id: column.id });
  const Icon = column.icon;
  const highlighted = isOver || isDroppableOver;

  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const isCompletedColumn = column.id === "completed";
  const shouldCollapse =
    isCompletedColumn && !showAllCompleted && tasks.length > COMPLETED_PREVIEW_LIMIT;
  const visibleTasks = shouldCollapse
    ? tasks.slice(0, COMPLETED_PREVIEW_LIMIT)
    : tasks;
  const hiddenCount = tasks.length - visibleTasks.length;
  const taskIds = visibleTasks.map((t) => t.id);

  return (
    <div
      className={cn(
        "flex min-h-0 md:min-h-[320px] flex-col rounded-xl border bg-muted/20 transition-all",
        highlighted
          ? "border-primary/50 ring-2 ring-primary/25 bg-primary/5"
          : "border-border/60"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-t-xl border-b px-3 py-2.5",
          column.headerBg,
          highlighted && "border-primary/20"
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", column.accent)} />
          <h3 className="text-sm font-semibold text-foreground">{column.label}</h3>
        </div>
        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium",
            highlighted ? "bg-primary/15 text-primary" : "bg-background/80 text-muted-foreground"
          )}
        >
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 p-2 transition-colors min-h-[120px]",
          highlighted && "bg-primary/5"
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {visibleTasks.length > 0 ? (
            <>
              {visibleTasks.map((task) => (
                <KanbanTaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
                  onStatusChange={onStatusChange}
                  clientColors={clientColors}
                />
              ))}
              {isCompletedColumn && tasks.length > COMPLETED_PREVIEW_LIMIT && (
                <button
                  type="button"
                  onClick={() => setShowAllCompleted((prev) => !prev)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted/40 hover:text-foreground"
                >
                  {showAllCompleted ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      Réduire
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      Voir les {hiddenCount} autres
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <div
              className={cn(
                "flex flex-1 items-center justify-center rounded-lg border border-dashed p-6 text-center transition-colors",
                highlighted
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground"
              )}
            >
              <p className="text-xs font-medium">
                {highlighted ? "Déposer ici" : "Aucune tâche"}
              </p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: "pending",
    label: "En attente",
    icon: Circle,
    accent: "text-muted-foreground",
    headerBg: "bg-muted/40",
  },
  {
    id: "in_progress",
    label: "En cours",
    icon: PlayCircle,
    accent: "text-blue-400",
    headerBg: "bg-blue-500/5",
  },
  {
    id: "completed",
    label: "Terminées",
    icon: CheckCircle2,
    accent: "text-emerald-400",
    headerBg: "bg-emerald-500/5",
  },
];

export default KanbanColumn;
