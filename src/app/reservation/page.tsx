'use client'

import { useState, useEffect, useCallback } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import { fr as frLocale, enUS as enLocale } from 'date-fns/locale'
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
import RentalContract from '@/components/RentalContract'
import { useTranslation } from '@/lib/i18n'
import type { PricingRule, PriceCalculation } from '@/lib/types'

export default function ReservationPage() {
  const { t, tArray, locale } = useTranslation()

  const formSchema = z.object({
    guest_name: z.string().min(2, t('reservation.validation.nameRequired')),
    guest_email: z.string().email(t('reservation.validation.emailInvalid')),
    guest_phone: z.string().optional(),
    notes: z.string().optional(),
    marketing_consent: z.boolean().optional(),
  })

  type FormData = z.infer<typeof formSchema>

  const [unavailableDates, setUnavailableDates] = useState<Date[]>([])
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [guestCount, setGuestCount] = useState(2)
  const [price, setPrice] = useState<PriceCalculation | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [contractOpen, setContractOpen] = useState(false)
  const [contractAccepted, setContractAccepted] = useState(false)

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
        setPriceError(data.error || t('reservation.validation.calcError'))
        setPrice(null)
      } else {
        setPrice(data)
        setPriceError(null)
      }
    } catch {
      setPriceError(t('reservation.validation.connectionError'))
    } finally {
      setLoading(false)
    }
  }, [dateRange, guestCount, t])

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
        alert(data.error || t('reservation.validation.bookingError'))
      }
    } catch {
      alert(t('reservation.validation.connectionError'))
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

  const dateLocale = locale === 'fr' ? frLocale : enLocale
  const rulesItems = tArray('reservation.rules.items')

  // Contract labels (kept in French for legal compliance, with English translation for the checkbox label)
  const contractCheckboxLabel = locale === 'en'
    ? 'I have read and accept the'
    : "J'ai lu et j'accepte le"
  const contractLinkLabel = locale === 'en'
    ? 'rental agreement'
    : 'contrat de location'

  return (
    <>
      <Header variant="solid" />
      <main className="flex-1 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('reservation.title')}</h1>
          <p className="text-muted mb-8">{t('reservation.subtitle')}</p>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Calendar + Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Calendar */}
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {t('reservation.dates.title')}
                </h2>
                <DayPicker
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={dateLocale}
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
                    {t('reservation.dates.period', { label: currentRule.label, price: currentRule.price_per_night, nights: currentRule.min_nights })}
                  </p>
                )}
              </div>

              {/* Guest Count */}
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {t('reservation.guests.title')}
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
                  {t('reservation.form.title')}
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('reservation.form.fullName')}</label>
                    <input
                      {...register('guest_name')}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={t('reservation.form.fullNamePlaceholder')}
                    />
                    {errors.guest_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.guest_name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('reservation.form.email')}</label>
                    <input
                      {...register('guest_email')}
                      type="email"
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={t('reservation.form.emailPlaceholder')}
                    />
                    {errors.guest_email && (
                      <p className="text-red-500 text-sm mt-1">{errors.guest_email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('reservation.form.phone')}</label>
                  <input
                    {...register('guest_phone')}
                    type="tel"
                    className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('reservation.form.phonePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('reservation.form.message')}</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder={t('reservation.form.messagePlaceholder')}
                  />
                  <p className="text-xs text-muted mt-1">{t('reservation.form.messageHint')}</p>
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    {...register('marketing_consent')}
                    type="checkbox"
                    className="mt-1 rounded border-border"
                  />
                  <span className="text-sm text-muted">
                    {t('reservation.form.marketingConsent')}
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contractAccepted}
                    onChange={(e) => setContractAccepted(e.target.checked)}
                    className="mt-1 rounded border-border"
                  />
                  <span className="text-sm">
                    {contractCheckboxLabel}{' '}
                    <button
                      type="button"
                      onClick={() => setContractOpen(true)}
                      className="text-primary underline hover:text-primary-dark"
                    >
                      {contractLinkLabel}
                    </button>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!dateRange?.from || !dateRange?.to || !price || submitting || !!priceError || !contractAccepted}
                  className="w-full bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white font-semibold py-3.5 rounded-lg text-lg transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('reservation.form.paying')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      {t('reservation.form.payButton', { amount: price ? `${price.total_amount.toFixed(2)}€` : '' })}
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted">
                  <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" />{t('reservation.form.sslEncrypted')}</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />{t('reservation.form.securePayment')}</span>
                </div>
              </form>
            </div>

            {/* Right: Price Summary + Info */}
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Price Summary */}
              <div className="bg-white border border-border rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-4">{t('reservation.summary.title')}</h3>

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
                      <span>{t('reservation.summary.accommodation', { nights: price.nights })}</span>
                      <span>{(price.accommodation_total ?? price.price_per_night * price.nights).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted">
                      <span>{t('reservation.summary.avgPerNight', { price: price.price_per_night })}</span>
                      <span></span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('reservation.summary.cleaningFee')}</span>
                      <span>{price.cleaning_fee}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('reservation.summary.linenFee', { nights: price.nights })}</span>
                      <span>{price.linen_fee}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('reservation.summary.touristTax')}</span>
                      <span>{price.tourist_tax.toFixed(2)}€</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                      <span>{t('reservation.summary.total')}</span>
                      <span>{price.total_amount.toFixed(2)}€</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex justify-between text-sm text-muted">
                        <span>{t('reservation.summary.deposit')}</span>
                        <span>{price.deposit_amount ?? 750}€</span>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        {t('reservation.summary.depositInfo', { amount: price.deposit_amount ?? 750 })}
                      </p>
                    </div>
                  </div>
                )}

                {!price && !loading && !priceError && (
                  <p className="text-muted text-sm">
                    {t('reservation.summary.selectDates')}
                  </p>
                )}

                {dateRange?.from && dateRange?.to && (
                  <div className="mt-4 pt-4 border-t border-border text-sm text-muted space-y-1">
                    <p>{t('reservation.summary.checkIn')} : {format(dateRange.from, 'dd MMMM yyyy', { locale: dateLocale })}</p>
                    <p>{t('reservation.summary.checkOut')} : {format(dateRange.to, 'dd MMMM yyyy', { locale: dateLocale })}</p>
                    <p>{t('reservation.summary.nightCount', { nights, plural: nights > 1 ? 's' : '', guests: guestCount, guestPlural: guestCount > 1 ? 's' : '' })}</p>
                  </div>
                )}
              </div>

              {/* Practical Info */}
              <div className="bg-surface rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  {t('reservation.info.title')}
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted shrink-0" />
                    <span>{t('reservation.info.checkTimes')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PawPrint className="w-4 h-4 text-muted shrink-0" />
                    <span>{t('reservation.info.noPets')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CigaretteOff className="w-4 h-4 text-muted shrink-0" />
                    <span>{t('reservation.info.noSmoking')}</span>
                  </div>
                </div>
              </div>

              {/* Rules */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-3">
                <h3 className="font-semibold text-sm">{t('reservation.rules.title')}</h3>
                <ul className="text-xs text-amber-800 space-y-2">
                  {rulesItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <RentalContract
        open={contractOpen}
        onClose={() => setContractOpen(false)}
        onAccept={() => setContractAccepted(true)}
        checkIn={dateRange?.from ? format(dateRange.from, 'dd MMMM yyyy', { locale: frLocale }) : undefined}
        checkOut={dateRange?.to ? format(dateRange.to, 'dd MMMM yyyy', { locale: frLocale }) : undefined}
        guestCount={guestCount}
        totalAmount={price?.total_amount}
        nights={nights}
      />
    </>
  )
}
