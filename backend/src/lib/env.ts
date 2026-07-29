import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  DB_PATH: z.string().optional(),
  PORT: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  EMAIL_PROVIDER: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  /** Active le module Domain Hub (défaut : désactivé). */
  DOMAIN_HUB_ENABLED: z.string().optional(),
  // Domain Hub — registrars (optionnels)
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  HOSTINGER_API_TOKEN: z.string().optional(),
  OVH_APP_KEY: z.string().optional(),
  OVH_APP_SECRET: z.string().optional(),
  OVH_CONSUMER_KEY: z.string().optional(),
  OVH_SUBSIDIARY: z.string().optional(),
  DOMAIN_USD_EUR_RATE: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const messages = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
    console.error('Variables d\'environnement invalides:\n', messages);
    process.exit(1);
  }

  const env = result.data;

  if (env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
      console.error('Erreur: JWT_SECRET doit être défini et contenir au moins 16 caractères en production.');
      process.exit(1);
    }
    const corsOrigin = process.env.CORS_ORIGIN;
    if (!corsOrigin || corsOrigin === '') {
      console.error('Erreur: CORS_ORIGIN doit être défini en production (URL du frontend).');
      process.exit(1);
    }
  }

  return env;
}
