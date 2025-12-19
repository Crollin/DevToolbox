import { useState, useMemo } from "react";
import { Plus, Search, Filter, CheckSquare } from "lucide-react";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { useTasks } from "@/hooks/useTasks";
import { Task, CreateTaskInput } from "@/types/task";
import TaskCard from "@/components/tasks/TaskCard";
import TaskModal from "@/components/tasks/TaskModal";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const TaskReminder = () => {
  const tool = tools.find((t) => t.id === "task-reminder")!;
  const { tasks, isLoaded, addTask, updateTask, updateTaskStatus, deleteTask } = useTasks();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Extraire la liste unique des clients
  const clients = useMemo(() => {
    const clientSet = new Set<string>();
    tasks.forEach((task) => {
      if (task.client) {
        clientSet.add(task.client);
      }
    });
    return Array.from(clientSet).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = 
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(search.toLowerCase())) ||
        (task.client && task.client.toLowerCase().includes(search.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesClient = clientFilter === "all" || task.client === clientFilter;
      const matchesCompleted = showCompleted || task.status !== "completed";
      
      return matchesSearch && matchesStatus && matchesClient && matchesCompleted;
    });
  }, [tasks, search, statusFilter, clientFilter, showCompleted]);

  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => t.status === "pending").length;
  }, [tasks]);

  const inProgressTasks = useMemo(() => {
    return tasks.filter((t) => t.status === "in_progress").length;
  }, [tasks]);

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === "completed").length;
  }, [tasks]);

  const handleSave = async (taskData: CreateTaskInput) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData);
        toast({
          title: "Tâche modifiée",
          description: `La tâche "${taskData.title}" a été modifiée avec succès.`,
        });
      } else {
        await addTask(taskData);
        toast({
          title: "Tâche créée",
          description: `La tâche "${taskData.title}" a été créée avec succès.`,
        });
      }
      setEditingTask(null);
      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      await updateTaskStatus(id, status);
    } catch (error) {
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
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Gestionnaire de Tâches</h2>
            <p className="text-muted-foreground text-sm">
              {tasks.length} tâche{tasks.length !== 1 ? "s" : ""} enregistrée{tasks.length !== 1 ? "s" : ""}
              {pendingTasks > 0 && ` • ${pendingTasks} en attente`}
              {inProgressTasks > 0 && ` • ${inProgressTasks} en cours`}
            </p>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle tâche</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="text-2xl font-bold text-foreground">{pendingTasks}</div>
            <div className="text-xs text-muted-foreground">En attente</div>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="text-2xl font-bold text-blue-400">{inProgressTasks}</div>
            <div className="text-xs text-muted-foreground">En cours</div>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="text-2xl font-bold text-emerald-400">{completedTasks}</div>
            <div className="text-xs text-muted-foreground">Terminées</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une tâche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Tous
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                statusFilter === "pending"
                  ? "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              En attente
            </button>
            <button
              onClick={() => setStatusFilter("in_progress")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                statusFilter === "in_progress"
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              En cours
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                statusFilter === "completed"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Terminées
            </button>
            
            {clients.length > 0 && (
              <>
                <span className="text-muted-foreground mx-1">•</span>
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">Tous les clients</option>
                  {clients.map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
                </select>
              </>
            )}
            
            <span className="text-muted-foreground mx-1">•</span>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                showCompleted
                  ? "bg-muted text-foreground"
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              <CheckSquare className="w-4 h-4" />
              Afficher terminées
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {tasks.length === 0
                  ? "Aucune tâche pour le moment. Créez-en une pour commencer !"
                  : "Aucune tâche ne correspond à vos filtres."}
              </p>
            </div>
          )}
        </div>

        {/* Modal */}
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSave}
          editTask={editingTask}
        />
      </div>
    </ToolLayout>
  );
};

export default TaskReminder;

