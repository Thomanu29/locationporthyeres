import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { getPricingSettings, getDailyPrices, calculatePrice } from '@/lib/pricing'
import { getUnavailableDates } from '@/lib/ical'
import { formatLocalDate } from '@/lib/date-utils'
import { findUsablePromoCode, computePromoDiscount, claimPromoCodeUse, PROMO_ERRORS } from '@/lib/promo'
import type { PromoCode } from '@/lib/types'

const bookingSchema = z.object({
  guest_name: z.string().min(2),
  guest_email: z.string().email(),
  guest_phone: z.string().optional(),
  guest_count: z.number().int().min(1).max(4),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
  marketing_consent: z.boolean().optional(),
  rc_consent: z.boolean(),
  promo_code: z.string().max(50).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = bookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    if (!data.rc_consent) {
      return NextResponse.json({ error: 'Vous devez accepter les conditions relatives à la responsabilité civile' }, { status: 400 })
    }

    const unavailable = await getUnavailableDates()
    const startDate = new Date(data.check_in)
    const endDate = new Date(data.check_out)
    const current = new Date(startDate)
    while (current < endDate) {
      if (unavailable.includes(formatLocalDate(current))) {
        return NextResponse.json({ error: 'Dates non disponibles' }, { status: 409 })
      }
      current.setDate(current.getDate() + 1)
    }

    const [settings, dailyPrices] = await Promise.all([
      getPricingSettings(),
      getDailyPrices(),
    ])

    const price = calculatePrice(settings, data.check_in, data.check_out, data.guest_count, dailyPrices)

    if (price.nights < settings.min_nights) {
      return NextResponse.json({
        error: `Séjour minimum de ${settings.min_nights} nuits`,
      }, { status: 400 })
    }

    // Never trust the client's discount: revalidate the code and recompute it here.
    // The discount applies to the stay, not to the tourist tax.
    let promo: PromoCode | null = null
    let promoDiscount = 0
    if (data.promo_code?.trim()) {
      const result = await findUsablePromoCode(data.promo_code)
      if (!result.ok) {
        return NextResponse.json({
          error: `Code promo : ${PROMO_ERRORS[result.reason]}`,
          promo_error: result.reason,
        }, { status: 409 })
      }
      promo = result.promo
      promoDiscount = computePromoDiscount(price.total_amount - price.tourist_tax, promo.discount_percent)
    }
    const totalAmount = Math.round((price.total_amount - promoDiscount) * 100) / 100

    const { data: booking, error: insertError } = await supabaseAdmin
      .from('bookings')
      .insert({
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone ?? null,
        guest_count: data.guest_count,
        check_in: data.check_in,
        check_out: data.check_out,
        price_per_night: price.price_per_night,
        cleaning_fee: price.cleaning_fee,
        tourist_tax: price.tourist_tax,
        total_amount: totalAmount,
        deposit_amount: price.deposit_amount ?? 750,
        notes: data.notes ?? null,
        payment_status: 'pending',
        source: 'direct',
        status: 'confirmed',
        // Only sent when a code is used, so bookings keep working before the promo migration runs
        ...(promo ? { promo_code: promo.code, discount_amount: promoDiscount } : {}),
      })
      .select()
      .single()

    if (insertError || !booking) {
      console.error('Booking insert error:', insertError)
      return NextResponse.json({ error: 'Erreur lors de la création de la réservation' }, { status: 500 })
    }

    const accommodationTotal = price.accommodation_total ?? (price.price_per_night * price.nights)

    // Spread the promo discount over the stay lines (accommodation first, then fees)
    // so Stripe charges exactly totalAmount; the tourist tax line is never reduced.
    let discountLeft = Math.round(promoDiscount * 100)
    const discounted = (cents: number) => {
      const off = Math.min(cents, discountLeft)
      discountLeft -= off
      return cents - off
    }
    const accommodationCents = discounted(Math.round(accommodationTotal * 100))
    const cleaningCents = discounted(Math.round(price.cleaning_fee * 100))
    const linenCents = discounted(Math.round((price.linen_fee ?? 0) * 100))

    const lineItems = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: promo
              ? `Hébergement ${price.nights} nuits (code ${promo.code} -${promo.discount_percent}%)`
              : `Hébergement ${price.nights} nuits`,
          },
          unit_amount: accommodationCents,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'eur',
          product_data: { name: 'Frais de fonctionnement' },
          unit_amount: cleaningCents,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'eur',
          product_data: { name: 'Taxe de séjour' },
          unit_amount: Math.round(price.tourist_tax * 100),
        },
        quantity: 1,
      },
    ]

    if ((price.linen_fee ?? 0) > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: `Linge de lit & serviettes (${price.nights} nuits)` },
          unit_amount: linenCents,
        },
        quantity: 1,
      })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: data.guest_email,
      payment_intent_data: {
        setup_future_usage: 'off_session',
      },
      metadata: {
        booking_id: booking.id,
        marketing_consent: data.marketing_consent ? 'true' : 'false',
        rc_consent: data.rc_consent ? 'true' : 'false',
        guest_name: data.guest_name,
        guest_phone: data.guest_phone ?? '',
        promo_code: promo?.code ?? '',
      },
      // A 100% promo code zeroes the stay lines; leave them out rather than send 0 € items
      line_items: lineItems.filter((item) => item.price_data.unit_amount > 0),
      success_url: `https://locationporthyeres.fr/reservation/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://locationporthyeres.fr/reservation`,
    })

    // Count the use only once the Stripe session exists. The claim is atomic: if the code
    // expired or ran out since validation, cancel this checkout instead of over-using it.
    if (promo && !(await claimPromoCodeUse(promo.code))) {
      await stripe.checkout.sessions.expire(session.id).catch(() => {})
      await supabaseAdmin
        .from('bookings')
        .update({ payment_status: 'cancelled', status: 'cancelled', stripe_session_id: session.id })
        .eq('id', booking.id)
      return NextResponse.json({
        error: 'Code promo : ce code vient d\'expirer ou d\'être épuisé. Retirez-le pour continuer.',
        promo_error: 'exhausted',
      }, { status: 409 })
    }

    await supabaseAdmin
      .from('bookings')
      .update({ stripe_session_id: session.id })
      .eq('id', booking.id)

    return NextResponse.json({ checkout_url: session.url })
  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
