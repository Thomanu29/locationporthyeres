import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail, sendOwnerNotification } from '@/lib/emails'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const bookingId = session.metadata?.booking_id
    const marketingConsent = session.metadata?.marketing_consent === 'true'
    const guestName = session.metadata?.guest_name ?? ''
    const guestPhone = session.metadata?.guest_phone ?? null

    if (!bookingId) {
      return NextResponse.json({ error: 'No booking_id in metadata' }, { status: 400 })
    }

    await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'paid',
        stripe_payment_intent: session.payment_intent as string,
      })
      .eq('id', bookingId)

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (booking) {
      const nameParts = guestName.split(' ')
      const firstName = nameParts[0] ?? ''
      const lastName = nameParts.slice(1).join(' ') || firstName

      await supabaseAdmin.rpc('upsert_guest_from_booking', {
        p_booking_id: bookingId,
        p_first_name: firstName,
        p_last_name: lastName,
        p_email: booking.guest_email,
        p_phone: guestPhone,
        p_source: 'direct',
      })

      if (marketingConsent) {
        await supabaseAdmin
          .from('guests')
          .update({
            marketing_consent: true,
            marketing_consent_at: new Date().toISOString(),
          })
          .eq('email', booking.guest_email)
      }

      const emailData = {
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        nights: booking.nights,
        guestCount: booking.guest_count,
        pricePerNight: booking.price_per_night,
        cleaningFee: booking.cleaning_fee,
        touristTax: booking.tourist_tax,
        totalAmount: booking.total_amount,
      }

      await Promise.all([
        sendConfirmationEmail(emailData),
        sendOwnerNotification(emailData),
      ])

      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string)
        const customerId = paymentIntent.customer as string
        const paymentMethodId = paymentIntent.payment_method as string

        if (customerId && paymentMethodId) {
          const depositIntent = await stripe.paymentIntents.create({
            amount: (booking.deposit_amount ?? 750) * 100,
            currency: 'eur',
            customer: customerId,
            payment_method: paymentMethodId,
            capture_method: 'manual',
            confirm: true,
            off_session: true,
            description: `Caution – Réservation ${booking.check_in} → ${booking.check_out}`,
            metadata: { booking_id: bookingId, type: 'deposit' },
          })

          await supabaseAdmin
            .from('bookings')
            .update({ stripe_deposit_intent: depositIntent.id })
            .eq('id', bookingId)
        }
      } catch (e) {
        console.error('Deposit hold error:', e)
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object
    await supabaseAdmin
      .from('bookings')
      .update({ payment_status: 'cancelled' })
      .eq('stripe_payment_intent', paymentIntent.id)
  }

  return NextResponse.json({ received: true })
}
