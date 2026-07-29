import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Task } from "@/types/task";
import KanbanColumn, { KANBAN_COLUMNS } from "./KanbanColumn";
import KanbanTaskCard from "./KanbanTaskCard";

type TaskStatus = Task["status"];

interface TaskKanbanBoardProps {
  tasks: Task[];
  showCompleted: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  return {
    pending: tasks.filter((t) => t.status === "pending"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    completed: tasks.filter((t) => t.status === "completed"),
  };
}

function findContainer(
  id: string,
  grouped: Record<TaskStatus, Task[]>
): TaskStatus | null {
  if (id === "pending" || id === "in_progress" || id === "completed") {
    return id;
  }
  for (const status of KANBAN_COLUMNS.map((c) => c.id)) {
    if (grouped[status].some((task) => task.id === id)) {
      return status;
    }
  }
  return null;
}

const TaskKanbanBoard = ({
  tasks,
  showCompleted,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskKanbanBoardProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localGrouped, setLocalGrouped] = useState<Record<TaskStatus, Task[]> | null>(null);

  const grouped = useMemo(() => groupTasksByStatus(tasks), [tasks]);
  const displayGrouped = localGrouped ?? grouped;

  const visibleColumns = showCompleted
    ? KANBAN_COLUMNS
    : KANBAN_COLUMNS.filter((c) => c.id !== "completed");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId) ?? null
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setLocalGrouped(grouped);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !localGrouped) return;

    const activeContainer = findContainer(String(active.id), localGrouped);
    const overContainer = findContainer(String(over.id), localGrouped);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setLocalGrouped((prev) => {
      if (!prev) return prev;

      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer]];
      const activeIndex = activeItems.findIndex((t) => t.id === active.id);
      if (activeIndex === -1) return prev;

      const [movedTask] = activeItems.splice(activeIndex, 1);
      const overIndex = overItems.findIndex((t) => t.id === over.id);
      const insertIndex = overIndex >= 0 ? overIndex : overItems.length;

      overItems.splice(insertIndex, 0, { ...movedTask, status: overContainer });

      return {
        ...prev,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setLocalGrouped(null);

    if (!over) return;

    const sourceContainer = findContainer(String(active.id), grouped);
    const targetContainer = findContainer(String(over.id), grouped);

    if (!sourceContainer || !targetContainer) return;

    if (sourceContainer !== targetContainer) {
      onStatusChange(String(active.id), targetContainer);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setLocalGrouped(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className={
          showCompleted
            ? "grid grid-cols-1 gap-4 md:grid-cols-3"
            : "grid grid-cols-1 gap-4 md:grid-cols-2"
        }
      >
        {visibleColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={displayGrouped[column.id]}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeTask ? (
          <KanbanTaskCard
            task={activeTask}
            onEdit={() => {}}
            onDelete={() => {}}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TaskKanbanBoard;
