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

const paletteColorSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(MAX_NAME),
  hex: z.string().max(50),
  role: z.string().max(50),
  locked: z.boolean(),
  shades: z.array(z.object({ shade: z.number(), hex: z.string().max(50) })),
});

export const paletteSchema = z.object({
  name: z.string().min(1).max(MAX_NAME),
  description: z.string().max(MAX_DESCRIPTION).optional().default(''),
  harmony: z.string().min(1).max(50),
  colors: z.array(paletteColorSchema).min(1).max(20),
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

// =========================
// Domain Hub
// =========================
export const domainCompareSchema = z.object({
  name: z.string().min(1).max(253),
  tlds: z.array(z.string().min(1).max(63)).max(12).optional(),
  registrars: z
    .array(z.enum(['cloudflare', 'hostinger', 'ovh']))
    .max(3)
    .optional(),
  includeO2switch: z.boolean().optional(),
});

export const domainPortfolioCreateSchema = z.object({
  name: z.string().min(1).max(253),
  registrar: z.enum(['cloudflare', 'hostinger', 'ovh', 'o2switch', 'other']),
  clientName: z.string().max(MAX_NAME).optional().nullable(),
  clientEmail: z
    .union([z.string().email().max(255), z.literal(''), z.null()])
    .optional(),
  payer: z.enum(['agency', 'client']).optional().default('agency'),
  costYearly: z.number().nonnegative().optional().nullable(),
  sellYearly: z.number().nonnegative().optional().nullable(),
  currency: z.string().min(1).max(10).optional().default('EUR'),
  expiresAt: z.string().max(50).optional().nullable(),
  autoRenew: z.boolean().optional().default(false),
  notes: z.string().max(MAX_DESCRIPTION).optional().nullable(),
  externalId: z.string().max(255).optional().nullable(),
  notificationsEnabled: z.boolean().optional().default(true),
  qontoClientId: z.string().uuid().optional().nullable(),
});

export const domainPortfolioUpdateSchema = domainPortfolioCreateSchema.partial();

export const domainQontoDraftSchema = z.object({
  clientId: z.string().uuid().optional(),
  vatRate: z.number().min(0).max(1).optional().default(0.2),
  dueDays: z.number().int().min(1).max(120).optional().default(30),
  description: z.string().max(500).optional(),
});

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
