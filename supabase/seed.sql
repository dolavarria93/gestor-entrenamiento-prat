-- ============================================================================
-- Club Prat — Gestor de Entrenamiento
-- Semilla de datos inicial: club + 4 equipos
-- Correr DESPUÉS de schema.sql en el SQL Editor de Supabase
-- ============================================================================

insert into clubs (id, nombre, comuna, region) values
  ('00000000-0000-4000-8000-000000000001', 'Club de Vóleibol Prat', 'Puerto Cisnes', 'Aysén');

insert into teams (id, club_id, nombre, categoria) values
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'Mini',          'Mini'),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001', 'Sub15 Damas',   'Sub15'),
  ('00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000001', 'Sub18 Damas',   'Sub18'),
  ('00000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000001', 'Sub18 Varones', 'Sub18');

-- ----------------------------------------------------------------------------
-- Primer usuario admin_club
-- ----------------------------------------------------------------------------
-- 1. Crea el usuario en Authentication → Users → Add user (en el dashboard de
--    Supabase), con tu email y una contraseña. Copia el UUID que le asigna.
-- 2. Reemplaza 'PEGA-AQUI-EL-UUID-DEL-USUARIO' abajo y corre este insert:
--
-- insert into profiles (id, club_id, role, nombre) values
--   ('PEGA-AQUI-EL-UUID-DEL-USUARIO', '00000000-0000-4000-8000-000000000001', 'admin_club', 'Tu Nombre');
