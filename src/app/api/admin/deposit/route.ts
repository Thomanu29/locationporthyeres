import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const { booking_id, action } = await req.json()
  if (!booking_id || !['release', 'capture'].includes(action)) {
    return NextResponse.json({ error: 'booking_id et action (release|capture) requis' }, { status: 400 })
  }

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('stripe_deposit_intent, deposit_amount')
    .eq('id', booking_id)
    .single()

  if (!booking?.stripe_deposit_intent) {
    return NextResponse.json({ error: 'Aucune caution trouvée pour cette réservation' }, { status: 404 })
  }

  try {
    if (action === 'release') {
      await stripe.paymentIntents.cancel(booking.stripe_deposit_intent)
      return NextResponse.json({ success: true, message: 'Caution libérée' })
    }

    if (action === 'capture') {
      await stripe.paymentIntents.capture(booking.stripe_deposit_intent)
      return NextResponse.json({ success: true, message: 'Caution débitée' })
    }
  } catch (error) {
    console.error('Deposit action error:', error)
    return NextResponse.json({ error: 'Erreur Stripe' }, { status: 500 })
  }
}
