-- Migration: show all reviews publicly, regardless of is_visible
-- The homepage query no longer filters on is_visible, but the public
-- RLS policy still enforced it at the database level (RLS applies
-- independently of the client query), so it must be relaxed too.
DROP POLICY IF EXISTS "Public read reviews" ON reviews;
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
