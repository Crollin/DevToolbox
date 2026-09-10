import { request } from "./api";

export type TaskStatus = "pending" | "in_progress" | "completed";

export type NotificationChannel = "ntfy" | "email" | "telegram";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  client?: string;
  link?: string;
  tags?: string[];
  priority?: "low" | "normal" | "high" | "urgent";
  notificationChannels?: NotificationChannel[];
  status: TaskStatus;
  reminderDatetime?: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  dueDate: string;
  client?: string;
  link?: string;
  tags?: string[];
  priority?: "low" | "normal" | "high" | "urgent";
  notificationChannels?: NotificationChannel[];
  reminderDays?: number[];
  reminderDatetime?: string;
}

export interface TaskClient {
  id: string;
  name: string;
}

export function listTaskClients() {
  return request<{ clients: TaskClient[] }>("/tasks/clients/list").then(
    (data) => data.clients,
  );
}

export function createTaskClient(name: string) {
  return request<{ client: TaskClient }>("/tasks/clients", {
    method: "POST",
    body: JSON.stringify({ name }),
  }).then((data) => data.client);
}

export function listTasks(status?: TaskStatus) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request<{ tasks: Task[] }>(`/tasks${query}`).then(
    (data) => data.tasks,
  );
}

export function createTask(input: TaskInput) {
  return request<{ task: Task }>("/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((data) => data.task);
}

export function updateTaskStatus(id: string, status: TaskStatus) {
  return request<{ task: Task }>(`/tasks/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }).then((data) => data.task);
}

export function getNotificationDefaults() {
  return request<{ notificationChannels: NotificationChannel[] }>(
    "/tasks/notification-defaults",
  ).then((data) =>
    (data.notificationChannels ?? []).filter(
      (channel): channel is NotificationChannel =>
        channel === "ntfy" || channel === "email" || channel === "telegram",
    ),
  );
}
