import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_TASK,
  ensureTaskUploadDir,
  getTaskUploadDir,
  removeAttachmentFile,
  isPreviewableMime,
  sanitizeOriginalFilename,
} from '../lib/taskAttachments';

const router = express.Router({ mergeParams: true });

interface AttachmentRow {
  id: string;
  task_id: string;
  user_id: string;
  original_filename: string;
  stored_filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

function formatAttachment(row: AttachmentRow) {
  return {
    id: row.id,
    taskId: row.task_id,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    previewable: isPreviewableMime(row.mime_type),
  };
}

function assertTaskOwnership(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = req.user!.id;
  const taskId = req.params.taskId;
  const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
  if (!task) {
    return res.status(404).json({ error: 'Tâche non trouvée' });
  }
  next();
}

router.use(assertTaskOwnership);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const dir = ensureTaskUploadDir(req.user!.id, req.params.taskId);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: MAX_ATTACHMENT_BYTES },
});

router.get('/', (req, res) => {
  try {
    const userId = req.user!.id;
    const { taskId } = req.params;
    const rows = db.prepare(`
      SELECT * FROM task_attachments
      WHERE task_id = ? AND user_id = ?
      ORDER BY created_at ASC
    `).all(taskId, userId) as AttachmentRow[];
    res.json({ attachments: rows.map(formatAttachment) });
  } catch (error) {
    console.error('Erreur lors de la récupération des pièces jointes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des pièces jointes' });
  }
});

router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Le fichier dépasse la taille maximale de 10 Mo' });
      }
      return res.status(400).json({ error: 'Erreur lors de l\'upload du fichier' });
    }
    if (err) return next(err);

    try {
      const userId = req.user!.id;
      const { taskId } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      const countRow = db.prepare(`
        SELECT COUNT(*) as count FROM task_attachments WHERE task_id = ? AND user_id = ?
      `).get(taskId, userId) as { count: number };
      if (countRow.count >= MAX_ATTACHMENTS_PER_TASK) {
        removeAttachmentFile(userId, taskId, req.file.filename);
        return res.status(400).json({ error: 'Nombre maximum de pièces jointes atteint (10)' });
      }

      const id = uuidv4();
      const now = new Date().toISOString();
      const originalFilename = sanitizeOriginalFilename(req.file.originalname);
      const mimeType = req.file.mimetype || 'application/octet-stream';

      db.prepare(`
        INSERT INTO task_attachments (
          id, task_id, user_id, original_filename, stored_filename, mime_type, size_bytes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        taskId,
        userId,
        originalFilename,
        req.file.filename,
        mimeType,
        req.file.size,
        now,
      );

      const row = db.prepare('SELECT * FROM task_attachments WHERE id = ?').get(id) as AttachmentRow;
      res.status(201).json({ attachment: formatAttachment(row) });
    } catch (error) {
      const userId = req.user!.id;
      const { taskId } = req.params;
      if (req.file) {
        removeAttachmentFile(userId, taskId, req.file.filename);
      }
      console.error('Erreur lors de l\'upload de la pièce jointe:', error);
      res.status(500).json({ error: 'Erreur lors de l\'upload de la pièce jointe' });
    }
  });
});

router.get('/:attachmentId', (req, res) => {
  try {
    const userId = req.user!.id;
    const { taskId, attachmentId } = req.params;

    const attachment = db.prepare(`
      SELECT * FROM task_attachments WHERE id = ? AND task_id = ? AND user_id = ?
    `).get(attachmentId, taskId, userId) as AttachmentRow | undefined;

    if (!attachment) {
      return res.status(404).json({ error: 'Pièce jointe non trouvée' });
    }

    const filePath = path.join(getTaskUploadDir(userId, taskId), attachment.stored_filename);

    res.setHeader('Content-Type', attachment.mime_type);
    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(attachment.original_filename)}"`,
    );
    const stream = fs.createReadStream(filePath);
    stream.on('error', (error: NodeJS.ErrnoException) => {
      console.error('Erreur lors de la lecture de la pièce jointe:', error);
      if (res.headersSent) {
        res.destroy(error);
        return;
      }
      res.removeHeader('Content-Type');
      res.removeHeader('Content-Disposition');
      const status = error.code === 'ENOENT' ? 404 : 500;
      const message = status === 404
        ? 'Fichier non trouvé'
        : 'Erreur lors de la lecture de la pièce jointe';
      res.status(status).json({ error: message });
    });
    stream.pipe(res);
  } catch (error) {
    console.error('Erreur lors de la lecture de la pièce jointe:', error);
    res.status(500).json({ error: 'Erreur lors de la lecture de la pièce jointe' });
  }
});

router.delete('/:attachmentId', (req, res) => {
  try {
    const userId = req.user!.id;
    const { taskId, attachmentId } = req.params;

    const attachment = db.prepare(`
      SELECT * FROM task_attachments WHERE id = ? AND task_id = ? AND user_id = ?
    `).get(attachmentId, taskId, userId) as AttachmentRow | undefined;

    if (!attachment) {
      return res.status(404).json({ error: 'Pièce jointe non trouvée' });
    }

    db.prepare('DELETE FROM task_attachments WHERE id = ? AND task_id = ? AND user_id = ?').run(
      attachmentId,
      taskId,
      userId,
    );
    removeAttachmentFile(userId, taskId, attachment.stored_filename);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la pièce jointe:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la pièce jointe' });
  }
});

export default router;
