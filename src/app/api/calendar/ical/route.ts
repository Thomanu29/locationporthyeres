import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateIcalFeed } from '@/lib/ical'
import type { Booking, BlockedDate } from '@/lib/types'

export async function GET() {
  try {
    const [bookingsRes, blockedRes] = await Promise.all([
      supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('payment_status', 'paid')
        .eq('status', 'confirmed'),
      supabaseAdmin
        .from('blocked_dates')
        .select('*'),
    ])

    if (bookingsRes.error) throw bookingsRes.error
    if (blockedRes.error) throw blockedRes.error

    const icalContent = generateIcalFeed(
      (bookingsRes.data ?? []) as Booking[],
      (blockedRes.data ?? []) as BlockedDate[],
    )

    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="calendar.ics"',
      },
    })
  } catch (error) {
    console.error('iCal export error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
