import { supabaseAdmin } from './supabase'
import type { PromoCode } from './types'

export type PromoRejection = 'invalid' | 'expired' | 'exhausted'

export const PROMO_ERRORS: Record<PromoRejection, string> = {
  invalid: 'Code invalide',
  expired: 'Code expiré',
  exhausted: 'Code épuisé',
}

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase()
}

export async function findUsablePromoCode(
  rawCode: string,
): Promise<{ ok: true; promo: PromoCode } | { ok: false; reason: PromoRejection }> {
  const code = normalizePromoCode(rawCode)
  if (!/^[A-Z0-9]{3,20}$/.test(code)) return { ok: false, reason: 'invalid' }

  const { data, error } = await supabaseAdmin
    .from('promo_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle()

  if (error) throw new Error(`Failed to fetch promo code: ${error.message}`)
  if (!data || !data.is_active) return { ok: false, reason: 'invalid' }

  const promo = data as PromoCode
  if (promo.expires_at && new Date(promo.expires_at).getTime() <= Date.now()) {
    return { ok: false, reason: 'expired' }
  }
  if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
    return { ok: false, reason: 'exhausted' }
  }
  return { ok: true, promo }
}

// Discount in euros, rounded to the cent. Applies to the stay (accommodation + fees),
// never to the tourist tax, which is owed to the commune in full.
export function computePromoDiscount(amount: number, discountPercent: number): number {
  return Math.round(amount * discountPercent) / 100
}

// Atomically consume one use. Returns false if the code became unusable in the meantime.
export async function claimPromoCodeUse(code: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('claim_promo_code_use', { p_code: code })
  if (error) throw new Error(`Failed to claim promo code: ${error.message}`)
  return Array.isArray(data) && data.length > 0
}
