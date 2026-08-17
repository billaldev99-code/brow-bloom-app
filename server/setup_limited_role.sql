-- ============================================================================
-- Rôle applicatif limité aux opérations CRUD (pas de DDL)
-- ----------------------------------------------------------------------------
-- Principe : l'API Express (server/index.js) ne doit PLUS créer de tables à
-- l'exécution (plus aucun CREATE TABLE / ALTER TABLE côté app). Les tables sont
-- créées UNE FOIS par un administrateur via :
--
--   1) psql "$DATABASE_URL" -f server/schema.sql
--
--   2) Puis ce script crée le rôle applicatif et ne lui accorde QUE
--      SELECT / INSERT / UPDATE / DELETE (et USAGE sur les séquences).
--      psql "$DATABASE_URL" -f server/setup_limited_role.sql
--
--   3) Mettez à jour DATABASE_URL côté serveur avec ce rôle limité :
--      postgresql://brow_bloom_app:<MOT_DE_PASSE>@<hôte>/<base>?sslmode=require
--      (le rôle actuel de DATABASE_URL doit rester réservé à l'admin/psql)
--
-- IMPORTANT : remplacez <MOT_DE_PASSE> ci-dessous par un mot de passe fort
-- avant d'exécuter ce script.
-- ============================================================================

-- 1) Créer le rôle s'il n'existe pas encore (idempotent)
SELECT 'CREATE ROLE brow_bloom_app LOGIN PASSWORD ''<MOT_DE_PASSE>'''
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'brow_bloom_app')\gexec

-- 2) Mettre à jour le mot de passe (réexécution sûre)
ALTER ROLE brow_bloom_app WITH LOGIN PASSWORD '<MOT_DE_PASSE>';

-- 3) Accès au schéma public (usage uniquement, pas de création)
GRANT USAGE ON SCHEMA public TO brow_bloom_app;

-- 4) CRUD sur toutes les tables existantes du schéma public
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO brow_bloom_app;

-- 5) CRUD sur les tables créées à l'avenir par l'admin
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO brow_bloom_app;

-- 6) Séquences (nécessaires pour les colonnes SERIAL / RETURNING id)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO brow_bloom_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO brow_bloom_app;

-- NOTE : pas de GRANT sur CREATE / DROP / ALTER TABLE, TRUNCATE, REFERENCES…
-- le rôle ne peut donc ni modifier le schéma ni lire les données hors tables.
-- (TRUNCATE reste possible si explicitement accordé ; ne l'accordez pas.)
