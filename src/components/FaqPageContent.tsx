'use client'

import Link from 'next/link'
import { MessageCircleQuestion } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import FaqAccordion from './FaqAccordion'

export default function FaqPageContent() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto px-4">
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
        {t('faq.pageTitle')}
      </h1>
      <p className="text-muted mb-10">
        {t('faq.pageSubtitle')}
      </p>

      <FaqAccordion />

      <div className="mt-16 rounded-2xl bg-surface border border-border p-8 sm:p-10 text-center">
        <MessageCircleQuestion className="w-10 h-10 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {t('faq.moreQuestions')}
        </h2>
        <p className="text-muted mb-6">
          {t('faq.moreQuestionsText')}
        </p>
        <Link
          href="/contact"
          className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark transition"
        >
          {t('faq.contactUs')}
        </Link>
      </div>
    </div>
  )
}
