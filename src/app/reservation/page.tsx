'use client'

import { useState, useEffect, useCallback } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import { fr } from 'date-fns/locale'
import { format, differenceInDays, addDays } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Users,
  Calendar,
  CreditCard,
  Info,
  Clock,
  PawPrint,
  CigaretteOff,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import type { PricingRule, PriceCalculation } from '@/lib/types'

const formSchema = z.object({
  guest_name: z.string().min(2, 'Nom requis (2 caractères min.)'),
  guest_email: z.string().email('Email invalide'),
  guest_phone: z.string().optional(),
  notes: z.string().optional(),
  marketing_consent: z.boolean().optional(),
})

type FormData = z.infer<typeof formSchema>

export default function ReservationPage() {
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([])
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [guestCount, setGuestCount] = useState(2)
  const [price, setPrice] = useState<PriceCalculation | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  useEffect(() => {
    fetch('/api/calendar')
      .then((r) => r.json())
      .then((data) => {
        if (data.unavailable_dates) {
          setUnavailableDates(
            data.unavailable_dates.map((d: string) => new Date(d + 'T00:00:00'))
          )
        }
        if (data.pricing_rules) {
          setPricingRules(data.pricing_rules)
        }
      })
      .catch(console.error)
  }, [])

  const fetchPrice = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) {
      setPrice(null)
      setPriceError(null)
      return
    }

    setLoading(true)
    setPriceError(null)

    const checkIn = format(dateRange.from, 'yyyy-MM-dd')
    const checkOut = format(dateRange.to, 'yyyy-MM-dd')

    try {
      const res = await fetch(
        `/api/calendar?check_in=${checkIn}&check_out=${checkOut}&guests=${guestCount}`
      )
      const data = await res.json()

      if (!res.ok) {
        setPriceError(data.error || 'Erreur de calcul')
        setPrice(null)
      } else {
        setPrice(data)
        setPriceError(null)
      }
    } catch {
      setPriceError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [dateRange, guestCount])

  useEffect(() => {
    fetchPrice()
  }, [fetchPrice])

  const onSubmit = async (formData: FormData) => {
    if (!dateRange?.from || !dateRange?.to || !price) return

    setSubmitting(true)

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: formData.guest_name,
          guest_email: formData.guest_email,
          guest_phone: formData.guest_phone || undefined,
          guest_count: guestCount,
          check_in: format(dateRange.from, 'yyyy-MM-dd'),
          check_out: format(dateRange.to, 'yyyy-MM-dd'),
          notes: formData.notes || undefined,
          marketing_consent: formData.marketing_consent || false,
        }),
      })

      const data = await res.json()

      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        alert(data.error || 'Erreur lors de la réservation')
      }
    } catch {
      alert('Erreur de connexion')
    } finally {
      setSubmitting(false)
    }
  }

  const nights =
    dateRange?.from && dateRange?.to
      ? differenceInDays(dateRange.to, dateRange.from)
      : 0

  const currentRule = pricingRules.find((rule) => {
    if (!dateRange?.from) return false
    const month = dateRange.from.getMonth() + 1
    const day = dateRange.from.getDate()
    const checkMMDD = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    const fromMMDD = rule.date_from.slice(5)
    const toMMDD = rule.date_to.slice(5)
    if (fromMMDD <= toMMDD) {
      return checkMMDD >= fromMMDD && checkMMDD <= toMMDD
    }
    return checkMMDD >= fromMMDD || checkMMDD <= toMMDD
  })

  return (
    <>
      <Header variant="solid" />
      <main className="flex-1 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Réserver votre séjour</h1>
          <p className="text-muted mb-8">
            Appartement du Port · Hyères · Réservation directe sans frais
          </p>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Calendar + Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Calendar */}
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Choisissez vos dates
                </h2>
                <DayPicker
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={fr}
                  numberOfMonths={2}
                  disabled={[
                    { before: addDays(new Date(), 1) },
                    ...unavailableDates.map((d) => d),
                  ]}
                  modifiersClassNames={{
                    selected: 'rdp-selected',
                    range_start: 'rdp-range-start',
                    range_end: 'rdp-range-end',
                    range_middle: 'rdp-range-middle',
                  }}
                />
                {currentRule && (
                  <p className="text-sm text-muted mt-2">
                    Période : {currentRule.label} · {currentRule.price_per_night}€/nuit · min. {currentRule.min_nights} nuits
                  </p>
                )}
              </div>

              {/* Guest Count */}
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Nombre de voyageurs
                </h2>
                <div className="flex items-center gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setGuestCount(n)}
                      className={`w-14 h-14 rounded-xl font-semibold text-lg transition ${
                        guestCount === n
                          ? 'bg-primary text-white'
                          : 'bg-surface text-foreground hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Booking Form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white border border-border rounded-xl p-6 space-y-4"
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Vos informations
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom complet *</label>
                    <input
                      {...register('guest_name')}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Jean Dupont"
                    />
                    {errors.guest_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.guest_name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      {...register('guest_email')}
                      type="email"
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="jean@email.com"
                    />
                    {errors.guest_email && (
                      <p className="text-red-500 text-sm mt-1">{errors.guest_email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input
                    {...register('guest_phone')}
                    type="tel"
                    className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+33 6 00 00 00 00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message (optionnel)</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Heure d'arrivée, demandes spéciales..."
                  />
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    {...register('marketing_consent')}
                    type="checkbox"
                    className="mt-1 rounded border-border"
                  />
                  <span className="text-sm text-muted">
                    J&apos;accepte de recevoir des offres et actualités par email (RGPD — désinscription possible à tout moment)
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!dateRange?.from || !dateRange?.to || !price || submitting || !!priceError}
                  className="w-full bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white font-semibold py-3.5 rounded-lg text-lg transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Redirection vers le paiement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Payer {price ? `${price.total_amount.toFixed(2)}€` : ''}
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted">
                  <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" />SSL chiffré</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />Paiement sécurisé par Stripe</span>
                </div>
              </form>
            </div>

            {/* Right: Price Summary + Info */}
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Price Summary */}
              <div className="bg-white border border-border rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-4">Récapitulatif</h3>

                {priceError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                    {priceError}
                  </div>
                )}

                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}

                {price && !loading && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Hébergement ({price.nights} nuits)</span>
                      <span>{(price.accommodation_total ?? price.price_per_night * price.nights).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted">
                      <span>~{price.price_per_night}€/nuit en moyenne</span>
                      <span></span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de ménage</span>
                      <span>{price.cleaning_fee}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxe de séjour</span>
                      <span>{price.tourist_tax.toFixed(2)}€</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{price.total_amount.toFixed(2)}€</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex justify-between text-sm text-muted">
                        <span>Caution (non débitée)</span>
                        <span>{price.deposit_amount ?? 750}€</span>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        Empreinte bancaire de {price.deposit_amount ?? 750}€ — restituée sous 7 jours après le départ si aucun dommage constaté.
                      </p>
                    </div>
                  </div>
                )}

                {!price && !loading && !priceError && (
                  <p className="text-muted text-sm">
                    Sélectionnez vos dates pour voir le prix.
                  </p>
                )}

                {dateRange?.from && dateRange?.to && (
                  <div className="mt-4 pt-4 border-t border-border text-sm text-muted space-y-1">
                    <p>Arrivée : {format(dateRange.from, 'dd MMMM yyyy', { locale: fr })}</p>
                    <p>Départ : {format(dateRange.to, 'dd MMMM yyyy', { locale: fr })}</p>
                    <p>{nights} nuit{nights > 1 ? 's' : ''} · {guestCount} voyageur{guestCount > 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>

              {/* Practical Info */}
              <div className="bg-surface rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Infos pratiques
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted shrink-0" />
                    <span>Arrivée : 15h-17h · Départ : avant 9h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PawPrint className="w-4 h-4 text-muted shrink-0" />
                    <span>Animaux interdits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CigaretteOff className="w-4 h-4 text-muted shrink-0" />
                    <span>Logement strictement non-fumeur</span>
                  </div>
                </div>
              </div>

              {/* Règlement */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-3">
                <h3 className="font-semibold text-sm">Règlement intérieur</h3>
                <ul className="text-xs text-amber-800 space-y-2">
                  <li>Maximum 4 voyageurs. Fêtes, soirées et visiteurs non déclarés interdits.</li>
                  <li>Non-fumeur : des frais de désodorisation (500€ min.) seront facturés en cas de non-respect.</li>
                  <li>Animaux interdits quelle que soit leur taille.</li>
                  <li>Horaires calmes : 22h - 9h.</li>
                  <li>Caution de 750€ par empreinte bancaire, restituée sous 7 jours après le départ.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
