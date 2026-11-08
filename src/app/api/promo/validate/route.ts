import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { findUsablePromoCode, computePromoDiscount, PROMO_ERRORS } from '@/lib/promo'

const schema = z.object({
  code: z.string().min(1).max(50),
  amount: z.number().nonnegative(), // amount the discount applies to, in euros
})

// Public: tells the guest whether a code is usable and what it saves.
// The discount is recomputed server-side in /api/booking, never trusted from here.
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ valid: false, reason: 'invalid', error: PROMO_ERRORS.invalid }, { status: 400 })
    }

    const result = await findUsablePromoCode(parsed.data.code)
    if (!result.ok) {
      return NextResponse.json({ valid: false, reason: result.reason, error: PROMO_ERRORS[result.reason] })
    }

    const { amount } = parsed.data
    const discount_amount = computePromoDiscount(amount, result.promo.discount_percent)
    return NextResponse.json({
      valid: true,
      code: result.promo.code,
      discount_percent: result.promo.discount_percent,
      discount_amount,
      final_amount: Math.round((amount - discount_amount) * 100) / 100,
    })
  } catch (error) {
    console.error('Promo validate error:', error)
    return NextResponse.json({ valid: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
