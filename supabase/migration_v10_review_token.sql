-- Migration: Add public review-submission token to bookings
-- Mirrors the rc_upload_token pattern (migration_v7) to let guests submit
-- a review via a unique per-booking link, without a full auth system.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS review_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS review_submitted_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_review_token
  ON public.bookings (review_token)
  WHERE review_token IS NOT NULL;
