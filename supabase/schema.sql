-- ============================================
-- Schema complet — Appartement du Port · Hyères
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- Table guests (CRM clients)
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address_line TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  notes TEXT,
  total_stays INT DEFAULT 0,
  total_nights INT DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  last_stay_date DATE,
  first_stay_date DATE,
  marketing_consent BOOL DEFAULT false,
  marketing_consent_at TIMESTAMPTZ,
  acquisition_source TEXT CHECK (acquisition_source IN ('direct','airbnb','booking','abritel','referral','flyer','instagram','other')),
  referred_by UUID REFERENCES guests(id)
);

-- Table bookings (Réservations)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  guest_id UUID REFERENCES guests(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  guest_count INT NOT NULL CHECK (guest_count BETWEEN 1 AND 4),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INT GENERATED ALWAYS AS (check_out - check_in) STORED,
  price_per_night NUMERIC NOT NULL,
  cleaning_fee NUMERIC DEFAULT 60,
  tourist_tax NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded','cancelled')),
  source TEXT DEFAULT 'direct' CHECK (source IN ('direct','airbnb','booking','abritel')),
  external_uid TEXT,
  notes TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','completed'))
);

-- Table pricing (Règles tarifaires)
CREATE TABLE IF NOT EXISTS pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  price_per_night NUMERIC NOT NULL,
  min_nights INT DEFAULT 2
);

-- Table reviews (Avis clients)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewer_name TEXT NOT NULL,
  reviewer_location TEXT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  stay_date DATE,
  source TEXT DEFAULT 'direct' CHECK (source IN ('direct','airbnb','booking','abritel','google')),
  is_visible BOOL DEFAULT true
);

-- Table blocked_dates (Dates bloquées manuellement)
CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  reason TEXT
);

-- Table communications (Historique messages)
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  guest_id UUID REFERENCES guests(id),
  booking_id UUID REFERENCES bookings(id),
  type TEXT NOT NULL CHECK (type IN ('email','sms','whatsapp','note')),
  subject TEXT,
  body TEXT,
  sent_by TEXT DEFAULT 'owner',
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','delivered','failed','draft'))
);

-- Table ical_sources (Flux iCal externes)
CREATE TABLE IF NOT EXISTS ical_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('airbnb','booking','abritel')),
  ical_url TEXT NOT NULL,
  last_sync TIMESTAMPTZ,
  is_active BOOL DEFAULT true
);

-- Vue CRM
CREATE OR REPLACE VIEW guests_crm AS
SELECT g.*,
  g.first_name || ' ' || g.last_name AS full_name,
  (SELECT check_in FROM bookings b WHERE b.guest_id = g.id
    AND b.check_in >= CURRENT_DATE AND b.payment_status = 'paid'
    ORDER BY check_in ASC LIMIT 1) AS next_stay,
  (SELECT COUNT(*) FROM communications c WHERE c.guest_id = g.id) AS comms_count
FROM guests g
ORDER BY last_stay_date DESC NULLS LAST;

-- Fonction upsert guest
CREATE OR REPLACE FUNCTION upsert_guest_from_booking(
  p_booking_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'direct'
) RETURNS UUID AS $$
DECLARE
  v_guest_id UUID;
  v_booking RECORD;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;

  INSERT INTO guests (first_name, last_name, email, phone, acquisition_source, first_stay_date)
  VALUES (p_first_name, p_last_name, p_email, p_phone, p_source, v_booking.check_in)
  ON CONFLICT (email) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, guests.phone),
    updated_at = now()
  RETURNING id INTO v_guest_id;

  UPDATE bookings SET guest_id = v_guest_id WHERE id = p_booking_id;

  UPDATE guests SET
    total_stays = (SELECT COUNT(*) FROM bookings WHERE guest_id = v_guest_id AND payment_status = 'paid'),
    total_nights = (SELECT COALESCE(SUM(nights), 0) FROM bookings WHERE guest_id = v_guest_id AND payment_status = 'paid'),
    total_spent = (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE guest_id = v_guest_id AND payment_status = 'paid'),
    last_stay_date = (SELECT MAX(check_in) FROM bookings WHERE guest_id = v_guest_id AND payment_status = 'paid'),
    first_stay_date = (SELECT MIN(check_in) FROM bookings WHERE guest_id = v_guest_id AND payment_status = 'paid')
  WHERE id = v_guest_id;

  RETURN v_guest_id;
END;
$$ LANGUAGE plpgsql;

-- Données initiales pricing
INSERT INTO pricing (label, date_from, date_to, price_per_night, min_nights) VALUES
  ('Basse saison', '2025-01-01', '2025-02-28', 70, 2),
  ('Printemps', '2025-03-01', '2025-05-31', 110, 3),
  ('Haute saison', '2025-06-01', '2025-06-30', 145, 3),
  ('Peak été', '2025-07-01', '2025-08-31', 155, 5),
  ('Automne', '2025-09-01', '2025-09-30', 145, 3),
  ('Automne', '2025-10-01', '2025-11-30', 95, 2),
  ('Basse saison', '2025-12-01', '2025-12-31', 70, 2);

-- RLS Policies
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ical_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pricing" ON pricing FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "Public read blocked_dates" ON blocked_dates FOR SELECT USING (true);
CREATE POLICY "Public read bookings dates" ON bookings FOR SELECT USING (true);
