-- Mise à jour de la carte sur mesure (ongles, sourcils, cils)
-- À exécuter avec : psql "$DATABASE_URL" -f server/update_prestations.sql

BEGIN;

-- 1) On vide les anciennes entrées des trois catégories
DELETE FROM prestations WHERE category IN ('ongles', 'sourcils', 'cils');

-- 2) Ongles
INSERT INTO prestations (category, name, duration, price) VALUES
  ('ongles', 'Pose de capsules', '', '2 000 DA'),
  ('ongles', 'Gel sur ongles naturels', '', '1 800 DA'),
  ('ongles', 'Vernis semi-permanent', '', '1 000 DA'),
  ('ongles', 'Remplissage', '', '1 500 DA'),
  ('ongles', 'French & Baby Boomer', '', '2 400 DA'),
  ('ongles', 'Nail art', '', '3 000 DA'),
  ('ongles', 'Dépose', '', '1 000 DA'),
  ('ongles', 'Décoration d''ongles', '', '100 DA par doigt');

-- 3) Sourcils (+ rehaussement de cils pour compléter la carte)
INSERT INTO prestations (category, name, duration, price) VALUES
  ('sourcils', 'Brow Lift', '', '2 000 DA'),
  ('sourcils', 'Brow Lift avec teinture', '', '2 500 DA'),
  ('sourcils', 'Rehaussement de cils', '', '2 000 DA'),
  ('sourcils', 'Rehaussement de cils avec teinture', '', '2 500 DA');

-- 4) Cils
INSERT INTO prestations (category, name, duration, price) VALUES
  ('cils', 'Pose naturelle 3D', '', '2 500 DA'),
  ('cils', 'Pose naturelle classique 1D', '', '2 500 DA'),
  ('cils', 'Cils à cils (intense)', '', '3 500 DA'),
  ('cils', 'Pose complète', '', '3 000 DA'),
  ('cils', 'Pose complète intense', '', '3 500 DA'),
  ('cils', 'Pose mixte hybride', '', '3 500 DA'),
  ('cils', 'Pose russe (chargée)', '', '4 000 DA'),
  ('cils', 'Pose méga volume', '', '5 000 DA'),
  ('cils', 'Dépose', '', '500 DA'),
  ('cils', 'Dépose d''une pose réalisée ailleurs', '', '700 à 1 000 DA');

-- 5) Press on nails
INSERT INTO prestations (category, name, duration, price) VALUES
  ('press on nails', 'Classique', '', '1 500 DA'),
  ('press on nails', 'French / Baby Boomer / Effet Chrome', '', '1 800 DA'),
  ('press on nails', 'Nail Art', '', 'à partir de 2 000 DA');

COMMIT;
