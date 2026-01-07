import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Tool } from '@/data/tools';
import ToolCard from './ToolCard';
import SortableToolCard from './SortableToolCard';

interface ToolGridProps {
  tools: Tool[];
  isEditMode: boolean;
  onOrderChange: (toolIds: string[]) => void;
}

const ToolGrid = ({ tools, isEditMode, onOrderChange }: ToolGridProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tools.findIndex((tool) => tool.id === active.id);
    const newIndex = tools.findIndex((tool) => tool.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newTools = arrayMove(tools, oldIndex, newIndex);
      const newToolIds = newTools.map((tool) => tool.id);
      onOrderChange(newToolIds);
    }
  };

  if (!isEditMode) {
    // Mode normal : affichage simple sans drag & drop
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.map((tool, index) => (
          <ToolCard key={tool.id} tool={tool} index={index} />
        ))}
      </div>
    );
  }

  // Mode édition : drag & drop activé
  const toolIds = tools.map((tool) => tool.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={toolIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((tool, index) => (
            <SortableToolCard key={tool.id} tool={tool} index={index} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default ToolGrid;


