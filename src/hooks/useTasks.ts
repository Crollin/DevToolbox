import { useState, useEffect, useCallback } from "react";
import { Task, CreateTaskInput, UpdateTaskInput } from "@/types/task";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useTasks() {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les tâches depuis l'API
  const loadTasks = useCallback(async (filters?: { status?: string; client?: string }) => {
    if (!isAuthenticated) {
      setIsLoaded(true);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.client) params.append('client', filters.client);
      
      const queryString = params.toString();
      const url = queryString ? `/tasks?${queryString}` : '/tasks';
      
      const data = await api.get<{ tasks: Task[] }>(url);
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Erreur lors du chargement des tâches:", error);
      setTasks([]);
    }
  }, [isAuthenticated]);

  // Charger les données au montage et quand l'authentification change
  useEffect(() => {
    if (isAuthenticated) {
      loadTasks().then(() => setIsLoaded(true));
    } else {
      setIsLoaded(true);
    }
  }, [isAuthenticated, loadTasks]);

  const addTask = useCallback(async (task: CreateTaskInput) => {
    if (!isAuthenticated) {
      throw new Error("Vous devez être connecté pour ajouter une tâche");
    }

    try {
      const newTask = await api.post<{ task: Task }>('/tasks', task);
      setTasks((prev) => [newTask.task, ...prev]);
      return newTask.task;
    } catch (error) {
      console.error("Erreur lors de l'ajout de la tâche:", error);
      throw error;
    }
  }, [isAuthenticated]);

  const updateTask = useCallback(async (id: string, updates: UpdateTaskInput) => {
    if (!isAuthenticated) {
      throw new Error("Vous devez être connecté pour modifier une tâche");
    }

    try {
      const { task } = await api.put<{ task: Task }>(`/tasks/${id}`, updates);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? task : t))
      );
      return task;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      throw error;
    }
  }, [isAuthenticated]);

  const updateTaskStatus = useCallback(async (id: string, status: 'pending' | 'in_progress' | 'completed') => {
    if (!isAuthenticated) {
      throw new Error("Vous devez être connecté pour modifier le statut d'une tâche");
    }

    try {
      const { task } = await api.patch<{ task: Task }>(`/tasks/${id}/status`, { status });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? task : t))
      );
      return task;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      throw error;
    }
  }, [isAuthenticated]);

  const deleteTask = useCallback(async (id: string) => {
    if (!isAuthenticated) {
      throw new Error("Vous devez être connecté pour supprimer une tâche");
    }

    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression de la tâche:", error);
      throw error;
    }
  }, [isAuthenticated]);

  return {
    tasks,
    isLoaded,
    addTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    refreshTasks: loadTasks,
  };
}

