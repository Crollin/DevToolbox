import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Couleur hex invalide (#RGB ou #RRGGBB)');

const logoUrl = z
  .string()
  .max(2048)
  .refine(
    (v) => {
      if (!v) return true;
      try {
        const u = new URL(v);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'logoUrl doit être une URL http(s) ou vide' }
  );

export const emailPreferencesSchema = z.object({
  companyName: z.string().max(200).optional().default(''),
  signature: z.string().max(200).optional().default(''),
  primaryColor: hexColor.optional().default('#0066CC'),
  secondaryColor: hexColor.optional().default('#004499'),
  logoUrl: logoUrl.optional().default(''),
  welcomeText: z.string().max(5000).optional().default(''),
  licencesText: z.string().max(5000).optional().default(''),
  tasksText: z.string().max(5000).optional().default(''),
});

export type EmailPreferencesInput = z.infer<typeof emailPreferencesSchema>;
