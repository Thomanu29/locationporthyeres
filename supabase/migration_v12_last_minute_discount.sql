-- Migration: last-minute discount settings
-- Applies automatically when check-in is within `last_minute_days` days
-- of today, reducing the accommodation price by `last_minute_discount_percent`.
-- Set last_minute_discount_percent to 0 to disable.
ALTER TABLE public.pricing_settings
  ADD COLUMN IF NOT EXISTS last_minute_discount_percent NUMERIC NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS last_minute_days INT NOT NULL DEFAULT 7;
