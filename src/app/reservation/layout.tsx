import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Réserver · Appartement du Port Hyères',
  description:
    'Réservez votre séjour au port de Hyères. T2 rénové 45m², terrasse, parking, climatisation. Réservation directe sans commission.',
}

export default function ReservationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
