import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact · Appartement du Port Hyères',
  description:
    'Contactez-nous pour toute question sur votre séjour à l\'Appartement du Port de Hyères.',
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
