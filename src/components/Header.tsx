'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Anchor, Menu, X, Home } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import LanguageSwitcher from './LanguageSwitcher'

const AIRBNB_URL = 'https://www.airbnb.fr/rooms/1663808086920838841'

export default function Header({ variant = 'transparent' }: { variant?: 'transparent' | 'solid' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isTransparent = variant === 'transparent'
  const { t } = useTranslation()

  const navLinks = [
    { href: '/#equipements', label: t('header.amenities') },
    { href: '/#avis', label: t('header.reviews') },
    { href: '/faq', label: t('header.faq') },
    { href: '/contact', label: t('header.contact') },
  ]

  return (
    <header className={isTransparent ? 'absolute top-0 left-0 right-0 z-50' : 'sticky top-0 z-50 bg-white border-b border-border'}>
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className={`flex items-center gap-2 font-semibold text-lg ${isTransparent ? 'text-white' : 'text-foreground'}`}>
          <Anchor className="w-6 h-6" />
          <span>{t('header.home')}</span>
        </Link>
        <div className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition hidden sm:block ${isTransparent ? 'text-white/80 hover:text-white' : 'text-muted hover:text-foreground'}`}
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher variant={variant} />
          <a
            href={AIRBNB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 bg-[#FF385C] text-white font-semibold px-3 py-2 rounded-lg text-sm hover:bg-[#E31C5F] transition"
            aria-label={t('header.airbnb')}
          >
            <Home className="w-4 h-4" fill="currentColor" />
            Airbnb
          </a>
          <Link
            href="/reservation"
            className={`font-semibold px-4 py-2 rounded-lg transition ${isTransparent ? 'bg-white text-primary hover:bg-gray-100' : 'bg-primary text-white hover:bg-primary-dark'}`}
          >
            {t('header.book')}
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`sm:hidden p-1 ${isTransparent ? 'text-white' : 'text-foreground'}`}
            aria-label={menuOpen ? t('header.closeMenu') : t('header.openMenu')}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className={`px-4 pb-4 flex flex-col gap-3 ${isTransparent ? 'bg-black/30 backdrop-blur-sm' : 'bg-white border-t border-border'}`}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`transition py-2 ${isTransparent ? 'text-white/90 hover:text-white' : 'text-muted hover:text-foreground'}`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={AIRBNB_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-1.5 w-fit bg-[#FF385C] text-white font-semibold px-3 py-2 rounded-lg text-sm"
          >
            <Home className="w-4 h-4" fill="currentColor" />
            Airbnb
          </a>
        </div>
      </div>
    </header>
  )
}
