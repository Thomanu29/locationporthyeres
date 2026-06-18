import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HomeContent from '@/components/HomeContent'
import { supabase } from '@/lib/supabase'
import { getDailyPrices } from '@/lib/pricing'

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
            description: 'T2 rénové 45m² avec loggia fermée sur le port de Hyères, à 20m des restaurants et 500m de la plage.',
            url: 'https://locationporthyeres.fr',
            telephone: '+33650670355',
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
            checkoutTime: '10:00',
          }),
        }}
      />
      <Header />
      <HomeContent
        reviews={reviews as HomeContentProps['reviews']}
        galleryPhotos={galleryPhotos as HomeContentProps['galleryPhotos']}
        heroPhoto={heroPhoto as HomeContentProps['heroPhoto']}
        avgRating={avgRating}
        minPrice={minPrice}
      />
      <Footer />
    </>
  )
}

// Type helper for props — matches HomeContent component interface
type HomeContentProps = {
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
