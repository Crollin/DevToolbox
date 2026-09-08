import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import {
  TransmuteError,
  transmuteConvertFile,
  transmuteDownloadFile,
  transmuteHealthCheck,
  transmuteUploadFile,
} from '../lib/transmute';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

const router = express.Router();

router.use(authenticateToken);

function handleTransmuteError(err: unknown, res: Response): void {
  if (err instanceof TransmuteError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'Fichier trop volumineux (max 100 Mo).' });
      return;
    }
    res.status(400).json({ error: 'Upload invalide.' });
    return;
  }
  console.error('Erreur Transmute proxy:', err);
  res.status(500).json({ error: 'Erreur interne lors de la conversion.' });
}

router.get('/status', async (_req: Request, res: Response) => {
  try {
    const health = await transmuteHealthCheck();
    res.json({
      enabled: true,
      reachable: health.reachable,
    });
  } catch (err) {
    handleTransmuteError(err, res);
  }
});

router.post('/files', (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      handleTransmuteError(err, res);
      return;
    }
    void (async () => {
      try {
        if (!req.file) {
          res.status(400).json({ error: 'Fichier requis (champ « file »).' });
          return;
        }
        const metadata = await transmuteUploadFile(
          req.file.buffer,
          req.file.originalname || 'upload.bin',
          req.file.mimetype || 'application/octet-stream'
        );
        res.json({
          id: metadata.id,
          originalFilename: metadata.originalFilename,
          mediaType: metadata.mediaType,
          extension: metadata.extension,
          sizeBytes: metadata.sizeBytes,
          compatibleFormats: metadata.compatibleFormats,
        });
      } catch (e) {
        handleTransmuteError(e, res);
      }
    })();
  });
});

router.post('/conversions', async (req: Request, res: Response) => {
  try {
    const fileId = typeof req.body?.fileId === 'string' ? req.body.fileId.trim() : '';
    const outputFormat =
      typeof req.body?.outputFormat === 'string' ? req.body.outputFormat.trim() : '';

    if (!fileId || !outputFormat) {
      res.status(400).json({ error: 'fileId et outputFormat sont requis.' });
      return;
    }

    const metadata = await transmuteConvertFile(fileId, outputFormat);
    res.json({
      id: metadata.id,
      originalFilename: metadata.originalFilename,
      mediaType: metadata.mediaType,
      extension: metadata.extension,
      sizeBytes: metadata.sizeBytes,
      compatibleFormats: metadata.compatibleFormats,
    });
  } catch (err) {
    handleTransmuteError(err, res);
  }
});

router.get('/files/:id/download', async (req: Request, res: Response) => {
  try {
    const fileId = req.params.id;
    if (!fileId) {
      res.status(400).json({ error: 'Identifiant de fichier manquant.' });
      return;
    }

    const { buffer, contentType, filename } = await transmuteDownloadFile(fileId);
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${(filename || `converted-${fileId}`).replace(/"/g, '')}"`
    );
    res.send(buffer);
  } catch (err) {
    handleTransmuteError(err, res);
  }
});

export default router;
