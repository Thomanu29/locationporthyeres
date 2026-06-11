import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FaqPageContent from '@/components/FaqPageContent'

export const metadata = {
  title: 'FAQ · Appartement du Port Hyères',
  description:
    'Questions fréquentes sur la location de l\'Appartement du Port à Hyères : arrivée, parking, équipements, Porquerolles.',
}

export default function FaqPage() {
  return (
    <>
      <Header variant="solid" />
      <main className="flex-1 py-16">
        <FaqPageContent />
      </main>
      <Footer />
    </>
  )
}
