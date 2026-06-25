-- Enrich ical_sources with sync status and display name
ALTER TABLE public.ical_sources
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- Imported events from external iCal sources (Airbnb, Booking, etc.)
-- Convention: date_end is EXCLUSIVE (first free day), matching iCal DTEND
CREATE TABLE IF NOT EXISTS public.imported_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.ical_sources(id) ON DELETE CASCADE,
  uid TEXT NOT NULL,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_id, uid)
);

CREATE INDEX IF NOT EXISTS idx_imported_events_source ON public.imported_events(source_id);
CREATE INDEX IF NOT EXISTS idx_imported_events_dates ON public.imported_events(date_start, date_end);
