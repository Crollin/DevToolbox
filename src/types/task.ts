export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  client?: string;
  link?: string;
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
  reminderDays?: number[];
  reminderDatetime?: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: 'pending' | 'in_progress' | 'completed';
}

