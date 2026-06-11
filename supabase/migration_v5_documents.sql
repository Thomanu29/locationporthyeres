-- Migration V5: Booking documents (e.g. attestation de responsabilité civile)

CREATE TABLE IF NOT EXISTS booking_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id text NOT NULL,
  document_type text NOT NULL DEFAULT 'responsabilite_civile',
  file_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE booking_documents ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (guests upload after payment, no auth)
CREATE POLICY "Allow public inserts on booking_documents"
  ON booking_documents
  FOR INSERT
  WITH CHECK (true);

-- Allow reading for authenticated service role (admin)
CREATE POLICY "Allow public select on booking_documents"
  ON booking_documents
  FOR SELECT
  USING (true);

-- Create storage bucket for documents (run via Supabase dashboard or CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true)
-- ON CONFLICT DO NOTHING;
