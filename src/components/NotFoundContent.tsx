'use client'

import Link from 'next/link'
import { Home, Calendar } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export default function NotFoundContent() {
  const { t } = useTranslation()

  return (
    <div className="text-center px-4">
      <p className="text-8xl font-bold text-primary mb-4">404</p>
      <h1 className="text-3xl font-bold mb-4">{t('notFound.title')}</h1>
      <p className="text-muted mb-8 max-w-md mx-auto">
        {t('notFound.message')}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark transition"
        >
          <Home className="w-5 h-5" />
          {t('notFound.home')}
        </Link>
        <Link
          href="/reservation"
          className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition"
        >
          <Calendar className="w-5 h-5" />
          {t('notFound.book')}
        </Link>
      </div>
    </div>
  )
}
