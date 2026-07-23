-- ============================================================================
-- Club Prat — Gestor de Entrenamiento
-- Schema inicial: tablas + Row Level Security por club y por rol
-- Correr una sola vez en el SQL Editor de Supabase (proyecto vacío)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensiones
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Tablas principales (spec_app_club.md)
-- ----------------------------------------------------------------------------

create table clubs (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  comuna      text,
  region      text,
  created_at  timestamptz not null default now()
);

-- Categorías de edad del club (Mini, Sub15, Sub18, o las que el admin_club
-- necesite crear). Antes era una lista fija en el código; ahora es editable
-- desde /admin/categorias para poder sumar categorías nuevas sin tocar código.
create table categorias (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references clubs(id) on delete cascade,
  nombre      text not null,
  orden       int not null default 0,
  created_at  timestamptz not null default now(),
  unique (club_id, nombre)
);

-- Fundamentos de evaluación por categoría (pauta_evaluacion.docx). Cada
-- categoría nueva define los suyos al crearse (típicamente copiando los de
-- una categoría existente como punto de partida).
create table fundamentos_evaluacion (
  id            uuid primary key default gen_random_uuid(),
  categoria_id  uuid not null references categorias(id) on delete cascade,
  nombre        text not null,
  orden         int not null default 0
);

create table teams (
  id            uuid primary key default gen_random_uuid(),
  club_id       uuid not null references clubs(id) on delete cascade,
  nombre        text not null,
  categoria_id  uuid not null references categorias(id),
  created_at    timestamptz not null default now()
);

-- Curriculum de referencia (plan_entrenamiento_progresion.docx), usado para
-- precargar el contenido_planificado de una sesión según categoría y orden.
-- Si una categoría nueva no tiene progresión cargada, el entrenador
-- simplemente escribe el contenido planificado a mano ese día.
create table plan_progresion (
  id            uuid primary key default gen_random_uuid(),
  categoria_id  uuid not null references categorias(id) on delete cascade,
  orden         int not null,
  titulo        text not null,
  contenido     text not null,
  unique (categoria_id, orden)
);

-- Capa de autenticación/rol. No está en el listado original del spec, pero es
-- necesaria porque admin_club/directiva/super_admin no tienen tabla de dominio
-- propia (a diferencia de coaches/guardians). 1 fila por persona con user_id.
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  club_id     uuid references clubs(id) on delete cascade, -- null solo para super_admin
  role        text not null check (role in ('super_admin', 'admin_club', 'entrenador', 'apoderado', 'directiva')),
  nombre      text not null,
  created_at  timestamptz not null default now()
);

create table coaches (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references clubs(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  nombre      text not null,
  created_at  timestamptz not null default now(),
  unique (club_id, user_id)
);

create table coach_teams (
  coach_id    uuid not null references coaches(id) on delete cascade,
  team_id     uuid not null references teams(id) on delete cascade,
  primary key (coach_id, team_id)
);

create table players (
  id                uuid primary key default gen_random_uuid(),
  team_id           uuid not null references teams(id) on delete cascade,
  nombre            text not null,
  fecha_nacimiento  date,
  posicion          text,
  notas             text,
  created_at        timestamptz not null default now()
);

create table guardians (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nombre      text not null,
  created_at  timestamptz not null default now(),
  unique (user_id)
);

create table guardian_players (
  guardian_id uuid not null references guardians(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  primary key (guardian_id, player_id)
);

create table sessions (
  id                      uuid primary key default gen_random_uuid(),
  team_id                 uuid not null references teams(id) on delete cascade,
  coach_id                uuid not null references coaches(id),
  fecha                   date not null,
  contenido_planificado   text,
  contenido_realizado     text,
  observaciones           text,
  created_at              timestamptz not null default now(),
  unique (team_id, fecha)
);

create table attendance (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  presente    boolean not null default false,
  unique (session_id, player_id)
);

create table evaluations (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  periodo       text not null check (periodo in ('Pretemporada', 'Mitad de temporada', 'Cierre de temporada')),
  fundamento    text not null,
  puntaje       int not null check (puntaje between 1 and 5),
  notas         text,
  evaluado_por  uuid references auth.users(id),
  fecha         date not null default current_date,
  created_at    timestamptz not null default now(),
  unique (player_id, periodo, fundamento)
);

create table announcements (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references clubs(id) on delete cascade,
  team_id     uuid references teams(id) on delete cascade, -- null = todo el club
  titulo      text not null,
  mensaje     text not null,
  fecha       timestamptz not null default now(),
  autor_id    uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Índices de apoyo
-- ----------------------------------------------------------------------------
create index on categorias (club_id);
create index on fundamentos_evaluacion (categoria_id);
create index on teams (club_id);
create index on teams (categoria_id);
create index on coaches (club_id);
create index on players (team_id);
create index on sessions (team_id, fecha);
create index on attendance (session_id);
create index on evaluations (player_id, periodo);
create index on announcements (club_id);
create index on announcements (team_id);

-- ----------------------------------------------------------------------------
-- Funciones helper para RLS (SECURITY DEFINER: leen profiles sin
-- reactivar RLS recursivamente sobre la propia tabla profiles)
-- ----------------------------------------------------------------------------

create or replace function public.app_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_club_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select club_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_coach_of_team(p_team_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from coach_teams ct
    join coaches c on c.id = ct.coach_id
    where c.user_id = auth.uid() and ct.team_id = p_team_id
  );
$$;

create or replace function public.is_guardian_of_player(p_player_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from guardian_players gp
    join guardians g on g.id = gp.guardian_id
    where g.user_id = auth.uid() and gp.player_id = p_player_id
  );
$$;

create or replace function public.team_club_id(p_team_id uuid)
returns uuid
language sql
stable
as $$
  select club_id from teams where id = p_team_id;
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table clubs enable row level security;
alter table categorias enable row level security;
alter table fundamentos_evaluacion enable row level security;
alter table teams enable row level security;
alter table plan_progresion enable row level security;
alter table profiles enable row level security;
alter table coaches enable row level security;
alter table coach_teams enable row level security;
alter table players enable row level security;
alter table guardians enable row level security;
alter table guardian_players enable row level security;
alter table sessions enable row level security;
alter table attendance enable row level security;
alter table evaluations enable row level security;
alter table announcements enable row level security;

-- clubs ----------------------------------------------------------------------
create policy "clubs_select" on clubs for select
  using (app_role() = 'super_admin' or id = current_club_id());

create policy "clubs_write_super_admin" on clubs for all
  using (app_role() = 'super_admin')
  with check (app_role() = 'super_admin');

-- categorias -------------------------------------------------------------
create policy "categorias_select" on categorias for select
  using (app_role() = 'super_admin' or club_id = current_club_id());

create policy "categorias_write_admin" on categorias for all
  using (app_role() = 'super_admin' or (app_role() = 'admin_club' and club_id = current_club_id()))
  with check (app_role() = 'super_admin' or (app_role() = 'admin_club' and club_id = current_club_id()));

-- fundamentos_evaluacion ---------------------------------------------------
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

-- plan_progresion ----------------------------------------------------------
create policy "plan_progresion_select_authenticated" on plan_progresion for select
  using (auth.role() = 'authenticated');

create policy "plan_progresion_write_admin" on plan_progresion for all
  using (app_role() in ('super_admin', 'admin_club'))
  with check (app_role() in ('super_admin', 'admin_club'));

-- profiles ---------------------------------------------------------------
create policy "profiles_select_self" on profiles for select
  using (id = auth.uid());

create policy "profiles_select_club_admins" on profiles for select
  using (app_role() in ('super_admin', 'admin_club', 'directiva')
         and (app_role() = 'super_admin' or club_id = current_club_id()));

create policy "profiles_write_admin" on profiles for insert
  with check (app_role() in ('super_admin', 'admin_club')
              and (app_role() = 'super_admin' or club_id = current_club_id()));

create policy "profiles_update_admin" on profiles for update
  using (app_role() in ('super_admin', 'admin_club')
         and (app_role() = 'super_admin' or club_id = current_club_id()));

-- teams ------------------------------------------------------------------
create policy "teams_select" on teams for select
  using (
    app_role() = 'super_admin'
    or (app_role() in ('admin_club', 'directiva') and club_id = current_club_id())
    or (app_role() = 'entrenador' and is_coach_of_team(id))
    or (app_role() = 'apoderado' and exists (
          select 1 from players p
          join guardian_players gp on gp.player_id = p.id
          join guardians g on g.id = gp.guardian_id
          where g.user_id = auth.uid() and p.team_id = teams.id
        ))
  );

create policy "teams_write_admin" on teams for all
  using (app_role() = 'super_admin' or (app_role() = 'admin_club' and club_id = current_club_id()))
  with check (app_role() = 'super_admin' or (app_role() = 'admin_club' and club_id = current_club_id()));

-- coaches ------------------------------------------------------------------
create policy "coaches_select" on coaches for select
  using (
    app_role() = 'super_admin'
    or (app_role() in ('admin_club', 'directiva') and club_id = current_club_id())
    or user_id = auth.uid()
  );

create policy "coaches_write_admin" on coaches for all
  using (app_role() = 'super_admin' or (app_role() = 'admin_club' and club_id = current_club_id()))
  with check (app_role() = 'super_admin' or (app_role() = 'admin_club' and club_id = current_club_id()));

-- coach_teams ----------------------------------------------------------------
create policy "coach_teams_select" on coach_teams for select
  using (
    app_role() = 'super_admin'
    or app_role() in ('admin_club', 'directiva')
    or exists (select 1 from coaches c where c.id = coach_id and c.user_id = auth.uid())
  );

create policy "coach_teams_write_admin" on coach_teams for all
  using (app_role() = 'super_admin' or app_role() = 'admin_club')
  with check (app_role() = 'super_admin' or app_role() = 'admin_club');

-- players --------------------------------------------------------------------
create policy "players_select" on players for select
  using (
    app_role() = 'super_admin'
    or (app_role() in ('admin_club', 'directiva') and team_club_id(team_id) = current_club_id())
    or (app_role() = 'entrenador' and is_coach_of_team(team_id))
    or (app_role() = 'apoderado' and is_guardian_of_player(id))
  );

create policy "players_write_admin" on players for all
  using (app_role() = 'super_admin' or (app_role() = 'admin_club' and team_club_id(team_id) = current_club_id()))
  with check (app_role() = 'super_admin' or (app_role() = 'admin_club' and team_club_id(team_id) = current_club_id()));

-- guardians --------------------------------------------------------------------
create policy "guardians_select" on guardians for select
  using (
    app_role() = 'super_admin'
    or app_role() in ('admin_club', 'directiva')
    or user_id = auth.uid()
  );

create policy "guardians_write_admin" on guardians for all
  using (app_role() = 'super_admin' or app_role() = 'admin_club')
  with check (app_role() = 'super_admin' or app_role() = 'admin_club');

-- guardian_players ----------------------------------------------------------
create policy "guardian_players_select" on guardian_players for select
  using (
    app_role() = 'super_admin'
    or app_role() in ('admin_club', 'directiva')
    or exists (select 1 from guardians g where g.id = guardian_id and g.user_id = auth.uid())
  );

create policy "guardian_players_write_admin" on guardian_players for all
  using (app_role() = 'super_admin' or app_role() = 'admin_club')
  with check (app_role() = 'super_admin' or app_role() = 'admin_club');

-- sessions ---------------------------------------------------------------------
create policy "sessions_select" on sessions for select
  using (
    app_role() = 'super_admin'
    or (app_role() in ('admin_club', 'directiva') and team_club_id(team_id) = current_club_id())
    or (app_role() = 'entrenador' and is_coach_of_team(team_id))
    or (app_role() = 'apoderado' and exists (
          select 1 from players p
          join guardian_players gp on gp.player_id = p.id
          join guardians g on g.id = gp.guardian_id
          where g.user_id = auth.uid() and p.team_id = sessions.team_id
        ))
  );

create policy "sessions_insert" on sessions for insert
  with check (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and team_club_id(team_id) = current_club_id())
    or (app_role() = 'entrenador' and is_coach_of_team(team_id))
  );

create policy "sessions_update" on sessions for update
  using (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and team_club_id(team_id) = current_club_id())
    or (app_role() = 'entrenador' and is_coach_of_team(team_id))
  );

create policy "sessions_delete_admin" on sessions for delete
  using (app_role() = 'super_admin' or (app_role() = 'admin_club' and team_club_id(team_id) = current_club_id()));

-- attendance ---------------------------------------------------------------------
create policy "attendance_select" on attendance for select
  using (
    app_role() = 'super_admin'
    or exists (
      select 1 from sessions s
      where s.id = session_id
      and (
        (app_role() in ('admin_club', 'directiva') and team_club_id(s.team_id) = current_club_id())
        or (app_role() = 'entrenador' and is_coach_of_team(s.team_id))
        or (app_role() = 'apoderado' and is_guardian_of_player(attendance.player_id))
      )
    )
  );

create policy "attendance_insert" on attendance for insert
  with check (
    app_role() = 'super_admin'
    or exists (
      select 1 from sessions s
      where s.id = session_id
      and (
        (app_role() = 'admin_club' and team_club_id(s.team_id) = current_club_id())
        or (app_role() = 'entrenador' and is_coach_of_team(s.team_id))
      )
    )
  );

create policy "attendance_update" on attendance for update
  using (
    app_role() = 'super_admin'
    or exists (
      select 1 from sessions s
      where s.id = session_id
      and (
        (app_role() = 'admin_club' and team_club_id(s.team_id) = current_club_id())
        or (app_role() = 'entrenador' and is_coach_of_team(s.team_id))
      )
    )
  );

create policy "attendance_delete_admin" on attendance for delete
  using (
    app_role() = 'super_admin'
    or exists (
      select 1 from sessions s
      where s.id = session_id and app_role() = 'admin_club' and team_club_id(s.team_id) = current_club_id()
    )
  );

-- evaluations ------------------------------------------------------------------
-- Nota: apoderado NO tiene policy de select acá a propósito (spec: "sin acceso
-- a evaluación técnica interna"). RLS deniega por defecto sin policy.
create policy "evaluations_select" on evaluations for select
  using (
    app_role() = 'super_admin'
    or (app_role() in ('admin_club', 'directiva') and exists (
          select 1 from players p where p.id = player_id and team_club_id(p.team_id) = current_club_id()
        ))
    or (app_role() = 'entrenador' and exists (
          select 1 from players p where p.id = player_id and is_coach_of_team(p.team_id)
        ))
  );

create policy "evaluations_insert" on evaluations for insert
  with check (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and exists (
          select 1 from players p where p.id = player_id and team_club_id(p.team_id) = current_club_id()
        ))
    or (app_role() = 'entrenador' and exists (
          select 1 from players p where p.id = player_id and is_coach_of_team(p.team_id)
        ))
  );

create policy "evaluations_update" on evaluations for update
  using (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and exists (
          select 1 from players p where p.id = player_id and team_club_id(p.team_id) = current_club_id()
        ))
    or (app_role() = 'entrenador' and exists (
          select 1 from players p where p.id = player_id and is_coach_of_team(p.team_id)
        ))
  );

create policy "evaluations_delete_admin" on evaluations for delete
  using (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and exists (
          select 1 from players p where p.id = player_id and team_club_id(p.team_id) = current_club_id()
        ))
  );

-- announcements ------------------------------------------------------------------
create policy "announcements_select" on announcements for select
  using (
    app_role() = 'super_admin'
    or (app_role() in ('admin_club', 'directiva') and club_id = current_club_id())
    or (app_role() = 'entrenador' and (team_id is null or is_coach_of_team(team_id)) and club_id = current_club_id())
    or (app_role() = 'apoderado' and (
          (team_id is null and club_id = current_club_id())
          or exists (
            select 1 from players p
            join guardian_players gp on gp.player_id = p.id
            join guardians g on g.id = gp.guardian_id
            where g.user_id = auth.uid() and p.team_id = announcements.team_id
          )
        ))
  );

create policy "announcements_write" on announcements for insert
  with check (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and club_id = current_club_id())
    or (app_role() = 'entrenador' and team_id is not null and is_coach_of_team(team_id))
  );

create policy "announcements_update_own" on announcements for update
  using (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and club_id = current_club_id())
    or (app_role() = 'entrenador' and autor_id = auth.uid())
  );

create policy "announcements_delete_admin" on announcements for delete
  using (app_role() = 'super_admin' or (app_role() = 'admin_club' and club_id = current_club_id()));
