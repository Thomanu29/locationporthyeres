import { z } from 'zod'

// Shared by the admin create (POST) and update (PUT) routes
export const promoCodeInputSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((c) => c.toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9]{3,20}$/, 'Code : 3 à 20 lettres ou chiffres')),
  discount_percent: z.number().int().min(1, 'Réduction entre 1 et 100').max(100, 'Réduction entre 1 et 100'),
  is_active: z.boolean().default(true),
  max_uses: z.number().int().min(1).nullable().default(null),
  expires_at: z.string().datetime({ offset: true }).nullable().default(null),
  description: z.string().trim().max(500).nullable().default(null),
})

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Données invalides'
}
