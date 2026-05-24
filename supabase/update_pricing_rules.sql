-- Update pricing rules to 2026-2027 (aligned with daily_prices)
DELETE FROM pricing;

INSERT INTO pricing (label, date_from, date_to, price_per_night, min_nights) VALUES
  ('Juin', '2026-06-01', '2026-06-30', 130, 3),
  ('Haute saison (Juillet-Août)', '2026-07-01', '2026-08-31', 145, 5),
  ('Septembre', '2026-09-01', '2026-09-30', 110, 3),
  ('Octobre', '2026-10-01', '2026-10-31', 85, 2),
  ('Basse saison (Nov-Déc)', '2026-11-01', '2026-12-17', 80, 2),
  ('Fêtes de fin d''année', '2026-12-18', '2027-01-03', 90, 3),
  ('Hiver', '2027-01-04', '2027-03-31', 80, 2),
  ('Printemps (Avril)', '2027-04-01', '2027-04-30', 110, 3),
  ('Mai', '2027-05-01', '2027-05-31', 98, 3);
