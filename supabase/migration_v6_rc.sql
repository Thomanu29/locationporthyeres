-- Migration: Add RC (responsabilité civile) tracking columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS rc_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (rc_status IN ('pending', 'received', 'extended', 'cancelled_no_rc')),
  ADD COLUMN IF NOT EXISTS rc_deadline DATE,
  ADD COLUMN IF NOT EXISTS rc_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rc_notes TEXT,
  ADD COLUMN IF NOT EXISTS rc_reminder_sent BOOL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rc_consent BOOL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_bookings_rc_deadline
  ON public.bookings (rc_deadline)
  WHERE rc_status = 'pending';
