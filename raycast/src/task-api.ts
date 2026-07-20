import { request } from "./api";

export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  client?: string;
  link?: string;
  status: TaskStatus;
  reminderDatetime?: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  dueDate: string;
  client?: string;
  link?: string;
  reminderDays?: number[];
  reminderDatetime?: string;
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
