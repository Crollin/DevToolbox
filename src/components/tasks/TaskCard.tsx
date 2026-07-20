import { Task } from "@/types/task";
import TaskStatusBadge from "./TaskStatusBadge";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, CheckCircle2, ExternalLink, Calendar, User, Link as LinkIcon, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'pending' | 'in_progress' | 'completed') => void;
}

const TaskCard = ({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = () => {
    if (confirm(`Supprimer la tâche "${task.title}" ?`)) {
      onDelete(task.id);
      toast({
        title: "Tâche supprimée",
        description: `${task.title} a été supprimée.`,
      });
    }
  };

  const handleStatusChange = (newStatus: 'pending' | 'in_progress' | 'completed') => {
    onStatusChange(task.id, newStatus);
    toast({
      title: "Statut mis à jour",
      description: `La tâche "${task.title}" est maintenant ${newStatus === 'completed' ? 'terminée' : newStatus === 'in_progress' ? 'en cours' : 'en attente'}.`,
    });
  };

  return (
    <div className="group p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-semibold text-foreground">{task.title}</h3>
              <TaskStatusBadge task={task} />
              {task.priority !== 'normal' && <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", task.priority === 'urgent' ? "bg-red-500/15 text-red-400" : task.priority === 'high' ? "bg-amber-500/15 text-amber-400" : "bg-muted text-muted-foreground")}>{task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Haute' : 'Faible'}</span>}
            </div>

            {task.tags?.length > 0 && <div className="mb-3 flex flex-wrap gap-1.5">{task.tags.map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"><Tag className="h-3 w-3" />{tag}</span>)}</div>}

            {task.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
              {task.client && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{task.client}</span>
                </div>
              )}
              {task.link && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  <a
                    href={task.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {task.link}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {task.status !== 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusChange('completed')}
              className="h-8 w-8 p-0"
              title="Marquer comme terminée"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task)}
            className="h-8 w-8 p-0"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
