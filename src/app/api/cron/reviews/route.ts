import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendReviewRequestEmail } from '@/lib/emails'
import { subDays, format } from 'date-fns'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const targetDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')

    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('check_out', targetDate)
      .eq('payment_status', 'paid')
      .eq('status', 'confirmed')

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ message: 'No review requests to send' })
    }

    const sent = []
    for (const booking of bookings) {
      try {
        await sendReviewRequestEmail(booking.guest_name, booking.guest_email)
        sent.push(booking.guest_email)
      } catch (err) {
        console.error(`Failed to send review request to ${booking.guest_email}:`, err)
      }
    }

    return NextResponse.json({ sent })
  } catch (error) {
    console.error('Review request cron error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
