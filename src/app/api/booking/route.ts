import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { getPricingRules, getDailyPrices, findPricingRule, calculatePrice } from '@/lib/pricing'
import { getUnavailableDates } from '@/lib/ical'
import { formatLocalDate } from '@/lib/date-utils'

const bookingSchema = z.object({
  guest_name: z.string().min(2),
  guest_email: z.string().email(),
  guest_phone: z.string().optional(),
  guest_count: z.number().int().min(1).max(4),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
  marketing_consent: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = bookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

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

    const [rules, dailyPrices] = await Promise.all([
      getPricingRules(),
      getDailyPrices(),
    ])
    const rule = findPricingRule(rules, data.check_in) ?? {
      id: 'default',
      label: 'Standard',
      date_from: '2026-01-01',
      date_to: '2027-12-31',
      price_per_night: 100,
      min_nights: 2,
    }

    const price = calculatePrice(rule, data.check_in, data.check_out, data.guest_count, dailyPrices)

    if (price.nights < rule.min_nights) {
      return NextResponse.json({
        error: `Séjour minimum de ${rule.min_nights} nuits pour cette période`,
      }, { status: 400 })
    }

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
        total_amount: price.total_amount,
        deposit_amount: price.deposit_amount ?? 750,
        notes: data.notes ?? null,
        payment_status: 'pending',
        source: 'direct',
        status: 'confirmed',
      })
      .select()
      .single()

    if (insertError || !booking) {
      console.error('Booking insert error:', insertError)
      return NextResponse.json({ error: 'Erreur lors de la création de la réservation' }, { status: 500 })
    }

    const accommodationTotal = price.accommodation_total ?? (price.price_per_night * price.nights)

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
        guest_name: data.guest_name,
        guest_phone: data.guest_phone ?? '',
      },
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: `Hébergement ${price.nights} nuits` },
            unit_amount: Math.round(accommodationTotal * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Frais de ménage' },
            unit_amount: Math.round(price.cleaning_fee * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'eur',
            product_data: { name: `Linge de lit & serviettes (${price.nights} nuits)` },
            unit_amount: Math.round((price.linen_fee ?? 0) * 100),
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
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://locationporthyeres.fr'}/reservation/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://locationporthyeres.fr'}/reservation`,
    })

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
