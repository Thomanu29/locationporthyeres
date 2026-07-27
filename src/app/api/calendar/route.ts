import { NextRequest, NextResponse } from 'next/server'
import { getUnavailableDates } from '@/lib/ical'
import { getPricingSettings, getDailyPrices, calculatePrice } from '@/lib/pricing'
import { formatLocalDate } from '@/lib/date-utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const checkIn = searchParams.get('check_in')
    const checkOut = searchParams.get('check_out')
    const guests = searchParams.get('guests')

    const [unavailableDates, settings, dailyPrices] = await Promise.all([
      getUnavailableDates(),
      getPricingSettings(),
      getDailyPrices(),
    ])

    if (checkIn && checkOut && guests) {
      const guestCount = parseInt(guests, 10)
      if (isNaN(guestCount) || guestCount < 1 || guestCount > 4) {
        return NextResponse.json({ error: 'Nombre de voyageurs invalide (1-4)' }, { status: 400 })
      }

      const price = calculatePrice(settings, checkIn, checkOut, guestCount, dailyPrices)

      if (price.nights < settings.min_nights) {
        return NextResponse.json({
          error: `Séjour minimum de ${settings.min_nights} nuits`,
          min_nights: settings.min_nights,
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
      daily_prices: dailyPrices,
      default_price: settings.default_price,
      min_nights: settings.min_nights,
    })
  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
