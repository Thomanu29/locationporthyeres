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
            <li>Check-in : entre 15h et 17h</li>
            <li>Check-out : avant 10h</li>
            <li>Parking privé inclus</li>
            <li>Linge de lit et serviettes fournis</li>
            <li>Climatisation salon + chambre</li>
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
    to: process.env.NOTIFICATION_EMAIL ?? 'locationporthyeres@gmail.com',
    subject: `Nouvelle réservation · ${safeName} · ${formatDate(checkIn)}`,
    html,
  })
}

export async function sendReminderEmail(guestName: string, guestEmail: string, checkIn: string) {
  const firstName = escapeHtml(guestName.split(' ')[0])

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Bienvenue à Hyères !</h1>
        <p style="color: #dbeafe; margin: 8px 0 0;">Appartement du Port</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Bonjour ${firstName},</p>
        <p>Nous sommes ravis de vous accueillir pour votre séjour.</p>

        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 12px; color: #1e40af;">📍 Adresse du logement</h3>
          <p style="margin: 0;"><strong>26 Avenue Jean d'Agrève</strong><br>83400 Hyères</p>
          <p style="margin: 8px 0 0;">L'appartement se situe au 3ᵉ étage de la résidence et est accessible par ascenseur.</p>
        </div>

        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 12px; color: #1e40af;">🕒 Check-in</h3>
          <p style="margin: 0;">Votre arrivée est prévue entre <strong>15h00 et 17h00</strong>.</p>
        </div>

        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 12px; color: #1e40af;">🚗 Parking privé sécurisé</h3>
          <p style="margin: 0;">Une place de parking est mise à votre disposition durant tout votre séjour.</p>
          <p style="margin: 8px 0 0;"><strong>📍 Adresse du parking :</strong><br>20 bis Avenue Jean d'Agrève<br>83400 Hyères</p>
          <p style="margin: 8px 0 0;">En entrant dans le parking de la résidence, la place se trouve sur la droite. Elle est facilement identifiable grâce à la plaque jaune portant l'immatriculation « 718BBN83 ».</p>
        </div>

        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 12px; color: #1e40af;">📶 Wi-Fi</h3>
          <p style="margin: 0;">Nom du réseau : __________<br>Mot de passe : __________</p>
        </div>

        <p>🛏️ Le logement est préparé avec le linge de lit et les serviettes de toilette.</p>

        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 12px; color: #1e40af;">📍 À proximité immédiate</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Port et restaurants : 20 m</li>
            <li>Commerces alimentaires : 20 m</li>
            <li>Plages : 500 m</li>
          </ul>
        </div>

        <div style="background: #fefce8; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 12px; color: #92400e;">Rappel des principales règles</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Appartement non-fumeur</li>
            <li>Animaux interdits</li>
            <li>Maximum 4 voyageurs</li>
            <li>Fêtes et soirées interdites</li>
            <li>Merci de respecter le calme de la résidence entre 22h00 et 9h00</li>
          </ul>
        </div>

        <p><strong>🕙 Départ :</strong> le départ doit être effectué avant <strong>10h00</strong> le jour de votre départ.</p>

        <p>Si vous avez la moindre question pendant votre séjour, nous restons disponibles et serons heureux de vous aider.</p>
        <p>Nous vous souhaitons un excellent séjour au port de Hyères !</p>
        <p>À bientôt,<br><strong>Lucas</strong></p>
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
    to: process.env.NOTIFICATION_EMAIL ?? 'locationporthyeres@gmail.com',
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
