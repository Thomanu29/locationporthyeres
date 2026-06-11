import { CheckCircle, Home, Calendar, Mail, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import DocumentUpload from '@/components/DocumentUpload'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail, sendOwnerNotification } from '@/lib/emails'

async function verifyAndProcessPayment(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return { success: false, error: 'Paiement non confirmé' }
    }

    const bookingId = session.metadata?.booking_id
    if (!bookingId) {
      return { success: false, error: 'Réservation introuvable' }
    }

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return { success: false, error: 'Réservation introuvable' }
    }

    if (booking.payment_status === 'paid') {
      return { success: true, booking }
    }

    await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'paid',
        stripe_payment_intent: session.payment_intent as string,
      })
      .eq('id', bookingId)

    const guestName = session.metadata?.guest_name ?? booking.guest_name
    const guestPhone = session.metadata?.guest_phone ?? null
    const marketingConsent = session.metadata?.marketing_consent === 'true'

    const nameParts = guestName.split(' ')
    const firstName = nameParts[0] ?? ''
    const lastName = nameParts.slice(1).join(' ') || firstName

    try {
      await supabaseAdmin.rpc('upsert_guest_from_booking', {
        p_booking_id: bookingId,
        p_first_name: firstName,
        p_last_name: lastName,
        p_email: booking.guest_email,
        p_phone: guestPhone,
        p_source: 'direct',
      })
    } catch (e) {
      console.error('Guest upsert error:', e)
    }

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

    try {
      await Promise.all([
        sendConfirmationEmail(emailData),
        sendOwnerNotification(emailData),
      ])
    } catch (e) {
      console.error('Email send error:', e)
    }

    if (!booking.stripe_deposit_intent) {
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

    return { success: true, booking: { ...booking, payment_status: 'paid' } }
  } catch (error) {
    console.error('Payment verification error:', error)
    return { success: false, error: 'Erreur de vérification' }
  }
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const params = await searchParams
  const sessionId = params.session_id

  let result = null
  if (sessionId) {
    result = await verifyAndProcessPayment(sessionId)
  }

  const booking = result?.booking

  return (
    <>
      <Header variant="solid" />
      <main className="flex-1 py-10">
        <div className="max-w-2xl mx-auto px-4 text-center">
          {result?.success ? (
            <>
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Réservation confirmée !</h1>
              <p className="text-lg text-muted mb-8">
                Merci pour votre réservation. Vous allez recevoir un email de confirmation avec tous les détails de votre séjour.
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="w-20 h-20 text-amber-500 mx-auto mb-6" />
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {result ? 'Vérification en cours' : 'Confirmation'}
              </h1>
              <p className="text-lg text-muted mb-8">
                {result?.error || 'Votre paiement est en cours de traitement. Vous recevrez un email de confirmation sous peu.'}
              </p>
            </>
          )}

          {booking && (
            <div className="bg-white border border-border rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-lg mb-3">Récapitulatif</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted">Client</span>
                <span>{booking.guest_name}</span>
                <span className="text-muted">Arrivée</span>
                <span>{formatDate(booking.check_in)}</span>
                <span className="text-muted">Départ</span>
                <span>{formatDate(booking.check_out)}</span>
                <span className="text-muted">Nuits</span>
                <span>{booking.nights}</span>
                <span className="text-muted">Voyageurs</span>
                <span>{booking.guest_count}</span>
                <span className="text-muted font-medium pt-2 border-t border-border">Total payé</span>
                <span className="font-bold pt-2 border-t border-border">{Number(booking.total_amount).toFixed(2)}€</span>
              </div>
            </div>
          )}

          {booking && (
            <DocumentUpload bookingId={booking.id} />
          )}

          <div className="bg-surface rounded-xl p-6 mb-8 text-left space-y-4">
            <h2 className="font-semibold text-lg">Prochaines étapes</h2>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Email de confirmation</p>
                <p className="text-sm text-muted">Vérifiez votre boîte de réception (et les spams)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">48h avant votre arrivée</p>
                <p className="text-sm text-muted">Vous recevrez les informations d&apos;accès, le code Wi-Fi et les instructions pratiques</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Home className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Le jour J</p>
                <p className="text-sm text-muted">Check-in à partir de 16h · Parking privé sécurisé inclus</p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="inline-block bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-3 rounded-lg transition"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
