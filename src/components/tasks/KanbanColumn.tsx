import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task } from "@/types/task";
import KanbanTaskCard from "./KanbanTaskCard";
import { cn } from "@/lib/utils";
import { Circle, PlayCircle, CheckCircle2 } from "lucide-react";

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
  isOver?: boolean;
}

const KanbanColumn = ({ column, tasks, onEdit, onDelete, isOver }: KanbanColumnProps) => {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({ id: column.id });
  const Icon = column.icon;
  const taskIds = tasks.map((t) => t.id);
  const highlighted = isOver || isDroppableOver;

  return (
    <div className="flex min-h-[320px] flex-col rounded-xl border border-border/60 bg-muted/20">
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-t-xl border-b px-3 py-2.5",
          column.headerBg
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", column.accent)} />
          <h3 className="text-sm font-semibold text-foreground">{column.label}</h3>
        </div>
        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium",
            "bg-background/80 text-muted-foreground"
          )}
        >
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 p-2 transition-colors",
          highlighted && "bg-primary/5"
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <KanbanTaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
            ))
          ) : (
            <div
              className={cn(
                "flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/50 p-6 text-center",
                highlighted && "border-primary/40 bg-primary/5"
              )}
            >
              <p className="text-xs text-muted-foreground">
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
