'use client'

import { useTranslation } from '@/lib/i18n'

export default function MentionsLegalesNote() {
  const { locale } = useTranslation()

  if (locale !== 'en') return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-sm text-blue-800">
      This page contains the legal notices required by French law and is only available in French.
    </div>
  )
}
