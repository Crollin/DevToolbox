import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../app';

vi.mock('../../lib/transmute', async () => {
  const actual = await vi.importActual<typeof import('../../lib/transmute')>('../../lib/transmute');
  return {
    ...actual,
    transmuteUploadFile: vi.fn(),
    transmuteConvertFile: vi.fn(),
    transmuteDownloadFile: vi.fn(),
    transmuteHealthCheck: vi.fn(),
  };
});

import {
  transmuteUploadFile,
  transmuteConvertFile,
  transmuteDownloadFile,
  transmuteHealthCheck,
} from '../../lib/transmute';

const mockedUpload = vi.mocked(transmuteUploadFile);
const mockedConvert = vi.mocked(transmuteConvertFile);
const mockedDownload = vi.mocked(transmuteDownloadFile);
const mockedHealth = vi.mocked(transmuteHealthCheck);

describe('Transmute API', () => {
  let authToken: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `transmute-${Date.now()}-${Math.random()}@example.com`,
        password: 'password123',
        name: 'Transmute Test',
      });
    authToken = res.body.token;
  });

  it('GET /api/transmute/status requiert une authentification', async () => {
    const res = await request(app).get('/api/transmute/status');
    expect(res.status).toBe(401);
  });

  it('GET /api/transmute/status retourne le statut', async () => {
    mockedHealth.mockResolvedValue({ configured: true, reachable: true });
    const res = await request(app)
      .get('/api/transmute/status')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ enabled: true, reachable: true });
  });

  it('upload → convert → download (happy path)', async () => {
    mockedUpload.mockResolvedValue({
      id: 'file-1',
      originalFilename: 'photo.jpg',
      mediaType: 'jpg',
      extension: '.jpg',
      sizeBytes: 100,
      compatibleFormats: ['png', 'webp'],
    });
    mockedConvert.mockResolvedValue({
      id: 'file-2',
      originalFilename: 'photo.png',
      mediaType: 'png',
      extension: '.png',
      sizeBytes: 80,
      compatibleFormats: [],
    });
    mockedDownload.mockResolvedValue({
      buffer: Buffer.from('PNGDATA'),
      contentType: 'image/png',
      filename: 'photo.png',
    });

    const uploadRes = await request(app)
      .post('/api/transmute/files')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', Buffer.from('JPEGDATA'), 'photo.jpg');

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.id).toBe('file-1');
    expect(uploadRes.body.compatibleFormats).toEqual(['png', 'webp']);
    expect(mockedUpload).toHaveBeenCalled();

    const convertRes = await request(app)
      .post('/api/transmute/conversions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ fileId: 'file-1', outputFormat: 'png' });

    expect(convertRes.status).toBe(200);
    expect(convertRes.body.id).toBe('file-2');
    expect(mockedConvert).toHaveBeenCalledWith('file-1', 'png');

    const downloadRes = await request(app)
      .get('/api/transmute/files/file-2/download')
      .set('Authorization', `Bearer ${authToken}`);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers['content-type']).toMatch(/image\/png/);
    expect(downloadRes.body.toString()).toBe('PNGDATA');
  });

  it('POST /conversions refuse un body incomplet', async () => {
    const res = await request(app)
      .post('/api/transmute/conversions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ fileId: 'x' });
    expect(res.status).toBe(400);
  });
});
