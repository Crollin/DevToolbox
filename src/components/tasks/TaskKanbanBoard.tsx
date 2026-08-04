import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  CollisionDetection,
  closestCorners,
  pointerWithin,
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
  onView?: (task: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  clientColors?: Record<string, string>;
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

/** Prefer pointer hit (column/card under cursor), fall back to closest corners. */
const kanbanCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) {
    return pointerHits;
  }
  return closestCorners(args);
};

const TaskKanbanBoard = ({
  tasks,
  showCompleted,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  clientColors,
}: TaskKanbanBoardProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localGrouped, setLocalGrouped] = useState<Record<TaskStatus, Task[]> | null>(null);
  const [overColumnId, setOverColumnId] = useState<TaskStatus | null>(null);
  const dragSourceRef = useRef<TaskStatus | null>(null);
  const dragTargetRef = useRef<TaskStatus | null>(null);

  const grouped = useMemo(() => groupTasksByStatus(tasks), [tasks]);
  const displayGrouped = localGrouped ?? grouped;

  // Drop optimistic local layout once parent tasks catch up
  useEffect(() => {
    if (!localGrouped || activeId) return;
    setLocalGrouped(null);
  }, [tasks, localGrouped, activeId]);

  const visibleColumns = showCompleted
    ? KANBAN_COLUMNS
    : KANBAN_COLUMNS.filter((c) => c.id !== "completed");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId) ??
      (localGrouped
        ? Object.values(localGrouped).flat().find((t) => t.id === activeId)
        : null) ??
      null
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    const source = findContainer(id, grouped);
    setActiveId(id);
    setLocalGrouped(grouped);
    dragSourceRef.current = source;
    dragTargetRef.current = source;
    setOverColumnId(source);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !localGrouped) return;

    const activeContainer = findContainer(String(active.id), localGrouped);
    const overContainer = findContainer(String(over.id), localGrouped);

    if (!activeContainer || !overContainer) return;

    setOverColumnId(overContainer);
    dragTargetRef.current = overContainer;

    if (activeContainer === overContainer) return;

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
    const taskId = String(active.id);
    const source = dragSourceRef.current ?? findContainer(taskId, grouped);

    // Prefer where the card visually landed (localGrouped / dragOver tracking)
    let target =
      dragTargetRef.current ??
      (localGrouped ? findContainer(taskId, localGrouped) : null);

    if (!target && over) {
      target = findContainer(String(over.id), localGrouped ?? grouped);
    }

    setActiveId(null);
    setOverColumnId(null);
    dragSourceRef.current = null;
    dragTargetRef.current = null;

    if (!source || !target) {
      setLocalGrouped(null);
      return;
    }

    if (source !== target) {
      // Keep localGrouped until optimistic parent update arrives
      onStatusChange(taskId, target);
    } else {
      setLocalGrouped(null);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setLocalGrouped(null);
    setOverColumnId(null);
    dragSourceRef.current = null;
    dragTargetRef.current = null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={kanbanCollisionDetection}
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
            onView={onView}
            onStatusChange={onStatusChange}
            isOver={overColumnId === column.id && !!activeId}
            clientColors={clientColors}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
        {activeTask ? (
          <div className="rotate-2 scale-105">
            <KanbanTaskCard
              task={activeTask}
              onEdit={() => {}}
              onDelete={() => {}}
              onStatusChange={() => {}}
              isDragging
              clientColors={clientColors}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TaskKanbanBoard;
