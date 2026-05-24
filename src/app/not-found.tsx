import Link from 'next/link'
import { Home, Calendar } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function NotFound() {
  return (
    <>
      <Header variant="solid" />
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="text-center px-4">
          <p className="text-8xl font-bold text-primary mb-4">404</p>
          <h1 className="text-3xl font-bold mb-4">Page introuvable</h1>
          <p className="text-muted mb-8 max-w-md mx-auto">
            La page que vous recherchez n&apos;existe pas ou a été déplacée.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark transition"
            >
              <Home className="w-5 h-5" />
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition"
            >
              <Calendar className="w-5 h-5" />
              Réserver
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
