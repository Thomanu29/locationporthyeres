-- Migration: promo codes
-- Codes are stored in UPPERCASE and compared with UPPER() so they are case-insensitive.
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code = UPPER(code) AND code ~ '^[A-Z0-9]{3,20}$'),
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses >= 0),   -- NULL = unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,                                       -- NULL = never expires
  description TEXT,                                             -- internal note
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on with no policy: only the service role (server-side API routes) can read or write.
-- No public SELECT on purpose: the anon key ships in the browser bundle, so a public
-- policy would let anyone list every code. Validation goes through /api/promo/validate.
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Promo code used on a booking
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC;

-- Atomically consume one use of a code. Returns the row only if the code was still
-- usable (active, not expired, not exhausted), so two concurrent checkouts can't
-- both take the last use.
CREATE OR REPLACE FUNCTION claim_promo_code_use(p_code TEXT)
RETURNS SETOF promo_codes
LANGUAGE sql
AS $$
  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE code = UPPER(p_code)
    AND is_active
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses)
  RETURNING *;
$$;

REVOKE EXECUTE ON FUNCTION claim_promo_code_use(TEXT) FROM PUBLIC, anon, authenticated;
