import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  getChecklistProgress,
  parseChecklistItems,
} from "@/lib/taskChecklist";

interface TaskChecklistProps {
  description: string;
  onToggle: (index: number, checked: boolean) => void;
  disabled?: boolean;
}

const TaskChecklist = ({ description, onToggle, disabled }: TaskChecklistProps) => {
  const items = parseChecklistItems(description);
  if (items.length === 0) return null;

  const { done, total } = getChecklistProgress(description);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            À faire
          </h4>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {done}/{total} terminé{done > 1 ? "s" : ""}
          </p>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{percent}%</span>
      </div>
      <Progress value={percent} className="h-1.5" />
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.index}>
            <label
              className={cn(
                "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40",
                item.checked && "opacity-60",
                disabled && "pointer-events-none opacity-50"
              )}
            >
              <Checkbox
                className="mt-0.5"
                checked={item.checked}
                disabled={disabled}
                onCheckedChange={(value) => {
                  onToggle(item.index, value === true);
                }}
              />
              <span
                className={cn(
                  "text-base leading-snug text-foreground md:text-sm",
                  item.checked && "line-through text-muted-foreground"
                )}
              >
                {item.text}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskChecklist;
