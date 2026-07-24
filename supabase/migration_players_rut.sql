-- ============================================================================
-- Club Prat — Gestor de Entrenamiento
-- Migración: RUT de jugadores + entrenadores pueden gestionar su plantel
-- Correr en el SQL Editor de Supabase, después de migration_categorias.sql.
-- ============================================================================

alter table players add column rut text;

drop policy "players_write_admin" on players;

create policy "players_write" on players for all
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
