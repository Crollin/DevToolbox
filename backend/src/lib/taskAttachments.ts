import fs from 'fs';
import path from 'path';

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_TASK = 10;

function uploadsRoot(): string {
  return process.env.UPLOADS_ROOT || path.join(__dirname, '../../data/uploads');
}

export function getTaskUploadDir(userId: string, taskId: string): string {
  return path.join(uploadsRoot(), 'tasks', userId, taskId);
}

export function ensureTaskUploadDir(userId: string, taskId: string): string {
  const dir = getTaskUploadDir(userId, taskId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function removeTaskUploadDir(userId: string, taskId: string): void {
  const dir = getTaskUploadDir(userId, taskId);
  fs.rmSync(dir, { recursive: true, force: true });
}

export function removeAttachmentFile(userId: string, taskId: string, storedFilename: string): void {
  const filePath = path.join(getTaskUploadDir(userId, taskId), path.basename(storedFilename));
  fs.rmSync(filePath, { force: true });
}

export function isPreviewableMime(mime: string): boolean {
  return mime.startsWith('image/') || mime === 'application/pdf';
}

export function sanitizeOriginalFilename(name: string): string {
  const base = path.basename(name).replace(/[^\w.\- ()\[\]]+/g, '_').trim();
  return base.slice(0, 200) || 'fichier';
}
