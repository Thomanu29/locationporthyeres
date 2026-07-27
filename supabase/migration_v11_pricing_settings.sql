-- Migration: replace date-range pricing rules with a single global
-- fallback price + min-nights setting. Day-by-day prices now live
-- entirely in the existing daily_prices table (see daily_prices_migration.sql),
-- edited from the admin's new "Tarifs" calendar UI.
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_price NUMERIC NOT NULL DEFAULT 100,
  min_nights INT NOT NULL DEFAULT 2
);

INSERT INTO public.pricing_settings (id, default_price, min_nights)
VALUES (1, 100, 2)
ON CONFLICT (id) DO NOTHING;

-- The old rules-based "pricing" table is no longer read by the app.
-- Safe to drop once you've confirmed the new pricing tab works as expected:
-- DROP TABLE IF EXISTS public.pricing;
