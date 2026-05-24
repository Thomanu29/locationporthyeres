export interface Guest {
  id: string
  created_at: string
  updated_at: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  address_line: string | null
  city: string | null
  postal_code: string | null
  country: string
  notes: string | null
  total_stays: number
  total_nights: number
  total_spent: number
  last_stay_date: string | null
  first_stay_date: string | null
  marketing_consent: boolean
  marketing_consent_at: string | null
  acquisition_source: string | null
  referred_by: string | null
}

export interface Booking {
  id: string
  created_at: string
  guest_id: string | null
  guest_name: string
  guest_email: string
  guest_phone: string | null
  guest_count: number
  check_in: string
  check_out: string
  nights: number
  price_per_night: number
  cleaning_fee: number
  tourist_tax: number
  total_amount: number
  stripe_session_id: string | null
  stripe_payment_intent: string | null
  payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled'
  source: 'direct' | 'airbnb' | 'booking' | 'abritel'
  external_uid: string | null
  notes: string | null
  status: 'confirmed' | 'cancelled' | 'completed'
}

export interface PricingRule {
  id: string
  label: string
  date_from: string
  date_to: string
  price_per_night: number
  min_nights: number
}

export interface Review {
  id: string
  created_at: string
  reviewer_name: string
  reviewer_location: string | null
  rating: number
  comment: string
  stay_date: string | null
  source: 'direct' | 'airbnb' | 'booking' | 'abritel' | 'google'
  is_visible: boolean
}

export interface BlockedDate {
  id: string
  date_start: string
  date_end: string
  reason: string | null
}

export interface IcalSource {
  id: string
  platform: 'airbnb' | 'booking' | 'abritel'
  ical_url: string
  last_sync: string | null
  is_active: boolean
}

export interface PriceCalculation {
  price_per_night: number
  nights: number
  cleaning_fee: number
  tourist_tax: number
  total_amount: number
  min_nights: number
  rule_label: string
  accommodation_total?: number
  deposit_amount?: number
  daily_breakdown?: { date: string; price: number }[]
}

export interface Photo {
  id: string
  created_at: string
  category: string
  url: string
  alt: string | null
  sort_order: number
}

export interface BookingFormData {
  guest_name: string
  guest_email: string
  guest_phone?: string
  guest_count: number
  check_in: string
  check_out: string
  notes?: string
  marketing_consent?: boolean
}
