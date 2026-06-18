import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/admin-auth'
import { stripe } from '@/lib/stripe'
import {
  sendRcReceivedOwnerEmail,
  sendRcExtensionEmail,
  sendRcCancellationEmail,
} from '@/lib/emails'

export async function PATCH(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const body = await req.json()
  const { action, new_deadline, notes } = body as {
    action: 'received' | 'extend' | 'cancel'
    new_deadline?: string
    notes?: string
  }

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })

  if (action === 'received') {
    await supabaseAdmin
      .from('bookings')
      .update({
        rc_status: 'received',
        rc_received_at: new Date().toISOString(),
      })
      .eq('id', id)

    await sendRcReceivedOwnerEmail(booking.guest_name, booking.check_in, booking.check_out)
    return NextResponse.json({ ok: true })
  }

  if (action === 'extend') {
    if (!new_deadline) return NextResponse.json({ error: 'new_deadline requis' }, { status: 400 })

    await supabaseAdmin
      .from('bookings')
      .update({
        rc_status: 'extended',
        rc_deadline: new_deadline,
        rc_notes: notes ?? null,
        rc_reminder_sent: false,
      })
      .eq('id', id)

    await sendRcExtensionEmail(booking.guest_name, booking.guest_email, new_deadline, booking.check_in, booking.rc_upload_token)
    return NextResponse.json({ ok: true })
  }

  if (action === 'cancel') {
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
      .eq('id', id)

    await sendRcCancellationEmail(booking.guest_name, booking.guest_email, Number(booking.total_amount))
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
