export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  client?: string;
  link?: string;
  tags: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notificationChannels: Array<'ntfy' | 'email' | 'telegram'>;
  status: 'pending' | 'in_progress' | 'completed';
  reminderDays?: number[];
  reminderDatetime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate: string;
  client?: string;
  link?: string;
  tags?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  notificationChannels?: Array<'ntfy' | 'email' | 'telegram'>;
  reminderDays?: number[];
  reminderDatetime?: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: 'pending' | 'in_progress' | 'completed';
}
