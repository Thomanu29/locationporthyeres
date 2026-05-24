import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://locationporthyeres.fr'),
  title: 'Appartement Port de Hyères · Porquerolles à pied · 45m²',
  description:
    'Location saisonnière sur le port de Hyères. 45m², terrasse, parking privé, climatisation, 5 min des navettes pour Porquerolles. Réservation directe.',
  keywords:
    'location hyères port, appartement hyères vacances, porquerolles logement, location var bord mer, location saisonnière hyères',
  openGraph: {
    title: 'Appartement Port de Hyères · Porquerolles à pied',
    description:
      "45m², terrasse, parking privé, clim · 5 min des navettes îles d'Or · Réservation directe sans frais",
    images: ['/photos/hero.jpg'],
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
