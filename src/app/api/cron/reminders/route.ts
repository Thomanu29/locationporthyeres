import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendReminderEmail } from '@/lib/emails'
import { addDays, format } from 'date-fns'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const targetDate = format(addDays(new Date(), 2), 'yyyy-MM-dd')

    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('check_in', targetDate)
      .eq('payment_status', 'paid')
      .eq('status', 'confirmed')

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ message: 'No reminders to send' })
    }

    const sent = []
    for (const booking of bookings) {
      try {
        await sendReminderEmail(booking.guest_name, booking.guest_email, booking.check_in)
        sent.push(booking.guest_email)
      } catch (err) {
        console.error(`Failed to send reminder to ${booking.guest_email}:`, err)
      }
    }

    return NextResponse.json({ sent })
  } catch (error) {
    console.error('Reminders cron error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
