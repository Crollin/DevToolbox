import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_TASK,
  getTaskUploadDir,
  ensureTaskUploadDir,
  removeTaskUploadDir,
  isPreviewableMime,
  sanitizeOriginalFilename,
} from '../../lib/taskAttachments';

describe('taskAttachments helpers', () => {
  const prev = process.env.UPLOADS_ROOT;
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-att-'));
    process.env.UPLOADS_ROOT = tmp;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.UPLOADS_ROOT;
    else process.env.UPLOADS_ROOT = prev;
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('exposes limits 10MB and 10 files', () => {
    expect(MAX_ATTACHMENT_BYTES).toBe(10 * 1024 * 1024);
    expect(MAX_ATTACHMENTS_PER_TASK).toBe(10);
  });

  it('creates upload dir under user/task', () => {
    const dir = ensureTaskUploadDir('u1', 't1');
    expect(dir).toBe(path.join(tmp, 'tasks', 'u1', 't1'));
    expect(fs.existsSync(dir)).toBe(true);
  });

  it('removes upload dir recursively', () => {
    const dir = ensureTaskUploadDir('u1', 't1');
    fs.writeFileSync(path.join(dir, 'a.txt'), 'x');
    removeTaskUploadDir('u1', 't1');
    expect(fs.existsSync(dir)).toBe(false);
  });

  it('detects previewable mimes', () => {
    expect(isPreviewableMime('image/png')).toBe(true);
    expect(isPreviewableMime('application/pdf')).toBe(true);
    expect(isPreviewableMime('application/zip')).toBe(false);
  });

  it('sanitizes filenames', () => {
    expect(sanitizeOriginalFilename('../../etc/passwd')).not.toContain('..');
    expect(sanitizeOriginalFilename('')).toBe('fichier');
  });
});
