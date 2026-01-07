import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import ToolCard from './ToolCard';
import { Tool } from '@/data/tools';

interface SortableToolCardProps {
  tool: Tool;
  index: number;
}

const SortableToolCard = ({ tool, index }: SortableToolCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tool.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "touch-none",
        isDragging ? "cursor-grabbing z-50" : "cursor-grab"
      )}
    >
      <ToolCard tool={tool} index={index} isDragging={isDragging} isEditMode={true} />
    </div>
  );
};

export default SortableToolCard;

