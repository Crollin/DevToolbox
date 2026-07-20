import {
  Action,
  ActionPanel,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { listTasks, Task, TaskStatus, updateTaskStatus } from "./task-api";

const statusLabels: Record<TaskStatus, string> = {
  pending: "À faire",
  in_progress: "En cours",
  completed: "Terminée",
};

function dueLabel(task: Task) {
  const due = new Date(task.dueDate);
  return Number.isNaN(due.getTime()) ? task.dueDate : due.toLocaleDateString();
}

export default function SearchTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  async function load() {
    setIsLoading(true);
    setError(undefined);
    try {
      setTasks(await listTasks());
    } catch (caught) {
      setError(String(caught));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(task: Task, status: TaskStatus) {
    try {
      await updateTaskStatus(task.id, status);
      await showToast({
        style: Toast.Style.Success,
        title: `Tâche ${statusLabels[status].toLowerCase()}`,
      });
      await load();
    } catch (caught) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Mise à jour impossible",
        message: String(caught),
      });
    }
  }

  if (error) {
    return (
      <List isLoading={isLoading}>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="API indisponible"
          description={error}
          actions={
            <ActionPanel>
              <Action
                title="Réessayer"
                icon={Icon.RotateClockwise}
                onAction={load}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Rechercher une tâche...">
      {tasks.map((task) => (
        <List.Item
          key={task.id}
          title={task.title}
          subtitle={`${statusLabels[task.status]} · ${dueLabel(task)}${task.client ? ` · ${task.client}` : ""}`}
          accessories={
            task.status === "completed" ? [{ icon: Icon.Checkmark }] : undefined
          }
          actions={
            <ActionPanel>
              {task.status !== "completed" && (
                <Action
                  title="Marquer comme terminée"
                  icon={Icon.Checkmark}
                  onAction={() => setStatus(task, "completed")}
                />
              )}
              {task.status === "pending" && (
                <Action
                  title="Commencer la tâche"
                  icon={Icon.Play}
                  onAction={() => setStatus(task, "in_progress")}
                />
              )}
              {task.status === "in_progress" && (
                <Action
                  title="Remettre à faire"
                  icon={Icon.Circle}
                  onAction={() => setStatus(task, "pending")}
                />
              )}
              {task.link && (
                <Action.OpenInBrowser title="Ouvrir le lien" url={task.link} />
              )}
              <Action.CopyToClipboard
                title="Copier le titre"
                content={task.title}
              />
              <Action
                title="Actualiser"
                icon={Icon.RotateClockwise}
                onAction={load}
              />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && tasks.length === 0 && (
        <List.EmptyView
          title="Aucune tâche"
          description="Créez votre première tâche avec la commande Create Task."
        />
      )}
    </List>
  );
}
