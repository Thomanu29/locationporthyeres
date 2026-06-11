'use client'

import { MapPin, Phone, Mail } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white font-semibold text-lg mb-3">{t('header.home')}</h3>
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="w-4 h-4 mt-1 shrink-0" />
            <span>{t('footer.address')}</span>
          </div>
          <p className="text-sm text-gray-400">{t('footer.registration')}</p>
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg mb-3">{t('footer.contact')}</h3>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 shrink-0" />
            <a href="mailto:locationporthyeres@gmail.com" className="hover:text-white transition">
              locationporthyeres@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 shrink-0" />
            <a href="tel:+33600000000" className="hover:text-white transition">
              +33 6 00 00 00 00
            </a>
          </div>
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg mb-3">{t('footer.links')}</h3>
          <ul className="space-y-2">
            <li>
              <a href="/reservation" className="hover:text-white transition">{t('footer.book')}</a>
            </li>
            <li>
              <a href="/mentions-legales" className="hover:text-white transition">{t('footer.legal')}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} {t('footer.copyright')}
      </div>
    </footer>
  )
}
