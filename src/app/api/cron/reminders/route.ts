import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendReminderEmail, sendCronFailureAlert } from '@/lib/emails'
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
    const errors: string[] = []
    for (const booking of bookings) {
      try {
        await sendReminderEmail(booking.guest_name, booking.guest_email, booking.check_in)
        sent.push(booking.guest_email)
      } catch (err) {
        console.error(`Failed to send reminder to ${booking.guest_email}:`, err)
        errors.push(`${booking.guest_email}: ${String(err)}`)
      }
    }

    if (errors.length > 0) {
      await sendCronFailureAlert('reminders', errors).catch(() => {})
    }

    return NextResponse.json({ sent })
  } catch (error) {
    console.error('Reminders cron error:', error)
    await sendCronFailureAlert('reminders', [String(error)]).catch(() => {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
