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
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { getDailyPrices } from '@/lib/pricing'

const equipements = [
  { icon: Car, label: 'Parking sécurisé', desc: 'Place privée à 50m de la résidence' },
  { icon: Wind, label: 'Climatisation', desc: 'Séjour + chambre' },
  { icon: Bed, label: 'Couchages modulables', desc: '1 lit 160x200 ou 2 lits 80x200' },
  { icon: Wifi, label: 'Wi-Fi', desc: 'Connexion haut débit' },
  { icon: Sun, label: 'Terrasse', desc: 'Pour vos moments de détente' },
  { icon: Coffee, label: 'Machine à café', desc: 'Cuisine entièrement équipée' },
  { icon: WashingMachine, label: 'Lave-linge', desc: 'Dans l\'appartement' },
  { icon: Ship, label: 'Navettes îles', desc: 'Port à 20m, Porquerolles accessible' },
]

const proximite = [
  { icon: Ship, label: 'Port & restaurants', distance: '20m' },
  { icon: ShoppingCart, label: 'Commerces', distance: '20m' },
  { icon: Waves, label: 'Plages', distance: '500m' },
  { icon: Plane, label: 'Aéroport Toulon-Hyères', distance: '1,5km' },
  { icon: MapPin, label: 'Centre-ville Hyères', distance: '5,6km' },
]

export default async function HomePage() {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(6)

  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .order('sort_order', { ascending: true })

  const dailyPrices = await getDailyPrices().catch(() => ({}))
  const priceValues = Object.values(dailyPrices)
  const minPrice = priceValues.length > 0 ? Math.min(...priceValues) : 75

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0'

  const heroPhoto = photos?.find((p: { category: string }) => p.category === 'hero')
  const galleryPhotos = photos?.filter((p: { category: string }) => p.category !== 'hero') ?? []

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LodgingBusiness',
            name: 'Appartement du Port · Hyères',
            description: 'T2 rénové 45m² avec terrasse au port de Hyères, à 20m des restaurants et 500m de la plage.',
            url: 'https://locationporthyeres.fr',
            telephone: '',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Port de Hyères',
              addressLocality: 'Hyères',
              postalCode: '83400',
              addressRegion: 'Var',
              addressCountry: 'FR',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 43.0803,
              longitude: 6.1564,
            },
            amenityFeature: [
              { '@type': 'LocationFeatureSpecification', name: 'Parking', value: true },
              { '@type': 'LocationFeatureSpecification', name: 'WiFi', value: true },
              { '@type': 'LocationFeatureSpecification', name: 'Air conditioning', value: true },
            ],
            numberOfRooms: 1,
            floorSize: { '@type': 'QuantitativeValue', value: 45, unitCode: 'MTK' },
            petsAllowed: false,
            smokingAllowed: false,
            checkinTime: '15:00',
            checkoutTime: '09:00',
          }),
        }}
      />
      <Header />
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
              Appartement du Port
              <br />
              <span className="text-2xl md:text-3xl font-normal">Hyères · Porquerolles à pied</span>
            </h1>
            <p className="text-xl md:text-2xl mb-2 text-white/90">
              T2 rénové 45m² · Terrasse · Parking sécurisé · Climatisation
            </p>
            <p className="text-lg mb-8 text-amber-300 font-semibold">
              À partir de {minPrice}€ / nuit
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/reservation"
                className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-lg text-lg transition"
              >
                Voir les disponibilités
              </Link>
              <a
                href="#description"
                className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-lg text-lg transition"
              >
                Découvrir
              </a>
            </div>
          </div>
        </section>

        {/* Équipements */}
        <section id="equipements" className="py-20 bg-surface">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Tout le confort pour vos vacances</h2>
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
              <h2 className="text-3xl font-bold mb-6">Le logement</h2>
              <p className="text-muted leading-relaxed mb-4">
                T2 neuf climatisé avec terrasse au port de Hyères, à 20m des restaurants et 500m
                de la plage. Parking sécurisé privé + Wi-Fi — tout se fait à pied pour un séjour
                sans contrainte.
              </p>
              <p className="text-muted leading-relaxed mb-4">
                Ce magnifique T2 de 45m² entièrement rénové est niché au 3e étage sur 5
                d&apos;une résidence avec ascenseur. Appartement refait à neuf, il allie confort,
                modernité et emplacement exceptionnel.
              </p>
              <ul className="text-muted space-y-2 mb-4">
                <li>Séjour lumineux avec canapé-lit confortable 160x200</li>
                <li>Chambre modulable : 1 lit 160x200 ou 2 lits simples 80x200</li>
                <li>Cuisine entièrement équipée avec machine à café</li>
                <li>Salle de bain moderne</li>
                <li>Climatisation dans le séjour et la chambre</li>
                <li>Terrasse pour vos moments de détente</li>
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Emplacement idéal</h2>
              <p className="text-muted leading-relaxed mb-6">
                Au cœur de la vie hyéroise, tout peut se faire à pied et en bus :
                plages, restaurants, port et commerces. Confort idéal pour vacances
                ou déplacements professionnels.
              </p>
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

        {/* Galerie */}
        <section className="py-20 bg-surface">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Galerie photos</h2>
            {galleryPhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {galleryPhotos.map((photo: { id: string; url: string; alt: string | null; category: string }) => (
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
                {['Salon', 'Chambre', 'Terrasse', 'Cuisine', 'Salle de bain', 'Vue sur le port'].map((label) => (
                  <div key={label} className="aspect-[4/3] rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                    <span className="text-primary/50 font-medium">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Avis */}
        <section id="avis" className="py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Ce que disent nos voyageurs
            </h2>
            {reviews && reviews.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review: { id: string; rating: number; comment: string; reviewer_name: string; reviewer_location: string | null }) => (
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
              <p className="text-center text-muted">Les avis de nos voyageurs apparaîtront ici prochainement.</p>
            )}
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-16 bg-primary text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Réservez en direct · 0% de commission
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Pas de frais de plateforme, vous payez le juste prix.
            </p>
            <Link
              href="/reservation"
              className="inline-block bg-white text-primary font-semibold px-8 py-4 rounded-lg text-lg hover:bg-gray-100 transition"
            >
              Réserver maintenant
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
