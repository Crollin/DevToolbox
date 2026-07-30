import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Filter,
  CheckSquare,
  CalendarClock,
  CircleAlert,
  ListTodo,
  LayoutGrid,
  List,
} from "lucide-react";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { useTasks } from "@/hooks/useTasks";
import { Task, CreateTaskInput } from "@/types/task";
import TaskCard from "@/components/tasks/TaskCard";
import TaskKanbanBoard from "@/components/tasks/TaskKanbanBoard";
import TaskModal from "@/components/tasks/TaskModal";
import TaskDetailSheet from "@/components/tasks/TaskDetailSheet";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { ClientInfo } from "@/components/tasks/TaskModal";
import { toast } from "@/hooks/use-toast";
import { uploadAttachment } from "@/lib/taskAttachmentsApi";

type ViewMode = "kanban" | "list";

const TaskReminder = () => {
  const tool = tools.find((t) => t.id === "task-reminder")!;
  const { tasks, isLoaded, addTask, updateTask, updateTaskStatus, deleteTask } = useTasks();

  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [clientColors, setClientColors] = useState<Record<string, string>>({});

  const loadClientColors = useCallback(() => {
    api.get<{ clients: ClientInfo[] }>('/tasks/clients/list')
      .then((data) => {
        const map: Record<string, string> = {};
        data.clients.forEach((c) => { if (c.color) map[c.name] = c.color; });
        setClientColors(map);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => { loadClientColors(); }, [loadClientColors]);

  const clients = useMemo(() => {
    const clientSet = new Set<string>();
    tasks.forEach((task) => {
      if (task.client) clientSet.add(task.client);
    });
    return Array.from(clientSet).sort();
  }, [tasks]);

  const tags = useMemo(
    () => Array.from(new Set(tasks.flatMap((task) => task.tags || []))).sort(),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(search.toLowerCase())) ||
        (task.client && task.client.toLowerCase().includes(search.toLowerCase())) ||
        (task.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = viewMode === "kanban" || statusFilter === "all" || task.status === statusFilter;
      const matchesClient = clientFilter === "all" || task.client === clientFilter;
      const matchesTag = tagFilter === "all" || (task.tags || []).includes(tagFilter);
      const matchesCompleted = showCompleted || task.status !== "completed";

      return matchesSearch && matchesStatus && matchesClient && matchesTag && matchesCompleted;
    });
  }, [tasks, search, statusFilter, clientFilter, tagFilter, showCompleted, viewMode]);

  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  const today = new Date();
  const dueSoonTasks = tasks.filter((task) => {
    if (task.status === "completed") return false;
    const due = new Date(task.dueDate);
    const days = (due.getTime() - today.getTime()) / 86400000;
    return days >= 0 && days <= 3;
  }).length;
  const overdueTasks = tasks.filter(
    (task) => task.status !== "completed" && new Date(task.dueDate) < today
  ).length;

  const handleSave = async (taskData: CreateTaskInput, files: File[]) => {
    try {
      let taskId: string;
      if (editingTask) {
        const task = await updateTask(editingTask.id, taskData);
        taskId = task.id;
        toast({
          title: "Tâche modifiée",
          description: `La tâche "${taskData.title}" a été modifiée avec succès.`,
        });
      } else {
        const task = await addTask(taskData);
        taskId = task.id;
        toast({
          title: "Tâche créée",
          description: `La tâche "${taskData.title}" a été créée avec succès.`,
        });
      }

      if (files.length > 0) {
        let uploadedCount = 0;
        try {
          for (const file of files) {
            await uploadAttachment(taskId, file);
            uploadedCount += 1;
          }
          toast({
            title: "Pièces jointes ajoutées",
            description:
              uploadedCount === 1
                ? `"${files[0].name}" a été téléversé.`
                : `${uploadedCount} fichiers ont été téléversés.`,
          });
        } catch {
          toast({
            variant: "destructive",
            title: "Échec du téléversement",
            description:
              uploadedCount > 0
                ? `${uploadedCount} fichier(s) téléversé(s), puis une erreur est survenue.`
                : "La tâche a été enregistrée, mais les pièces jointes n'ont pas pu être téléversées.",
          });
        }
      }

      setEditingTask(null);
      loadClientColors();
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
      throw new Error("Task save failed");
    }
  };

  const handleEdit = (task: Task) => {
    setViewingTask(null);
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || !confirm(`Supprimer la tâche "${task.title}" ?`)) return;

    try {
      await deleteTask(id);
      toast({
        title: "Tâche supprimée",
        description: `${task.title} a été supprimée.`,
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, status: Task["status"]) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;

    try {
      await updateTaskStatus(id, status);
      const labels: Record<Task["status"], string> = {
        pending: "en attente",
        in_progress: "en cours",
        completed: "terminée",
      };
      toast({
        title: "Statut mis à jour",
        description: `"${task.title}" est maintenant ${labels[status]}.`,
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut.",
        variant: "destructive",
      });
    }
  };

  const openNewModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  if (!isLoaded) {
    return (
      <ToolLayout tool={tool}>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout tool={tool}>
      <div
        className={cn(
          "tool-workspace mx-auto space-y-6 animate-fade-in",
          viewMode === "kanban" ? "max-w-7xl" : "max-w-5xl"
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="tool-kicker">
              <CalendarClock className="w-3.5 h-3.5" /> Cadence de travail
            </p>
            <h2 className="text-2xl font-bold text-foreground mb-1">Le prochain geste est clair</h2>
            <p className="text-muted-foreground text-sm">
              Planifiez, relancez et fermez les boucles sans perdre le fil.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "kanban"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={viewMode === "kanban"}
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={viewMode === "list"}
              >
                <List className="h-4 w-4" />
                Liste
              </button>
            </div>
            <button
              onClick={openNewModal}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle tâche</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="insight-card">
            <ListTodo className="insight-icon text-primary" />
            <div>
              <strong>{pendingTasks + inProgressTasks}</strong>
              <span>à traiter</span>
            </div>
          </div>
          <div className="insight-card">
            <CircleAlert className="insight-icon text-accent" />
            <div>
              <strong>{overdueTasks}</strong>
              <span>en retard</span>
            </div>
          </div>
          <div className="insight-card">
            <CalendarClock className="insight-icon text-blue-400" />
            <div>
              <strong>{dueSoonTasks}</strong>
              <span>dans les 3 jours</span>
            </div>
          </div>
          <div className="insight-card">
            <CheckSquare className="insight-icon text-emerald-400" />
            <div>
              <strong>{completedTasks}</strong>
              <span>terminées</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une tâche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />

            {viewMode === "list" && (
              <>
                {(["all", "pending", "in_progress", "completed"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      statusFilter === status
                        ? status === "all"
                          ? "bg-primary text-primary-foreground"
                          : status === "pending"
                            ? "border border-gray-500/30 bg-gray-500/10 text-gray-400"
                            : status === "in_progress"
                              ? "border border-blue-500/30 bg-blue-500/10 text-blue-400"
                              : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {status === "all"
                      ? "Tous"
                      : status === "pending"
                        ? "En attente"
                        : status === "in_progress"
                          ? "En cours"
                          : "Terminées"}
                  </button>
                ))}
              </>
            )}

            {clients.length > 0 && (
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="rounded-lg border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">Tous les clients</option>
                {clients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            )}

            {tags.length > 0 && (
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="rounded-lg border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">Tous les tags</option>
                {tags.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                showCompleted ? "bg-muted text-foreground" : "bg-muted/50 text-muted-foreground"
              )}
            >
              <CheckSquare className="h-4 w-4" />
              Afficher terminées
            </button>
          </div>
        </div>

        {viewMode === "kanban" ? (
          filteredTasks.length > 0 || tasks.length === 0 ? (
            <TaskKanbanBoard
              tasks={filteredTasks}
              showCompleted={showCompleted}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={setViewingTask}
              onStatusChange={handleStatusChange}
              clientColors={clientColors}
            />
          ) : (
            <div className="py-12 text-center">
              <CheckSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Aucune tâche ne correspond à vos filtres.</p>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={setViewingTask}
                  onStatusChange={handleStatusChange}
                  clientColors={clientColors}
                />
              ))
            ) : (
              <div className="py-12 text-center">
                <CheckSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {tasks.length === 0
                    ? "Aucune tâche pour le moment. Créez-en une pour commencer !"
                    : "Aucune tâche ne correspond à vos filtres."}
                </p>
              </div>
            )}
          </div>
        )}

        <TaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSave}
          editTask={editingTask}
        />

        <TaskDetailSheet
          task={viewingTask}
          open={!!viewingTask}
          onOpenChange={(open) => { if (!open) setViewingTask(null); }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          clientColors={clientColors}
        />
      </div>
    </ToolLayout>
  );
};

export default TaskReminder;
