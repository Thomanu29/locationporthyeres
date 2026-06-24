import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { format, addDays } from 'date-fns'
import {
  sendRcReminderEmail,
  sendRcCancellationEmail,
  sendRcOwnerAlert,
} from '@/lib/emails'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const results = { reminders: 0, cancelled: 0, ownerAlerts: 0 }

  try {
    // Action 1a: First reminder at J+7 (8 days before deadline)
    const firstReminderDate = format(addDays(new Date(), 8), 'yyyy-MM-dd')
    const { data: firstReminders } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('rc_status', 'pending')
      .eq('rc_reminder_sent', false)
      .eq('rc_deadline', firstReminderDate)
      .eq('payment_status', 'paid')

    for (const booking of firstReminders ?? []) {
      try {
        await sendRcReminderEmail(booking.guest_name, booking.guest_email, booking.rc_deadline, booking.rc_upload_token)
        await supabaseAdmin
          .from('bookings')
          .update({ rc_reminder_sent: true })
          .eq('id', booking.id)
        results.reminders++
      } catch (err) {
        console.error(`RC first reminder failed for ${booking.guest_email}:`, err)
      }
    }

    // Action 1b: Final reminder at J+13 (2 days before deadline)
    const finalReminderDate = format(addDays(new Date(), 2), 'yyyy-MM-dd')
    const { data: finalReminders } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('rc_status', 'pending')
      .eq('rc_deadline', finalReminderDate)
      .eq('payment_status', 'paid')

    for (const booking of finalReminders ?? []) {
      try {
        await sendRcReminderEmail(booking.guest_name, booking.guest_email, booking.rc_deadline, booking.rc_upload_token)
        results.reminders++
      } catch (err) {
        console.error(`RC final reminder failed for ${booking.guest_email}:`, err)
      }
    }

    // Action 2: Cancel bookings with expired deadline
    const { data: expired } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('rc_status', 'pending')
      .lt('rc_deadline', today)
      .eq('payment_status', 'paid')

    for (const booking of expired ?? []) {
      try {
        if (booking.stripe_payment_intent) {
          const refundAmount = Math.round(Number(booking.total_amount) * 0.80 * 100)
          await stripe.refunds.create({
            payment_intent: booking.stripe_payment_intent,
            amount: refundAmount,
          })
        }

        await supabaseAdmin
          .from('bookings')
          .update({
            rc_status: 'cancelled_no_rc',
            status: 'cancelled',
            payment_status: 'refunded',
          })
          .eq('id', booking.id)

        await sendRcCancellationEmail(booking.guest_name, booking.guest_email, Number(booking.total_amount))
        results.cancelled++
      } catch (err) {
        console.error(`RC cancellation failed for ${booking.guest_email}:`, err)
      }
    }

    // Action 3: Notify owner of pending RCs at J+10 (5 days before deadline)
    const alertDate = format(addDays(new Date(), 5), 'yyyy-MM-dd')
    const { data: pendingAlerts } = await supabaseAdmin
      .from('bookings')
      .select('guest_name, guest_email, check_in, rc_deadline')
      .eq('rc_status', 'pending')
      .eq('rc_deadline', alertDate)
      .eq('payment_status', 'paid')

    if (pendingAlerts && pendingAlerts.length > 0) {
      await sendRcOwnerAlert(pendingAlerts)
      results.ownerAlerts = pendingAlerts.length
    }

    return NextResponse.json({ ok: true, ...results })
  } catch (error) {
    console.error('RC check cron error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
