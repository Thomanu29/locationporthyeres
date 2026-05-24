import { NextRequest, NextResponse } from 'next/server'
import { getUnavailableDates } from '@/lib/ical'
import { getPricingRules, getDailyPrices, findPricingRule, calculatePrice } from '@/lib/pricing'
import { formatLocalDate } from '@/lib/date-utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const checkIn = searchParams.get('check_in')
    const checkOut = searchParams.get('check_out')
    const guests = searchParams.get('guests')

    const [unavailableDates, pricingRules, dailyPrices] = await Promise.all([
      getUnavailableDates(),
      getPricingRules(),
      getDailyPrices(),
    ])

    if (checkIn && checkOut && guests) {
      const guestCount = parseInt(guests, 10)
      if (isNaN(guestCount) || guestCount < 1 || guestCount > 4) {
        return NextResponse.json({ error: 'Nombre de voyageurs invalide (1-4)' }, { status: 400 })
      }

      const rule = findPricingRule(pricingRules, checkIn) ?? {
        id: 'default',
        label: 'Standard',
        date_from: '2026-01-01',
        date_to: '2027-12-31',
        price_per_night: 100,
        min_nights: 2,
      }

      const price = calculatePrice(rule, checkIn, checkOut, guestCount, dailyPrices)

      if (price.nights < rule.min_nights) {
        return NextResponse.json({
          error: `Séjour minimum de ${rule.min_nights} nuits pour cette période (${rule.label})`,
          min_nights: rule.min_nights,
        }, { status: 400 })
      }

      const startDate = new Date(checkIn)
      const endDate = new Date(checkOut)
      const current = new Date(startDate)
      while (current < endDate) {
        const dateStr = formatLocalDate(current)
        if (unavailableDates.includes(dateStr)) {
          return NextResponse.json({ error: 'Certaines dates ne sont pas disponibles' }, { status: 409 })
        }
        current.setDate(current.getDate() + 1)
      }

      return NextResponse.json({ ...price, unavailable_dates: unavailableDates })
    }

    return NextResponse.json({
      unavailable_dates: unavailableDates,
      pricing_rules: pricingRules,
    })
  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
