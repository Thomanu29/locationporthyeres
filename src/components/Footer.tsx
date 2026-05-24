import { MapPin, Phone, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white font-semibold text-lg mb-3">Appartement du Port</h3>
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="w-4 h-4 mt-1 shrink-0" />
            <span>Port de Hyères, 83400 Hyères, Var, France</span>
          </div>
          <p className="text-sm text-gray-400">N° enregistrement meublé de tourisme : en cours</p>
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg mb-3">Contact</h3>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 shrink-0" />
            <a href="mailto:thomasmanuguerra@gmail.com" className="hover:text-white transition">
              thomasmanuguerra@gmail.com
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
          <h3 className="text-white font-semibold text-lg mb-3">Liens</h3>
          <ul className="space-y-2">
            <li>
              <a href="/reservation" className="hover:text-white transition">Réserver</a>
            </li>
            <li>
              <a href="/mentions-legales" className="hover:text-white transition">Mentions légales</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Appartement du Port · Hyères. Tous droits réservés.
      </div>
    </footer>
  )
}
