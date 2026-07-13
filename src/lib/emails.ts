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
            <li>Lit parapluie et chaise haute disponibles sur demande</li>
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
          <p style="margin: 0;">Nom du réseau : <strong>Bbox-689FADB2</strong><br>Mot de passe : <strong>NZCbDF64XTs3rt54xf</strong></p>
        </div>

        <p>🛏️ Le logement est préparé avec le linge de lit et les serviettes de toilette.</p>

        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 12px; color: #1e40af;">📍 À proximité immédiate</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Port et restaurants : 100 m</li>
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

export async function sendReviewRequestEmail(guestName: string, guestEmail: string, reviewToken?: string) {
  const safeName = escapeHtml(guestName)
  const firstName = escapeHtml(guestName.split(' ')[0])
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://locationporthyeres.fr'
  const reviewLink = reviewToken ? `${siteUrl}/avis/${reviewToken}` : null

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 32px;">
        <p>Bonjour ${firstName},</p>
        <p>Nous espérons que votre séjour à l'Appartement du Port de Hyères vous a plu !</p>
        <p>Votre avis compte beaucoup pour nous et aide les futurs voyageurs. Pourriez-vous prendre quelques instants pour partager votre expérience ?</p>

        ${reviewLink ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${reviewLink}" style="display: inline-block; background: #1e40af; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Laisser mon avis</a>
        </div>
        <p style="text-align: center; color: #6b7280; font-size: 13px; margin-top: 8px;">Ou copiez ce lien : <a href="${reviewLink}" style="color: #1e40af;">${reviewLink}</a></p>
        ` : ''}

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

export async function sendRcRequestEmail(guestName: string, guestEmail: string, checkIn: string, rcDeadline: string, rcUploadToken?: string) {
  const firstName = escapeHtml(guestName.split(' ')[0])
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://locationporthyeres.fr'
  const uploadLink = rcUploadToken ? `${siteUrl}/rc/${rcUploadToken}` : null

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #b45309, #d97706); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Une dernière formalité</h1>
        <p style="color: #fef3c7; margin: 8px 0 0;">Appartement du Port · Hyères</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Bonjour ${firstName},</p>
        <p>Merci pour votre réservation ! Pour finaliser votre dossier, nous avons besoin de votre <strong>attestation d'assurance responsabilité civile villégiature</strong>.</p>

        <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #991b1b;">Date limite d'envoi</p>
          <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: #dc2626;">${formatDate(rcDeadline)}</p>
        </div>

        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 12px; color: #1e40af;">Qu'est-ce que c'est ?</h3>
          <p style="margin: 0;">L'assurance responsabilité civile villégiature couvre les risques locatifs (incendie, dégât des eaux, etc.) pendant votre séjour. <strong>Elle est très probablement déjà incluse dans votre assurance habitation.</strong></p>
        </div>

        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 12px; color: #1e40af;">Comment l'obtenir ?</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Connectez-vous à l'espace client de votre assureur</li>
            <li>Ou appelez votre assurance habitation</li>
            <li>Demandez une « attestation de responsabilité civile villégiature »</li>
          </ul>
        </div>

        ${uploadLink ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${uploadLink}" style="display: inline-block; background: #1e40af; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Déposer mon attestation</a>
        </div>
        <p style="text-align: center; color: #6b7280; font-size: 13px; margin-top: 8px;">Ou copiez ce lien : <a href="${uploadLink}" style="color: #1e40af;">${uploadLink}</a></p>
        ` : `
        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 12px; color: #1e40af;">Où l'envoyer ?</h3>
          <p style="margin: 0;">Envoyez votre attestation (PDF, photo) à :<br><strong><a href="mailto:locationporthyeres@gmail.com">locationporthyeres@gmail.com</a></strong></p>
        </div>
        `}

        <div style="background: #fefce8; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Important :</strong> sans ce document avant le <strong>${formatDate(rcDeadline)}</strong>, votre réservation sera automatiquement annulée et 20% du montant total sera retenu au titre des frais de gestion.</p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">Si vous avez la moindre question ou difficulté, n'hésitez pas à nous contacter à locationporthyeres@gmail.com.</p>
        <p>À bientôt,<br><strong>Lucas</strong></p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'Appartement du Port <noreply@locationporthyeres.fr>',
    to: guestEmail,
    subject: `⚠️ Action requise — Votre attestation RC pour votre séjour du ${formatDate(checkIn)}`,
    html,
  })
}

export async function sendRcReminderEmail(guestName: string, guestEmail: string, rcDeadline: string, rcUploadToken?: string) {
  const firstName = escapeHtml(guestName.split(' ')[0])
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://locationporthyeres.fr'
  const uploadLink = rcUploadToken ? `${siteUrl}/rc/${rcUploadToken}` : null

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Rappel urgent — RC manquante</h1>
        <p style="color: #fecaca; margin: 8px 0 0;">Appartement du Port · Hyères</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Bonjour ${firstName},</p>
        <p>Nous n'avons pas encore reçu votre attestation d'assurance responsabilité civile villégiature.</p>

        <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 16px; font-weight: bold; color: #dc2626;">Il vous reste 48h</p>
          <p style="margin: 8px 0 0; font-size: 14px; color: #991b1b;">Date limite : <strong>${formatDate(rcDeadline)}</strong></p>
        </div>

        <p><strong>Sans ce document, votre réservation sera automatiquement annulée</strong> et 20% du montant total sera retenu au titre des frais de gestion.</p>

        ${uploadLink ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${uploadLink}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Déposer mon attestation maintenant</a>
        </div>
        ` : `
        <p>Envoyez votre attestation à :<br><strong><a href="mailto:locationporthyeres@gmail.com">locationporthyeres@gmail.com</a></strong></p>
        `}

        <p style="color: #6b7280; font-size: 14px;">Si vous rencontrez des difficultés pour obtenir ce document, contactez-nous rapidement à locationporthyeres@gmail.com — nous trouverons une solution ensemble.</p>
        <p>Lucas</p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'Appartement du Port <noreply@locationporthyeres.fr>',
    to: guestEmail,
    subject: `🔴 Rappel urgent — RC manquante, délai expirant dans 48h`,
    html,
  })
}

export async function sendRcReceivedGuestEmail(guestName: string, guestEmail: string, checkIn: string, checkOut: string) {
  const firstName = escapeHtml(guestName.split(' ')[0])

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Attestation bien reçue !</h1>
        <p style="color: #d1fae5; margin: 8px 0 0;">Appartement du Port · Hyères</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Bonjour ${firstName},</p>
        <p>Nous avons bien reçu votre attestation d'assurance responsabilité civile villégiature. Votre dossier est maintenant <strong>complet</strong>.</p>

        <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 16px; font-weight: bold; color: #059669;">Dossier complet ✓</p>
          <p style="margin: 8px 0 0; font-size: 14px; color: #065f46;">Séjour du ${formatDate(checkIn)} au ${formatDate(checkOut)}</p>
        </div>

        <p>Nous vous enverrons les informations d'accès (adresse, parking, Wi-Fi) <strong>48h avant votre arrivée</strong>.</p>

        <p>À bientôt à Hyères !</p>
        <p>Lucas</p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'Appartement du Port <noreply@locationporthyeres.fr>',
    to: guestEmail,
    subject: `✅ Attestation RC reçue — Votre dossier est complet`,
    html,
  })
}

export async function sendRcReceivedOwnerEmail(guestName: string, checkIn: string, checkOut: string, uploadedViaSite = false) {
  const safeName = escapeHtml(guestName)

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>✅ RC reçue</h2>
      <p><strong>${safeName}</strong> — Séjour du ${formatDate(checkIn)} au ${formatDate(checkOut)}</p>
      <p>L'attestation de responsabilité civile a été ${uploadedViaSite ? 'déposée par le voyageur sur le site' : 'marquée comme reçue'}.</p>
      <p><a href="https://locationporthyeres.fr/admin">Voir dans l'admin →</a></p>
    </div>
  `

  await resend.emails.send({
    from: 'Appartement du Port <noreply@locationporthyeres.fr>',
    to: process.env.NOTIFICATION_EMAIL ?? 'locationporthyeres@gmail.com',
    subject: `✅ RC reçue — ${safeName} · ${formatDate(checkIn)}`,
    html,
  })
}

export async function sendRcCancellationEmail(guestName: string, guestEmail: string, totalAmount: number) {
  const firstName = escapeHtml(guestName.split(' ')[0])
  const retained = (totalAmount * 0.20).toFixed(2)
  const refunded = (totalAmount * 0.80).toFixed(2)

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #991b1b, #dc2626); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Réservation annulée</h1>
        <p style="color: #fecaca; margin: 8px 0 0;">Appartement du Port · Hyères</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Bonjour ${firstName},</p>
        <p>Malgré nos rappels, nous n'avons pas reçu votre attestation d'assurance responsabilité civile villégiature dans le délai imparti.</p>
        <p>Conformément aux conditions acceptées lors de votre réservation, <strong>votre réservation a été annulée</strong>.</p>

        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px;">Montant total</td><td style="padding: 8px; text-align: right;">${totalAmount.toFixed(2)}€</td></tr>
            <tr><td style="padding: 8px;">Montant remboursé (80%)</td><td style="padding: 8px; text-align: right; color: #16a34a; font-weight: bold;">${refunded}€</td></tr>
            <tr style="border-top: 2px solid #e5e7eb;"><td style="padding: 8px;">Frais de gestion retenus (20%)</td><td style="padding: 8px; text-align: right; color: #dc2626; font-weight: bold;">${retained}€</td></tr>
          </table>
        </div>

        <p>Le remboursement de ${refunded}€ sera effectué sur votre carte bancaire sous quelques jours ouvrés.</p>

        <p>Si vous souhaitez re-réserver, nous serons ravis de vous accueillir. Pensez simplement à préparer votre attestation RC dès la réservation.</p>

        <p>Cordialement,<br><strong>Lucas</strong></p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'Appartement du Port <noreply@locationporthyeres.fr>',
    to: guestEmail,
    subject: `❌ Annulation de votre réservation — RC non fournie`,
    html,
  })
}

export async function sendRcExtensionEmail(guestName: string, guestEmail: string, newDeadline: string, checkIn: string, rcUploadToken?: string) {
  const firstName = escapeHtml(guestName.split(' ')[0])
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://locationporthyeres.fr'
  const uploadLink = rcUploadToken ? `${siteUrl}/rc/${rcUploadToken}` : null

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Délai prolongé</h1>
        <p style="color: #dbeafe; margin: 8px 0 0;">Appartement du Port · Hyères</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Bonjour ${firstName},</p>
        <p>Suite à votre contact, nous avons bien pris note de votre situation.</p>
        <p>Le délai pour nous envoyer votre attestation d'assurance responsabilité civile a été prolongé.</p>

        <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #1e40af;">Nouvelle date limite</p>
          <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: #1e40af;">${formatDate(newDeadline)}</p>
        </div>

        ${uploadLink ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${uploadLink}" style="display: inline-block; background: #1e40af; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Déposer mon attestation</a>
        </div>
        ` : `
        <p>Envoyez votre attestation à :<br><strong><a href="mailto:locationporthyeres@gmail.com">locationporthyeres@gmail.com</a></strong></p>
        `}

        <p>Merci de votre compréhension.</p>
        <p>À bientôt,<br><strong>Lucas</strong></p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'Appartement du Port <noreply@locationporthyeres.fr>',
    to: guestEmail,
    subject: `📅 Délai prolongé — Votre attestation RC pour le ${formatDate(checkIn)}`,
    html,
  })
}

export async function sendRcOwnerAlert(bookings: Array<{ guest_name: string; guest_email: string; check_in: string; rc_deadline: string }>) {
  const rows = bookings.map((b) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(b.guest_name)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(b.guest_email)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(b.check_in)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(b.rc_deadline)}</td>
    </tr>
  `).join('')

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>⚠️ RC manquantes — Alerte J+3</h2>
      <p>${bookings.length} réservation(s) n'ont pas encore fourni leur RC et la deadline expire dans 4 jours :</p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 8px; text-align: left;">Client</th>
            <th style="padding: 8px; text-align: left;">Email</th>
            <th style="padding: 8px; text-align: left;">Arrivée</th>
            <th style="padding: 8px; text-align: left;">Deadline</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top: 16px;"><a href="https://locationporthyeres.fr/admin">Gérer dans l'admin →</a></p>
    </div>
  `

  await resend.emails.send({
    from: 'Appartement du Port <noreply@locationporthyeres.fr>',
    to: process.env.NOTIFICATION_EMAIL ?? 'locationporthyeres@gmail.com',
    subject: `⚠️ ${bookings.length} RC manquante(s) — Action requise`,
    html,
  })
}

export async function sendIcalConflictAlert(
  sourceName: string,
  conflicts: Array<{ importStart: string; importEnd: string; bookingStart: string; bookingEnd: string }>,
) {
  const rows = conflicts.map((c) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(c.importStart)} → ${formatDate(c.importEnd)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(c.bookingStart)} → ${formatDate(c.bookingEnd)}</td>
    </tr>
  `).join('')

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">⚠️ Conflit de calendrier détecté</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>La synchronisation <strong>${escapeHtml(sourceName)}</strong> a détecté <strong>${conflicts.length} conflit(s)</strong> avec vos réservations directes :</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: #fef2f2;">
              <th style="padding: 8px; text-align: left; color: #991b1b;">Import (${escapeHtml(sourceName)})</th>
              <th style="padding: 8px; text-align: left; color: #991b1b;">Réservation directe</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color: #991b1b;"><strong>Les dates importées ont été bloquées par sécurité.</strong> Vérifiez manuellement et résolvez le conflit.</p>
        <p><a href="https://locationporthyeres.fr/admin" style="color: #2563eb;">Gérer dans l'admin →</a></p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'Appartement du Port <noreply@locationporthyeres.fr>',
    to: process.env.NOTIFICATION_EMAIL ?? 'locationporthyeres@gmail.com',
    subject: `⚠️ Conflit calendrier ${sourceName} — ${conflicts.length} chevauchement(s)`,
    html,
  })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
