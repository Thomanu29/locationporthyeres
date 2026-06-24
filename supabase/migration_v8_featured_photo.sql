-- Add is_featured column to photos table
ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
