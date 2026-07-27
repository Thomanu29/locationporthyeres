import { supabaseAdmin } from './supabase'
import type { PriceCalculation, PricingSettings } from './types'
import { formatLocalDate } from './date-utils'

const CLEANING_FEE = 50
const TOURIST_TAX_PER_PERSON_PER_NIGHT = 2.5
const LINEN_FEE_PER_NIGHT = 0
const DEPOSIT_AMOUNT = 300

export async function getPricingSettings(): Promise<PricingSettings> {
  const { data, error } = await supabaseAdmin
    .from('pricing_settings')
    .select('default_price, min_nights')
    .eq('id', 1)
    .single()

  if (error) throw new Error(`Failed to fetch pricing settings: ${error.message}`)
  return data
}

export async function getDailyPrices(): Promise<Record<string, number>> {
  const { data, error } = await supabaseAdmin
    .from('daily_prices')
    .select('date, price')

  if (error) throw new Error(`Failed to fetch daily prices: ${error.message}`)

  const priceMap: Record<string, number> = {}
  for (const row of data ?? []) {
    priceMap[row.date] = Number(row.price)
  }
  return priceMap
}

export function calculatePrice(
  settings: PricingSettings,
  checkIn: string,
  checkOut: string,
  guestCount: number,
  dailyPrices: Record<string, number>
): PriceCalculation {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  let accommodationTotal = 0
  const dailyBreakdown: { date: string; price: number }[] = []
  const current = new Date(start)

  for (let i = 0; i < nights; i++) {
    const dateStr = formatLocalDate(current)
    const dayPrice = dailyPrices[dateStr] ?? settings.default_price
    accommodationTotal += dayPrice
    dailyBreakdown.push({ date: dateStr, price: dayPrice })
    current.setDate(current.getDate() + 1)
  }

  const avgPricePerNight = nights > 0 ? Math.round(accommodationTotal / nights) : 0
  const linenFee = LINEN_FEE_PER_NIGHT * nights
  const touristTax = TOURIST_TAX_PER_PERSON_PER_NIGHT * guestCount * nights
  const totalAmount = accommodationTotal + CLEANING_FEE + linenFee + touristTax

  return {
    price_per_night: avgPricePerNight,
    nights,
    cleaning_fee: CLEANING_FEE,
    linen_fee: linenFee,
    tourist_tax: touristTax,
    total_amount: totalAmount,
    min_nights: settings.min_nights,
    accommodation_total: accommodationTotal,
    deposit_amount: DEPOSIT_AMOUNT,
    daily_breakdown: dailyBreakdown,
  }
}
