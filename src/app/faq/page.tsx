import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FaqAccordion from '@/components/FaqAccordion'
import Link from 'next/link'
import { MessageCircleQuestion } from 'lucide-react'

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
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Questions fréquentes
          </h1>
          <p className="text-muted mb-10">
            Tout ce que vous devez savoir avant votre séjour à l&apos;Appartement du Port.
          </p>

          <FaqAccordion />

          <div className="mt-16 rounded-2xl bg-surface border border-border p-8 sm:p-10 text-center">
            <MessageCircleQuestion className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Vous avez d&apos;autres questions ?
            </h2>
            <p className="text-muted mb-6">
              N&apos;hésitez pas à nous contacter, nous vous répondrons dans les plus brefs délais.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark transition"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
