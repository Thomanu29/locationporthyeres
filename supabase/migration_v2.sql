-- ============================================
-- Migration V2 — Daily prices + Photos + Deposit
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- Table photos (gestion des photos par catégorie)
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  category TEXT NOT NULL,
  url TEXT NOT NULL,
  alt TEXT,
  sort_order INT DEFAULT 0
);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read photos" ON photos FOR SELECT USING (true);

-- Ajout colonne caution sur bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC DEFAULT 0;
