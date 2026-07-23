-- ============================================================================
-- Club Prat — Gestor de Entrenamiento
-- Migración: categorías dinámicas (antes eran 3 valores fijos: Mini/Sub15/Sub18)
-- Correr una sola vez en el SQL Editor de Supabase, DESPUÉS de schema.sql +
-- seed.sql + seed_plan_progresion.sql (asume que esos ya corrieron).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tablas nuevas
-- ----------------------------------------------------------------------------
create table categorias (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references clubs(id) on delete cascade,
  nombre      text not null,
  orden       int not null default 0,
  created_at  timestamptz not null default now(),
  unique (club_id, nombre)
);

create table fundamentos_evaluacion (
  id            uuid primary key default gen_random_uuid(),
  categoria_id  uuid not null references categorias(id) on delete cascade,
  nombre        text not null,
  orden         int not null default 0
);

create index on fundamentos_evaluacion (categoria_id);

-- ----------------------------------------------------------------------------
-- Semilla: categorías existentes (Mini, Sub15, Sub18) para Club Prat
-- ----------------------------------------------------------------------------
insert into categorias (id, club_id, nombre, orden) values
  ('00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000001', 'Mini', 1),
  ('00000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000001', 'Sub15', 2),
  ('00000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000001', 'Sub18', 3);

insert into fundamentos_evaluacion (categoria_id, nombre, orden) values
  ('00000000-0000-4000-8000-000000000021', 'Coordinación motriz', 1),
  ('00000000-0000-4000-8000-000000000021', 'Manejo de balón', 2),
  ('00000000-0000-4000-8000-000000000021', 'Desplazamiento/Ubicación', 3),
  ('00000000-0000-4000-8000-000000000021', 'Trabajo en equipo', 4),
  ('00000000-0000-4000-8000-000000000021', 'Actitud', 5),

  ('00000000-0000-4000-8000-000000000022', 'Saque', 1),
  ('00000000-0000-4000-8000-000000000022', 'Recepción', 2),
  ('00000000-0000-4000-8000-000000000022', 'Defensa', 3),
  ('00000000-0000-4000-8000-000000000022', 'Colocación/Armado', 4),
  ('00000000-0000-4000-8000-000000000022', 'Ataque', 5),
  ('00000000-0000-4000-8000-000000000022', 'Bloqueo', 6),
  ('00000000-0000-4000-8000-000000000022', 'Trabajo en equipo', 7),
  ('00000000-0000-4000-8000-000000000022', 'Actitud', 8),

  ('00000000-0000-4000-8000-000000000023', 'Saque', 1),
  ('00000000-0000-4000-8000-000000000023', 'Recepción', 2),
  ('00000000-0000-4000-8000-000000000023', 'Defensa', 3),
  ('00000000-0000-4000-8000-000000000023', 'Colocación/Armado', 4),
  ('00000000-0000-4000-8000-000000000023', 'Ataque', 5),
  ('00000000-0000-4000-8000-000000000023', 'Bloqueo', 6),
  ('00000000-0000-4000-8000-000000000023', 'Trabajo en equipo', 7),
  ('00000000-0000-4000-8000-000000000023', 'Actitud', 8);

-- ----------------------------------------------------------------------------
-- teams: reemplazar la columna categoria (texto fijo) por categoria_id (FK)
-- ----------------------------------------------------------------------------
alter table teams add column categoria_id uuid references categorias(id);

update teams t
set categoria_id = c.id
from categorias c
where c.club_id = t.club_id and c.nombre = t.categoria;

alter table teams alter column categoria_id set not null;
alter table teams drop column categoria;
create index on teams (categoria_id);

-- ----------------------------------------------------------------------------
-- plan_progresion: mismo cambio (texto fijo -> categoria_id FK)
-- Nota: como plan_progresion no tenía club_id (era referencia global), se
-- vincula a las categorías del Club Prat, que hoy es el único club.
-- ----------------------------------------------------------------------------
alter table plan_progresion add column categoria_id uuid references categorias(id);

update plan_progresion p
set categoria_id = c.id
from categorias c
where c.club_id = '00000000-0000-4000-8000-000000000001' and c.nombre = p.categoria;

alter table plan_progresion alter column categoria_id set not null;
alter table plan_progresion drop constraint plan_progresion_categoria_orden_key;
alter table plan_progresion drop column categoria;
alter table plan_progresion add constraint plan_progresion_categoria_id_orden_key unique (categoria_id, orden);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table categorias enable row level security;
alter table fundamentos_evaluacion enable row level security;

create policy "categorias_select" on categorias for select
  using (app_role() = 'super_admin' or club_id = current_club_id());

create policy "categorias_write_admin" on categorias for all
  using (app_role() = 'super_admin' or (app_role() = 'admin_club' and club_id = current_club_id()))
  with check (app_role() = 'super_admin' or (app_role() = 'admin_club' and club_id = current_club_id()));

create policy "fundamentos_evaluacion_select" on fundamentos_evaluacion for select
  using (
    app_role() = 'super_admin'
    or exists (select 1 from categorias c where c.id = categoria_id and c.club_id = current_club_id())
  );

create policy "fundamentos_evaluacion_write_admin" on fundamentos_evaluacion for all
  using (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and exists (
      select 1 from categorias c where c.id = categoria_id and c.club_id = current_club_id()
    ))
  )
  with check (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and exists (
      select 1 from categorias c where c.id = categoria_id and c.club_id = current_club_id()
    ))
  );
