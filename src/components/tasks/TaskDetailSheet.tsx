import { Task } from "@/types/task";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import { marked } from "marked";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  User,
  Link as LinkIcon,
  Pencil,
  Trash2,
  ExternalLink,
  Bell,
  Flag,
} from "lucide-react";

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityConfig: Record<Task["priority"], { label: string; color: string }> = {
  urgent: { label: "Urgente", color: "bg-red-500/15 text-red-400 border-red-500/20" },
  high: { label: "Haute", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  normal: { label: "Normale", color: "bg-muted text-muted-foreground border-border" },
  low: { label: "Faible", color: "bg-muted/60 text-muted-foreground/70 border-border/60" },
};

const statusConfig: Record<Task["status"], { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "En cours", color: "bg-blue-500/15 text-blue-400" },
  completed: { label: "Terminée", color: "bg-emerald-500/15 text-emerald-400" },
};

const channelLabels: Record<string, string> = {
  email: "Email",
  telegram: "Telegram",
  ntfy: "Ntfy",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDatetime(dateString: string) {
  return new Date(dateString).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderMarkdown(md: string) {
  return DOMPurify.sanitize(marked.parse(md, { async: false }) as string);
}

const TaskDetailSheet = ({ task, open, onOpenChange, onEdit, onDelete }: TaskDetailSheetProps) => {
  if (!task) return null;

  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pr-8">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium", priority.color)}>
              <Flag className="h-3 w-3" />
              {priority.label}
            </span>
            <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", status.color)}>
              {status.label}
            </span>
          </div>
          <SheetTitle className="text-left text-lg leading-snug">
            {task.title}
          </SheetTitle>
          <SheetDescription className="sr-only">Détail de la tâche</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {task.description && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</h4>
              <div
                className="prose prose-sm prose-invert max-w-none rounded-lg bg-muted/40 p-3 text-sm leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(task.description) }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 rounded-lg bg-muted/30 p-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Échéance
              </span>
              <p className="text-sm font-medium text-foreground">{formatDate(task.dueDate)}</p>
            </div>

            {task.client && (
              <div className="space-y-1 rounded-lg bg-muted/30 p-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  Client
                </span>
                <p className="text-sm font-medium text-foreground">{task.client}</p>
              </div>
            )}
          </div>

          {task.link && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lien</h4>
              <a
                href={task.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-3 py-2 text-sm text-primary hover:bg-muted/60 transition-colors break-all"
              >
                <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{task.link}</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
              </a>
            </div>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {task.notificationChannels && task.notificationChannels.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Bell className="h-3 w-3" />
                Notifications
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {task.notificationChannels.map((ch) => (
                  <span key={ch} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {channelLabels[ch] || ch}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-border/60 pt-3">
            <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-muted-foreground">
              <span>Créée le {formatDatetime(task.createdAt)}</span>
              <span>Modifiée le {formatDatetime(task.updatedAt)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                onEdit(task);
              }}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                onOpenChange(false);
                onDelete(task.id);
              }}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Supprimer
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailSheet;
