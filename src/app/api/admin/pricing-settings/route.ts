import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/admin-auth'

const SETTINGS_COLUMNS = 'default_price, min_nights, last_minute_discount_percent, last_minute_days'

export async function GET(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const { data, error } = await supabaseAdmin
    .from('pricing_settings')
    .select(SETTINGS_COLUMNS)
    .eq('id', 1)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const body = await req.json()
  const { default_price, min_nights, last_minute_discount_percent, last_minute_days } = body as {
    default_price?: number
    min_nights?: number
    last_minute_discount_percent?: number
    last_minute_days?: number
  }

  const update: Record<string, number> = {}
  if (typeof default_price === 'number' && default_price > 0) update.default_price = default_price
  if (typeof min_nights === 'number' && min_nights >= 1) update.min_nights = min_nights
  if (typeof last_minute_discount_percent === 'number' && last_minute_discount_percent >= 0 && last_minute_discount_percent <= 100) {
    update.last_minute_discount_percent = last_minute_discount_percent
  }
  if (typeof last_minute_days === 'number' && last_minute_days >= 0) update.last_minute_days = last_minute_days

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Aucune valeur valide fournie' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('pricing_settings')
    .update(update)
    .eq('id', 1)
    .select(SETTINGS_COLUMNS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
