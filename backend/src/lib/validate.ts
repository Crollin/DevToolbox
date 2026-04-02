import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

const MAX_TITLE = 255;
const MAX_DESCRIPTION = 2000;
const MAX_CODE = 1024 * 1024; // 1 Mo
const MAX_NAME = 255;
const MAX_URL = 2000;
const MAX_SUMMARY = 2000;
const MAX_CONTENT = 200000; // notes markdown (raisonnable pour SQLite)

export const snippetCreateSchema = z.object({
  title: z.string().min(1).max(MAX_TITLE),
  description: z.string().max(MAX_DESCRIPTION).optional().default(''),
  code: z.string().max(MAX_CODE),
  language: z.string().min(1).max(50),
  scope: z.string().min(1).max(50),
  priority: z.number().int().min(0).max(999).optional().default(10),
  tags: z.array(z.string()).optional().default([]),
  folder: z.string().max(100).optional().nullable(),
  isFavorite: z.boolean().optional().default(false),
  wpCodeBoxId: z.number().optional().nullable(),
  cloudId: z.string().max(100).optional().nullable(),
});

export const snippetUpdateSchema = snippetCreateSchema.partial();

export const paletteSchema = z.object({
  name: z.string().min(1).max(MAX_NAME),
  description: z.string().max(MAX_DESCRIPTION).optional().default(''),
  harmony: z.string().min(1).max(50),
  colors: z.array(z.string().max(50)).min(1).max(20),
});

export const commandSchema = z.object({
  name: z.string().min(1).max(MAX_NAME),
  command: z.string().min(1).max(2000),
  description: z.string().max(MAX_DESCRIPTION).optional().default(''),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).optional().default([]),
  isFavorite: z.boolean().optional().default(false),
});

export const querySchema = z.object({
  name: z.string().min(1).max(MAX_NAME),
  description: z.string().max(MAX_DESCRIPTION).optional().nullable(),
  config: z.record(z.string(), z.unknown()),
});

export const toolOrderSchema = z.object({
  toolIds: z.array(z.string().min(1).max(100)).min(1),
});

export const wpcliCommandSchema = z.object({
  command: z.string().min(1).max(500),
  description: z.string().max(MAX_DESCRIPTION).optional().default(''),
  example: z.string().max(500).optional().default(''),
  options: z.string().max(2000).optional().default(''),
  notes: z.string().max(MAX_DESCRIPTION).optional().default(''),
  category: z.string().min(1).max(100),
  difficulty: z.string().min(1).max(50),
  isFavorite: z.boolean().optional().default(false),
});

// =========================
// Knowledge Base (KB)
// =========================
export const kbCategorySchema = z.object({
  name: z.string().min(1).max(MAX_NAME),
  position: z.number().int().min(0).max(9999).optional(),
});

export const kbTagSchema = z.object({
  name: z.string().min(1).max(MAX_NAME),
});

export const kbEntryCreateSchema = z.object({
  title: z.string().min(1).max(MAX_TITLE),
  url: z.string().url().max(MAX_URL).optional().nullable(),
  summary: z.string().max(MAX_SUMMARY).optional().nullable(),
  content: z.string().max(MAX_CONTENT).optional().nullable(),
  categoryId: z.string().min(1).max(100).optional().nullable(),
  tags: z.array(z.string().min(1).max(MAX_NAME)).optional().default([]),
  isFavorite: z.boolean().optional().default(false),
  status: z.enum(['active', 'archived']).optional().default('active'),
});

export const kbEntryUpdateSchema = kbEntryCreateSchema.partial();

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body) as T;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return res.status(400).json({ error: `Données invalides: ${messages}` });
      }
      next(error);
    }
  };
}
