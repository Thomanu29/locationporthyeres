'use client'

import { useTranslation } from '@/lib/i18n'

export default function LanguageSwitcher({ variant = 'transparent' }: { variant?: 'transparent' | 'solid' }) {
  const { locale, setLocale } = useTranslation()
  const isTransparent = variant === 'transparent'

  return (
    <div className={`flex items-center text-sm font-medium ${isTransparent ? 'text-white/80' : 'text-muted'}`}>
      <button
        onClick={() => setLocale('fr')}
        className={`px-1.5 py-0.5 rounded transition ${
          locale === 'fr'
            ? isTransparent
              ? 'text-white font-bold'
              : 'text-foreground font-bold'
            : isTransparent
              ? 'hover:text-white'
              : 'hover:text-foreground'
        }`}
        aria-label="Français"
      >
        FR
      </button>
      <span className="mx-0.5">|</span>
      <button
        onClick={() => setLocale('en')}
        className={`px-1.5 py-0.5 rounded transition ${
          locale === 'en'
            ? isTransparent
              ? 'text-white font-bold'
              : 'text-foreground font-bold'
            : isTransparent
              ? 'hover:text-white'
              : 'hover:text-foreground'
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  )
}
