import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

interface BookingEmailData {
  guestName: string
  guestEmail: string
  checkIn: string
  checkOut: string
  nights: number
  guestCount: number
  pricePerNight: number
  cleaningFee: number
  touristTax: number
  totalAmount: number
}

export async function sendConfirmationEmail(data: BookingEmailData) {
  const { guestName, guestEmail, checkIn, checkOut, nights, guestCount, pricePerNight, cleaningFee, touristTax, totalAmount } = data
  const safeName = escapeHtml(guestName)

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Réservation confirmée !</h1>
        <p style="color: #dbeafe; margin: 8px 0 0;">Appartement du Port · Hyères</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Bonjour ${safeName},</p>
        <p>Votre réservation est confirmée. Voici le récapitulatif :</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Arrivée</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(checkIn)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Départ</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(checkOut)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Nuits</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${nights}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Voyageurs</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${guestCount}</td></tr>
        </table>

        <h3 style="margin-top: 24px;">Détail du paiement</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px;">${pricePerNight}€ × ${nights} nuits</td><td style="padding: 8px; text-align: right;">${pricePerNight * nights}€</td></tr>
          <tr><td style="padding: 8px;">Frais de ménage</td><td style="padding: 8px; text-align: right;">${cleaningFee}€</td></tr>
          <tr><td style="padding: 8px;">Taxe de séjour</td><td style="padding: 8px; text-align: right;">${touristTax.toFixed(2)}€</td></tr>
          <tr style="font-weight: bold; border-top: 2px solid #1e40af;"><td style="padding: 8px;">Total</td><td style="padding: 8px; text-align: right;">${totalAmount.toFixed(2)}€</td></tr>
        </table>

        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-top: 24px;">
          <h3 style="margin: 0 0 8px; color: #1e40af;">Infos pratiques</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li>Check-in : à partir de 16h</li>
            <li>Check-out : avant 11h</li>
            <li>Parking privé inclus</li>
            <li>Climatisation salon + chambre</li>
            <li>Navettes Porquerolles à 5 min à pied</li>
          </ul>
        </div>

        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
          Nous vous enverrons les informations d'accès 48h avant votre arrivée.<br>
          Pour toute question, répondez directement à cet email.
        </p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'Appartement du Port <noreply@locationporthyeres.fr>',
    to: guestEmail,
    subject: `Réservation confirmée · ${formatDate(checkIn)} → ${formatDate(checkOut)}`,
    html,
  })
}

export async function sendOwnerNotification(data: BookingEmailData) {
  const { guestName, guestEmail, checkIn, checkOut, nights, guestCount, totalAmount } = data
  const safeName = escapeHtml(guestName)
  const safeEmail = escapeHtml(guestEmail)

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>🎉 Nouvelle réservation !</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Client</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${safeName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Email</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Dates</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(checkIn)} → ${formatDate(checkOut)} (${nights} nuits)</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Voyageurs</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${guestCount}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Total</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${totalAmount.toFixed(2)}€</td></tr>
      </table>
      <p style="margin-top: 16px;"><a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL ?? '')}/admin">Voir dans l'admin →</a></p>
    </div>
  `

  await resend.emails.send({
    from: 'Appartement du Port <noreply@locationporthyeres.fr>',
    to: process.env.NOTIFICATION_EMAIL!,
    subject: `Nouvelle réservation · ${safeName} · ${formatDate(checkIn)}`,
    html,
  })
}

export async function sendReminderEmail(guestName: string, guestEmail: string, checkIn: string) {
  const safeName = escapeHtml(guestName)
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">À bientôt !</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Bonjour ${safeName},</p>
        <p>Votre séjour à l'Appartement du Port de Hyères approche ! Voici les informations pour votre arrivée le <strong>${formatDate(checkIn)}</strong> :</p>

        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 12px; color: #1e40af;">Informations d'accès</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Check-in :</strong> à partir de 16h</li>
            <li><strong>Wi-Fi :</strong> réseau et mot de passe affichés dans l'appartement</li>
            <li><strong>Parking :</strong> place privée incluse (emplacement indiqué à l'arrivée)</li>
            <li><strong>Étage :</strong> 3ème avec ascenseur</li>
          </ul>
        </div>

        <div style="background: #fefce8; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 12px; color: #92400e;">Navettes Porquerolles</h3>
          <p style="margin: 0;">Les navettes partent du port toute la journée (5 min à pied). Pensez à réserver en haute saison sur tlv-tvm.com</p>
        </div>

        <p>Pour toute question, n'hésitez pas à nous contacter.</p>
        <p>Bon voyage !<br>Thomas</p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'Appartement du Port <noreply@locationporthyeres.fr>',
    to: guestEmail,
    subject: `Votre arrivée dans 2 jours · Infos pratiques`,
    html,
  })
}

export async function sendReviewRequestEmail(guestName: string, guestEmail: string) {
  const safeName = escapeHtml(guestName)
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 32px;">
        <p>Bonjour ${safeName},</p>
        <p>Nous espérons que votre séjour à l'Appartement du Port de Hyères vous a plu !</p>
        <p>Votre avis compte beaucoup pour nous et aide les futurs voyageurs. Pourriez-vous prendre quelques instants pour partager votre expérience ?</p>
        <p>Merci beaucoup et à bientôt sur le port de Hyères !</p>
        <p>Thomas</p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'Appartement du Port <noreply@locationporthyeres.fr>',
    to: guestEmail,
    subject: `Comment s'est passé votre séjour, ${safeName} ?`,
    html,
  })
}

export async function sendMessageNotification(guestName: string, guestEmail: string, subject: string | null, message: string) {
  const safeName = escapeHtml(guestName)
  const safeEmail = escapeHtml(guestEmail)
  const safeSubject = subject ? escapeHtml(subject) : 'Sans objet'
  const safeMessage = escapeHtml(message)

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Nouveau message</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>De</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${safeName} (${safeEmail})</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Sujet</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${safeSubject}</td></tr>
      </table>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 16px;">
        <p style="white-space: pre-wrap; margin: 0;">${safeMessage}</p>
      </div>
      <p style="margin-top: 16px;"><a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL ?? '')}/admin">Répondre dans l'admin</a></p>
    </div>
  `

  await resend.emails.send({
    from: 'Appartement du Port <noreply@locationporthyeres.fr>',
    to: process.env.NOTIFICATION_EMAIL!,
    subject: `Nouveau message · ${safeName}`,
    html,
  })
}

export async function sendOwnerReplyNotification(guestName: string, guestEmail: string, replyContent: string, conversationId: string) {
  const safeName = escapeHtml(guestName)
  const safeReply = escapeHtml(replyContent)

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Nouvelle réponse</h1>
        <p style="color: #dbeafe; margin: 4px 0 0;">Appartement du Port · Hyères</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Bonjour ${safeName},</p>
        <p>Vous avez reçu une réponse à votre message :</p>
        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #1e40af;">
          <p style="white-space: pre-wrap; margin: 0; color: #1e3a5c;">${safeReply}</p>
        </div>
        <p style="margin-top: 16px;">
          <a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL ?? '')}/contact?conversation=${conversationId}" style="display: inline-block; background: #1e40af; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Répondre</a>
        </p>
        <p style="margin-top: 16px; color: #6b7280; font-size: 13px;">Cet email a été envoyé suite à votre message sur locationporthyeres.fr</p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'Appartement du Port <noreply@locationporthyeres.fr>',
    to: guestEmail,
    subject: `Réponse à votre message · Appartement du Port`,
    html,
  })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
