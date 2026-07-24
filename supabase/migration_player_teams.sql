-- ============================================================================
-- Club Prat — Gestor de Entrenamiento
-- Migración: un jugador puede pertenecer a varios equipos/categorías a la vez
-- Correr en el SQL Editor de Supabase, después de migration_players_rut.sql.
-- ============================================================================

-- "Eliminar" un jugador ahora es una baja lógica con motivo (no se borra la
-- fila, para no perder su historial de asistencia y evaluaciones).
alter table players add column activo boolean not null default true;
alter table players add column motivo_baja text;
alter table players add column fecha_baja date;

create table player_teams (
  player_id  uuid not null references players(id) on delete cascade,
  team_id    uuid not null references teams(id) on delete cascade,
  primary key (player_id, team_id)
);

create index on player_teams (team_id);

-- Backfill: cada jugador existente conserva su equipo actual como membresía.
insert into player_teams (player_id, team_id)
select id, team_id from players where team_id is not null
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- Borrar TODAS las policies que dependen de players.team_id ANTES de poder
-- borrar la columna (si no, Postgres tira error de dependencia).
-- ----------------------------------------------------------------------------
drop policy "teams_select" on teams;
drop policy "players_select" on players;
drop policy "players_write" on players;
drop policy "sessions_select" on sessions;
drop policy "evaluations_select" on evaluations;
drop policy "evaluations_insert" on evaluations;
drop policy "evaluations_update" on evaluations;
drop policy "evaluations_delete_admin" on evaluations;
drop policy "announcements_select" on announcements;

alter table players drop column team_id;

-- ----------------------------------------------------------------------------
-- RLS de player_teams
-- ----------------------------------------------------------------------------
alter table player_teams enable row level security;

create policy "player_teams_select" on player_teams for select
  using (
    app_role() = 'super_admin'
    or (app_role() in ('admin_club', 'directiva') and team_club_id(team_id) = current_club_id())
    or (app_role() = 'entrenador' and is_coach_of_team(team_id))
    or (app_role() = 'apoderado' and is_guardian_of_player(player_id))
  );

create policy "player_teams_write" on player_teams for all
  using (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and team_club_id(team_id) = current_club_id())
    or (app_role() = 'entrenador' and is_coach_of_team(team_id))
  )
  with check (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and team_club_id(team_id) = current_club_id())
    or (app_role() = 'entrenador' and is_coach_of_team(team_id))
  );

-- ----------------------------------------------------------------------------
-- Recrear, ahora vía player_teams, las policies que borramos arriba
-- ----------------------------------------------------------------------------

-- teams: el apoderado ve equipos de sus hijos/as vía player_teams ahora
create policy "teams_select" on teams for select
  using (
    app_role() = 'super_admin'
    or (app_role() in ('admin_club', 'directiva') and club_id = current_club_id())
    or (app_role() = 'entrenador' and is_coach_of_team(id))
    or (app_role() = 'apoderado' and exists (
          select 1 from player_teams pt
          join guardian_players gp on gp.player_id = pt.player_id
          join guardians g on g.id = gp.guardian_id
          where g.user_id = auth.uid() and pt.team_id = teams.id
        ))
  );

-- players: select y escritura ahora pasan por player_teams
create policy "players_select" on players for select
  using (
    app_role() = 'super_admin'
    or (app_role() in ('admin_club', 'directiva') and exists (
          select 1 from player_teams pt where pt.player_id = players.id and team_club_id(pt.team_id) = current_club_id()
        ))
    or (app_role() = 'entrenador' and exists (
          select 1 from player_teams pt where pt.player_id = players.id and is_coach_of_team(pt.team_id)
        ))
    or (app_role() = 'apoderado' and is_guardian_of_player(id))
  );

-- Insert queda permisivo por rol (sin equipo todavía, se asigna vía
-- player_teams en el mismo paso desde la app) — el jugador no es visible
-- para nadie hasta que tenga al menos una fila en player_teams.
create policy "players_insert" on players for insert
  with check (app_role() in ('super_admin', 'admin_club', 'entrenador'));

create policy "players_update" on players for update
  using (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and exists (
          select 1 from player_teams pt where pt.player_id = players.id and team_club_id(pt.team_id) = current_club_id()
        ))
    or (app_role() = 'entrenador' and exists (
          select 1 from player_teams pt where pt.player_id = players.id and is_coach_of_team(pt.team_id)
        ))
  )
  with check (app_role() in ('super_admin', 'admin_club', 'entrenador'));

create policy "players_delete" on players for delete
  using (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and exists (
          select 1 from player_teams pt where pt.player_id = players.id and team_club_id(pt.team_id) = current_club_id()
        ))
    or (app_role() = 'entrenador' and exists (
          select 1 from player_teams pt where pt.player_id = players.id and is_coach_of_team(pt.team_id)
        ))
  );

-- sessions: el apoderado ve sesiones de los equipos de sus hijos/as vía player_teams
create policy "sessions_select" on sessions for select
  using (
    app_role() = 'super_admin'
    or (app_role() in ('admin_club', 'directiva') and team_club_id(team_id) = current_club_id())
    or (app_role() = 'entrenador' and is_coach_of_team(team_id))
    or (app_role() = 'apoderado' and exists (
          select 1 from player_teams pt
          join guardian_players gp on gp.player_id = pt.player_id
          join guardians g on g.id = gp.guardian_id
          where g.user_id = auth.uid() and pt.team_id = sessions.team_id
        ))
  );

-- evaluations: admin/entrenador ahora resuelven el equipo del jugador vía player_teams
create policy "evaluations_select" on evaluations for select
  using (
    app_role() = 'super_admin'
    or (app_role() in ('admin_club', 'directiva') and exists (
          select 1 from player_teams pt where pt.player_id = evaluations.player_id and team_club_id(pt.team_id) = current_club_id()
        ))
    or (app_role() = 'entrenador' and exists (
          select 1 from player_teams pt where pt.player_id = evaluations.player_id and is_coach_of_team(pt.team_id)
        ))
  );

create policy "evaluations_insert" on evaluations for insert
  with check (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and exists (
          select 1 from player_teams pt where pt.player_id = evaluations.player_id and team_club_id(pt.team_id) = current_club_id()
        ))
    or (app_role() = 'entrenador' and exists (
          select 1 from player_teams pt where pt.player_id = evaluations.player_id and is_coach_of_team(pt.team_id)
        ))
  );

create policy "evaluations_update" on evaluations for update
  using (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and exists (
          select 1 from player_teams pt where pt.player_id = evaluations.player_id and team_club_id(pt.team_id) = current_club_id()
        ))
    or (app_role() = 'entrenador' and exists (
          select 1 from player_teams pt where pt.player_id = evaluations.player_id and is_coach_of_team(pt.team_id)
        ))
  );

create policy "evaluations_delete_admin" on evaluations for delete
  using (
    app_role() = 'super_admin'
    or (app_role() = 'admin_club' and exists (
          select 1 from player_teams pt where pt.player_id = evaluations.player_id and team_club_id(pt.team_id) = current_club_id()
        ))
  );

-- announcements: el apoderado ve avisos de los equipos de sus hijos/as vía player_teams
create policy "announcements_select" on announcements for select
  using (
    app_role() = 'super_admin'
    or (app_role() in ('admin_club', 'directiva') and club_id = current_club_id())
    or (app_role() = 'entrenador' and (team_id is null or is_coach_of_team(team_id)) and club_id = current_club_id())
    or (app_role() = 'apoderado' and (
          (team_id is null and club_id = current_club_id())
          or exists (
            select 1 from player_teams pt
            join guardian_players gp on gp.player_id = pt.player_id
            join guardians g on g.id = gp.guardian_id
            where g.user_id = auth.uid() and pt.team_id = announcements.team_id
          )
        ))
  );
