import { isTransmuteEnabled } from './features';

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

export class TransmuteError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly upstreamStatus?: number
  ) {
    super(message);
    this.name = 'TransmuteError';
  }
}

export interface TransmuteFileMetadata {
  id: string;
  originalFilename: string;
  mediaType: string;
  extension: string;
  sizeBytes: number;
  sha256Checksum?: string;
  compatibleFormats: string[];
}

export interface TransmuteConfig {
  baseUrl: string;
  apiKey: string;
}

export function getTransmuteConfig(): TransmuteConfig | null {
  if (!isTransmuteEnabled()) return null;
  const baseUrl = process.env.TRANSMUTE_BASE_URL!.trim().replace(/\/$/, '');
  const apiKey = process.env.TRANSMUTE_API_KEY!.trim();
  return { baseUrl, apiKey };
}

function mapUpstreamError(status: number, bodyText: string): TransmuteError {
  if (status === 401 || status === 403) {
    return new TransmuteError(
      'Configuration Transmute invalide (authentification refusée).',
      502,
      status
    );
  }
  if (status === 404) {
    return new TransmuteError('Fichier introuvable côté Transmute.', 404, status);
  }
  if (status === 400 || status === 422) {
    return new TransmuteError(
      'Format incompatible ou requête Transmute invalide.',
      400,
      status
    );
  }
  if (status >= 500) {
    return new TransmuteError('Service Transmute indisponible.', 502, status);
  }
  const snippet = bodyText.slice(0, 200).trim();
  return new TransmuteError(
    snippet || `Erreur Transmute (HTTP ${status}).`,
    502,
    status
  );
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function authHeaders(apiKey: string, extra?: Record<string, string>): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    ...extra,
  };
}

function normalizeUploadResponse(raw: unknown): TransmuteFileMetadata {
  const root = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const meta = (root.metadata && typeof root.metadata === 'object'
    ? root.metadata
    : root) as Record<string, unknown>;

  const id = String(meta.id ?? '');
  if (!id) {
    throw new TransmuteError('Réponse Transmute invalide (id manquant).', 502);
  }

  const compatible = meta.compatible_formats ?? meta.compatibleFormats ?? [];
  const compatibleFormats = Array.isArray(compatible)
    ? compatible.map((f) => String(f))
    : [];

  return {
    id,
    originalFilename: String(meta.original_filename ?? meta.originalFilename ?? 'file'),
    mediaType: String(meta.media_type ?? meta.mediaType ?? ''),
    extension: String(meta.extension ?? ''),
    sizeBytes: Number(meta.size_bytes ?? meta.sizeBytes ?? 0),
    sha256Checksum: meta.sha256_checksum
      ? String(meta.sha256_checksum)
      : meta.sha256Checksum
        ? String(meta.sha256Checksum)
        : undefined,
    compatibleFormats,
  };
}

function normalizeConversionResponse(raw: unknown): TransmuteFileMetadata {
  return normalizeUploadResponse(raw);
}

export async function transmuteUploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<TransmuteFileMetadata> {
  const config = getTransmuteConfig();
  if (!config) {
    throw new TransmuteError('Transmute n’est pas configuré.', 503);
  }

  const formData = new FormData();
  const bytes = new Uint8Array(buffer);
  formData.append('file', new Blob([bytes], { type: mimeType || 'application/octet-stream' }), filename);

  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/api/files`, {
      method: 'POST',
      headers: authHeaders(config.apiKey),
      body: formData,
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new TransmuteError('Délai dépassé lors de l’upload vers Transmute.', 504);
    }
    throw new TransmuteError('Impossible de joindre Transmute.', 502);
  }

  if (!res.ok) {
    const text = await res.text();
    throw mapUpstreamError(res.status, text);
  }

  return normalizeUploadResponse(await parseJsonSafe(res));
}

export async function transmuteConvertFile(
  fileId: string,
  outputFormat: string
): Promise<TransmuteFileMetadata> {
  const config = getTransmuteConfig();
  if (!config) {
    throw new TransmuteError('Transmute n’est pas configuré.', 503);
  }

  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/api/conversions`, {
      method: 'POST',
      headers: authHeaders(config.apiKey, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id: fileId, output_format: outputFormat }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new TransmuteError('Délai dépassé lors de la conversion Transmute.', 504);
    }
    throw new TransmuteError('Impossible de joindre Transmute.', 502);
  }

  if (!res.ok) {
    const text = await res.text();
    throw mapUpstreamError(res.status, text);
  }

  return normalizeConversionResponse(await parseJsonSafe(res));
}

export async function transmuteDownloadFile(
  fileId: string
): Promise<{ buffer: Buffer; contentType: string; filename?: string }> {
  const config = getTransmuteConfig();
  if (!config) {
    throw new TransmuteError('Transmute n’est pas configuré.', 503);
  }

  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/api/files/${encodeURIComponent(fileId)}`, {
      method: 'GET',
      headers: authHeaders(config.apiKey),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new TransmuteError('Délai dépassé lors du téléchargement Transmute.', 504);
    }
    throw new TransmuteError('Impossible de joindre Transmute.', 502);
  }

  if (!res.ok) {
    const text = await res.text();
    throw mapUpstreamError(res.status, text);
  }

  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const disposition = res.headers.get('content-disposition') || '';
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition);
  const filename = match ? decodeURIComponent(match[1].replace(/"/g, '')) : undefined;

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
    filename,
  };
}

export async function transmuteHealthCheck(): Promise<{
  configured: true;
  reachable: boolean;
}> {
  const config = getTransmuteConfig();
  if (!config) {
    throw new TransmuteError('Transmute n’est pas configuré.', 503);
  }

  try {
    const res = await fetch(`${config.baseUrl}/api/files`, {
      method: 'GET',
      headers: authHeaders(config.apiKey),
      signal: AbortSignal.timeout(10_000),
    });
    // 200/401/403 = server answered; network errors = unreachable
    return { configured: true, reachable: res.status < 500 };
  } catch {
    return { configured: true, reachable: false };
  }
}
