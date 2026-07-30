import api from '@/lib/api';
import type { TaskAttachment } from '@/types/task';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function listAttachments(taskId: string): Promise<TaskAttachment[]> {
  const data = await api.get<{ attachments: TaskAttachment[] }>(`/tasks/${taskId}/attachments`);
  return data.attachments;
}

export async function uploadAttachment(taskId: string, file: File): Promise<TaskAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  const data = await api.upload<{ attachment: TaskAttachment }>(`/tasks/${taskId}/attachments`, formData);
  return data.attachment;
}

export async function deleteAttachment(taskId: string, attachmentId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
}

export function attachmentContentUrl(
  taskId: string,
  attachmentId: string,
  download?: boolean,
): string {
  const base = `${API_BASE}/tasks/${taskId}/attachments/${attachmentId}`;
  return download ? `${base}?download=1` : base;
}

export async function fetchAttachmentBlob(taskId: string, attachmentId: string): Promise<Blob> {
  return api.getBlob(`/tasks/${taskId}/attachments/${attachmentId}`);
}
