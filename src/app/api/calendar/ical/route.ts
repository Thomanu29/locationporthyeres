import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateIcalFeed } from '@/lib/ical'
import type { Booking } from '@/lib/types'

export async function GET() {
  try {
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('payment_status', 'paid')
      .eq('status', 'confirmed')

    if (error) throw error

    const icalContent = generateIcalFeed((bookings ?? []) as Booking[])

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
