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
  deposit_amount?: number
  stripe_deposit_intent?: string | null
  rc_status: 'pending' | 'received' | 'extended' | 'cancelled_no_rc'
  rc_deadline: string | null
  rc_received_at: string | null
  rc_notes: string | null
  rc_reminder_sent: boolean
  rc_consent: boolean
  rc_upload_token: string | null
  review_token: string | null
  review_submitted_at: string | null
}

export interface PricingSettings {
  default_price: number
  min_nights: number
  last_minute_discount_percent: number
  last_minute_days: number
}

export interface DailyPrice {
  date: string
  price: number
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
  name: string | null
  platform: 'airbnb' | 'booking' | 'abritel' | 'leboncoin' | 'other'
  ical_url: string
  last_sync: string | null
  is_active: boolean
  sync_status: 'pending' | 'ok' | 'error'
  sync_error: string | null
}

// Convention: date_end is EXCLUSIVE (first free day), matching iCal DTEND
export interface ImportedEvent {
  id: string
  source_id: string
  uid: string
  date_start: string
  date_end: string
  summary: string | null
  created_at: string
}

export interface PriceCalculation {
  price_per_night: number
  nights: number
  cleaning_fee: number
  tourist_tax: number
  total_amount: number
  min_nights: number
  accommodation_total?: number
  accommodation_total_before_discount?: number
  discount_percent?: number
  discount_amount?: number
  linen_fee?: number
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
  is_featured: boolean
}

export interface BookingDocument {
  id: string
  booking_id: string
  document_type: string
  file_url: string
  uploaded_at: string
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
