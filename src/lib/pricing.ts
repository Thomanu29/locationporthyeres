import { supabaseAdmin } from './supabase'
import type { PriceCalculation, PricingRule } from './types'
import { formatLocalDate } from './date-utils'

const CLEANING_FEE = 60
const TOURIST_TAX_PER_PERSON_PER_NIGHT = 2.5
const LINEN_FEE_PER_NIGHT = 4
const DEPOSIT_AMOUNT = 750

export async function getPricingRules(): Promise<PricingRule[]> {
  const { data, error } = await supabaseAdmin
    .from('pricing')
    .select('*')
    .order('date_from', { ascending: true })

  if (error) throw new Error(`Failed to fetch pricing rules: ${error.message}`)
  return data ?? []
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

export function findPricingRule(rules: PricingRule[], checkIn: string): PricingRule | null {
  const checkInDate = new Date(checkIn)
  const month = checkInDate.getMonth() + 1
  const day = checkInDate.getDate()
  const checkInMMDD = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

  for (const rule of rules) {
    const fromMMDD = rule.date_from.slice(5)
    const toMMDD = rule.date_to.slice(5)

    if (fromMMDD <= toMMDD) {
      if (checkInMMDD >= fromMMDD && checkInMMDD <= toMMDD) return rule
    } else {
      if (checkInMMDD >= fromMMDD || checkInMMDD <= toMMDD) return rule
    }
  }
  return rules[0] ?? null
}

export function calculatePrice(
  rule: PricingRule,
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
    const dayPrice = dailyPrices[dateStr] ?? rule.price_per_night
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
    min_nights: rule.min_nights,
    rule_label: rule.label,
    accommodation_total: accommodationTotal,
    deposit_amount: DEPOSIT_AMOUNT,
    daily_breakdown: dailyBreakdown,
  }
}
