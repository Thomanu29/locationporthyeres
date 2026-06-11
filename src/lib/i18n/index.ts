'use client'

import { useContext, useCallback } from 'react'
import { LanguageContext } from '@/components/LanguageProvider'
import fr from './fr.json'
import en from './en.json'

export type Locale = 'fr' | 'en'

const translations: Record<Locale, Record<string, unknown>> = { fr, en }

function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return path
    }
    current = (current as Record<string, unknown>)[key]
  }
  if (typeof current === 'string') return current
  if (Array.isArray(current)) return JSON.stringify(current)
  return path
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }

  const { locale, setLocale } = context

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = getNestedValue(translations[locale], key)
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
        }
      }
      return value
    },
    [locale]
  )

  const tArray = useCallback(
    (key: string): string[] => {
      const keys = key.split('.')
      let current: unknown = translations[locale]
      for (const k of keys) {
        if (current === null || current === undefined || typeof current !== 'object') {
          return []
        }
        current = (current as Record<string, unknown>)[k]
      }
      if (Array.isArray(current)) return current as string[]
      return []
    },
    [locale]
  )

  const tFaqSections = useCallback((): Array<{
    title: string
    items: Array<{ question: string; answer: string }>
  }> => {
    const sections = translations[locale] as Record<string, unknown>
    const faq = sections['faq'] as Record<string, unknown> | undefined
    if (!faq) return []
    const s = faq['sections']
    if (Array.isArray(s)) return s as Array<{ title: string; items: Array<{ question: string; answer: string }> }>
    return []
  }, [locale])

  return { t, tArray, tFaqSections, locale, setLocale }
}
