export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationChannel = 'ntfy' | 'email' | 'telegram';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  client?: string;
  link?: string;
  tags: string[];
  priority: TaskPriority;
  notificationChannels: NotificationChannel[];
  status: TaskStatus;
  reminderDays?: number[];
  reminderDatetime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  dueDate: string;
  description?: string;
  client?: string;
  link?: string;
  tags?: string[];
  priority?: TaskPriority;
  notificationChannels?: NotificationChannel[];
  reminderDays?: number[];
  reminderDatetime?: string;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Définissez-la dans la config MCP (env) ou dans .env.`
    );
  }
  return value;
}

function apiBaseUrl(): string {
  return requireEnv('DEVTOOLBOX_API_URL').replace(/\/$/, '');
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${requireEnv('DEVTOOLBOX_PAT')}`,
    Accept: 'application/json',
  };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = `${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: HeadersInit = {
    ...authHeaders(),
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const message =
      data && typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : text || res.statusText;
    throw new Error(`HTTP ${res.status} ${method} ${path} — ${message}`);
  }

  return data as T;
}

export async function listTasks(params?: {
  status?: TaskStatus;
  client?: string;
}): Promise<Task[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.client) query.set('client', params.client);
  const qs = query.toString();
  const data = await request<{ tasks: Task[] }>('GET', `/tasks${qs ? `?${qs}` : ''}`);
  return data.tasks ?? [];
}

export async function getTask(id: string): Promise<Task> {
  const data = await request<{ task: Task }>('GET', `/tasks/${encodeURIComponent(id)}`);
  return data.task;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const data = await request<{ task: Task }>('POST', '/tasks', input);
  return data.task;
}

export async function updateTask(id: string, input: TaskInput): Promise<Task> {
  const data = await request<{ task: Task }>('PUT', `/tasks/${encodeURIComponent(id)}`, input);
  return data.task;
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const data = await request<{ task: Task }>('PATCH', `/tasks/${encodeURIComponent(id)}/status`, {
    status,
  });
  return data.task;
}

export async function deleteTask(id: string): Promise<string> {
  const data = await request<{ message?: string }>('DELETE', `/tasks/${encodeURIComponent(id)}`);
  return data.message ?? 'Tâche supprimée';
}

export interface TaskClient {
  id: string;
  name: string;
  color?: string | null;
}

export async function listClients(): Promise<TaskClient[]> {
  const data = await request<{ clients: TaskClient[] }>('GET', '/tasks/clients/list');
  return data.clients ?? [];
}

export async function createClient(name: string): Promise<TaskClient> {
  const data = await request<{ client: TaskClient }>('POST', '/tasks/clients', { name });
  return data.client;
}

export function taskSummary(task: Task): string {
  const parts = [
    `• ${task.title}`,
    `  id: ${task.id}`,
    `  échéance: ${task.dueDate}`,
    `  statut: ${task.status}`,
    `  priorité: ${task.priority}`,
  ];
  if (task.client) parts.push(`  client: ${task.client}`);
  if (task.tags?.length) parts.push(`  tags: ${task.tags.join(', ')}`);
  if (task.description) parts.push(`  description: ${task.description}`);
  return parts.join('\n');
}
