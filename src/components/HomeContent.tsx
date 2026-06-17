'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Star,
  Car,
  Wind,
  WashingMachine,
  Wifi,
  Sun,
  Ship,
  Coffee,
  Bed,
  MapPin,
  Plane,
  ShoppingCart,
  Waves,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface HomeContentProps {
  reviews: Array<{
    id: string
    rating: number
    comment: string
    reviewer_name: string
    reviewer_location: string | null
  }> | null
  galleryPhotos: Array<{
    id: string
    url: string
    alt: string | null
    category: string
  }>
  heroPhoto: { url: string } | null | undefined
  avgRating: string
  minPrice: number
}

export default function HomeContent({ reviews, galleryPhotos, heroPhoto, avgRating, minPrice }: HomeContentProps) {
  const { t, tArray } = useTranslation()

  const equipements = [
    { icon: Car, label: t('home.amenities.parking'), desc: t('home.amenities.parkingDesc') },
    { icon: Wind, label: t('home.amenities.ac'), desc: t('home.amenities.acDesc') },
    { icon: Bed, label: t('home.amenities.beds'), desc: t('home.amenities.bedsDesc') },
    { icon: Wifi, label: t('home.amenities.wifi'), desc: t('home.amenities.wifiDesc') },
    { icon: Sun, label: t('home.amenities.terrace'), desc: t('home.amenities.terraceDesc') },
    { icon: Coffee, label: t('home.amenities.coffee'), desc: t('home.amenities.coffeeDesc') },
    { icon: WashingMachine, label: t('home.amenities.washer'), desc: t('home.amenities.washerDesc') },
    { icon: Ship, label: t('home.amenities.ferry'), desc: t('home.amenities.ferryDesc') },
    { icon: Bed, label: t('home.amenities.baby'), desc: t('home.amenities.babyDesc') },
  ]

  const proximite = [
    { icon: Ship, label: t('home.location.port'), distance: '100m' },
    { icon: ShoppingCart, label: t('home.location.shops'), distance: '20m' },
    { icon: Waves, label: t('home.location.beaches'), distance: '500m' },
    { icon: Plane, label: t('home.location.airport'), distance: '1,5km' },
    { icon: MapPin, label: t('home.location.center'), distance: '5,6km' },
  ]

  const descriptionList = tArray('home.description.list')
  const galleryPlaceholders = tArray('home.gallery.placeholders')

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60 z-10" />
        {heroPhoto ? (
          <Image
            src={heroPhoto.url}
            alt="Appartement du Port de Hyères"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-blue-950" />
        )}
        <div className="relative z-20 text-center text-white px-4 max-w-3xl">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-lg">{avgRating}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            {t('home.hero.title')}
            <br />
            <span className="text-2xl md:text-3xl font-normal">{t('home.hero.subtitle')}</span>
          </h1>
          <p className="text-xl md:text-2xl mb-2 text-white/90">
            {t('home.hero.features')}
          </p>
          <p className="text-lg mb-8 text-amber-300 font-semibold">
            {t('home.hero.priceFrom', { price: minPrice })}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/reservation"
              className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-lg text-lg transition"
            >
              {t('home.hero.ctaBook')}
            </Link>
            <a
              href="#description"
              className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-lg text-lg transition"
            >
              {t('home.hero.ctaDiscover')}
            </a>
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section id="equipements" className="py-20 bg-surface">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('home.amenities.title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {equipements.map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-6 text-center shadow-sm">
                <item.icon className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">{item.label}</h3>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Description */}
      <section id="description" className="py-20">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6">{t('home.description.title')}</h2>
            <p className="text-muted leading-relaxed mb-4">{t('home.description.p1')}</p>
            <p className="text-muted leading-relaxed mb-4">{t('home.description.p2')}</p>
            <ul className="text-muted space-y-2 mb-4">
              {descriptionList.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6">{t('home.location.title')}</h2>
            <p className="text-muted leading-relaxed mb-6">{t('home.location.intro')}</p>
            <div className="space-y-4">
              {proximite.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="text-primary font-semibold">{item.distance}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 bg-surface">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('home.gallery.title')}</h2>
          {galleryPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-200">
                  <Image
                    src={photo.url}
                    alt={photo.alt || photo.category}
                    fill
                    loading="lazy"
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryPlaceholders.map((label) => (
                <div key={label} className="aspect-[4/3] rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <span className="text-primary/50 font-medium">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reviews */}
      <section id="avis" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('home.reviews.title')}</h2>
          {reviews && reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white border border-border rounded-xl p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-foreground mb-4 leading-relaxed">{review.comment}</p>
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span className="font-medium">{review.reviewer_name}</span>
                    {review.reviewer_location && <span>{review.reviewer_location}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">{t('home.reviews.empty')}</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.cta.title')}</h2>
          <p className="text-xl text-blue-100 mb-8">{t('home.cta.subtitle')}</p>
          <Link
            href="/reservation"
            className="inline-block bg-white text-primary font-semibold px-8 py-4 rounded-lg text-lg hover:bg-gray-100 transition"
          >
            {t('home.cta.button')}
          </Link>
        </div>
      </section>
    </main>
  )
}
