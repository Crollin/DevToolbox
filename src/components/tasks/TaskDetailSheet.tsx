import { Task } from "@/types/task";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import { marked } from "marked";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import TaskStatusSwitcher from "./TaskStatusSwitcher";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { TaskAttachmentsPanel } from "@/components/tasks/TaskAttachmentsPanel";
import TaskChecklist from "./TaskChecklist";
import {
  extractNotesMarkdown,
  parseChecklistItems,
  toggleChecklistItem,
} from "@/lib/taskChecklist";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: Task["status"]) => void;
  onDescriptionChange?: (taskId: string, description: string) => void | Promise<void>;
  clientColors?: Record<string, string>;
}

const priorityConfig: Record<Task["priority"], { label: string; color: string }> = {
  urgent: { label: "Urgente", color: "bg-red-500/15 text-red-400 border-red-500/20" },
  high: { label: "Haute", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  normal: { label: "Normale", color: "bg-muted text-muted-foreground border-border" },
  low: { label: "Faible", color: "bg-muted/60 text-muted-foreground/70 border-border/60" },
};

const channelLabels: Record<string, string> = {
  email: "Email",
  telegram: "Telegram",
  ntfy: "Ntfy",
};

function formatDate(dateString: string | null) {
  if (!dateString) return "Sans échéance";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDatetime(dateString: string | null) {
  if (!dateString) return "Sans échéance";
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

const TaskDetailSheet = ({
  task,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onStatusChange,
  onDescriptionChange,
  clientColors,
}: TaskDetailSheetProps) => {
  const isMobile = useIsMobile();

  const [localDescription, setLocalDescription] = useState(task?.description || "");
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);

  useEffect(() => {
    setLocalDescription(task?.description || "");
  }, [task?.id, task?.description]);

  const handleToggle = async (index: number, checked: boolean) => {
    if (!onDescriptionChange || !task) return;
    const previous = localDescription;
    const next = toggleChecklistItem(previous, index, checked);
    setLocalDescription(next);
    setIsSavingChecklist(true);
    try {
      await onDescriptionChange(task.id, next);
    } catch {
      setLocalDescription(previous);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la checklist.",
        variant: "destructive",
      });
    } finally {
      setIsSavingChecklist(false);
    }
  };

  if (!task) return null;

  const priority = priorityConfig[task.priority];

  const body = (
    <div className="space-y-5">
      {(parseChecklistItems(localDescription).length > 0 || extractNotesMarkdown(localDescription)) && (
        <div className="space-y-5">
          {parseChecklistItems(localDescription).length > 0 && (
            <TaskChecklist
              description={localDescription}
              onToggle={handleToggle}
              disabled={isSavingChecklist || !onDescriptionChange}
            />
          )}
          {extractNotesMarkdown(localDescription) && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes
              </h4>
              <div
                className="prose prose-sm prose-invert max-w-none rounded-lg bg-muted/40 p-3 text-sm leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(extractNotesMarkdown(localDescription)),
                }}
              />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 rounded-lg bg-muted/30 p-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Échéance
          </span>
          <p className="text-sm font-medium text-foreground">{formatDate(task.dueDate)}</p>
          {!!task.mailSources?.length && <div className="mt-3 space-y-2 text-sm"><p className="font-medium">Mails Zoho associés</p>{task.mailSources.map(source => <div key={source.messageId}><p>{source.subject}</p><p className="text-xs text-muted-foreground">{source.sender} · Réf. {source.messageId}</p></div>)}<a href="https://mail.zoho.eu" target="_blank" rel="noopener noreferrer" className="text-primary underline">Ouvrir Zoho Mail</a></div>}
        </div>

        {task.client && (
          <div className="space-y-1 rounded-lg bg-muted/30 p-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              Client
            </span>
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              {clientColors?.[task.client] && (
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: clientColors[task.client] }}
                />
              )}
              {task.client}
            </p>
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
            className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-muted/40 px-3 py-2.5 text-sm text-primary hover:bg-muted/60 transition-colors"
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

      <TaskAttachmentsPanel
        taskId={task.id}
        pendingFiles={[]}
        onPendingFilesChange={() => {}}
      />

      <div className="border-t border-border/60 pt-3">
        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-muted-foreground">
          <span>Créée le {formatDatetime(task.createdAt)}</span>
          <span>Modifiée le {formatDatetime(task.updatedAt)}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-1 pb-[env(safe-area-inset-bottom,0px)]">
        <Button
          variant="outline"
          size="default"
          className="min-h-11 flex-1"
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
          size="default"
          className="min-h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
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
  );

  const headerBadges = (
    <div className="mb-1 flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
          priority.color
        )}
      >
        <Flag className="h-3 w-3" />
        {priority.label}
      </span>
      {onStatusChange ? (
        <TaskStatusSwitcher
          status={task.status}
          onChange={(status) => onStatusChange(task.id, status)}
        />
      ) : null}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="text-left">
            {headerBadges}
            <DrawerTitle className="text-left text-lg leading-snug">{task.title}</DrawerTitle>
            <DrawerDescription className="sr-only">Détail de la tâche</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[90vw] max-w-[1100px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 space-y-3 border-b border-border px-6 py-4 text-left">
          {headerBadges}
          <DialogTitle className="pr-8 text-left text-xl leading-snug">
            {task.title}
          </DialogTitle>
          <DialogDescription className="sr-only">Détail de la tâche</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{body}</div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailSheet;
