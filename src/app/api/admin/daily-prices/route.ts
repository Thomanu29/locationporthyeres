import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/admin-auth'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_RANGE_DAYS = 730

export async function GET(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const { data, error } = await supabaseAdmin
    .from('daily_prices')
    .select('date, price')
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const body = await req.json()
  const { date, date_from, date_to, price } = body as {
    date?: string
    date_from?: string
    date_to?: string
    price?: number
  }

  const priceNum = Number(price)
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return NextResponse.json({ error: 'Prix invalide' }, { status: 400 })
  }

  // Single day
  if (date) {
    if (!DATE_RE.test(date)) return NextResponse.json({ error: 'Date invalide' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('daily_prices')
      .upsert({ date, price: priceNum }, { onConflict: 'date' })
      .select('date, price')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Range fill
  if (date_from && date_to) {
    if (!DATE_RE.test(date_from) || !DATE_RE.test(date_to)) {
      return NextResponse.json({ error: 'Dates invalides' }, { status: 400 })
    }
    if (date_to < date_from) {
      return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 })
    }

    const rows: { date: string; price: number }[] = []
    const current = new Date(date_from + 'T00:00:00')
    const end = new Date(date_to + 'T00:00:00')
    while (current <= end) {
      rows.push({ date: current.toISOString().slice(0, 10), price: priceNum })
      current.setDate(current.getDate() + 1)
      if (rows.length > MAX_RANGE_DAYS) {
        return NextResponse.json({ error: `Plage trop large (max ${MAX_RANGE_DAYS} jours)` }, { status: 400 })
      }
    }

    const { error } = await supabaseAdmin.from('daily_prices').upsert(rows, { onConflict: 'date' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, updated: rows.length })
  }

  return NextResponse.json({ error: 'date, ou date_from/date_to, requis' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date requise' }, { status: 400 })

  const { error } = await supabaseAdmin.from('daily_prices').delete().eq('date', date)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
