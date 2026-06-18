-- Migration: Add RC upload token to bookings for self-service document upload
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS rc_upload_token UUID DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_rc_upload_token
  ON public.bookings (rc_upload_token)
  WHERE rc_upload_token IS NOT NULL;
