-- Add deposit payment intent tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_deposit_intent TEXT;
