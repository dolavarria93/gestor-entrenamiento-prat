import type { SupabaseClient } from "@supabase/supabase-js";

export interface PlayerRow {
  id: string;
  nombre: string;
  rut: string | null;
  fecha_nacimiento: string | null;
  posicion: string | null;
}

// Jugadores activos de un equipo, vía player_teams (un jugador puede estar
// en varios equipos a la vez).
export async function getPlayersForTeam(supabase: SupabaseClient, teamId: string): Promise<PlayerRow[]> {
  const { data: memberships } = await supabase.from("player_teams").select("player_id").eq("team_id", teamId);
  const playerIds = (memberships ?? []).map((m) => m.player_id as string);
  if (playerIds.length === 0) return [];

  const { data } = await supabase
    .from("players")
    .select("id, nombre, rut, fecha_nacimiento, posicion")
    .eq("activo", true)
    .in("id", playerIds)
    .order("nombre");

  return data ?? [];
}

export async function getTeamIdsForPlayer(supabase: SupabaseClient, playerId: string): Promise<string[]> {
  const { data } = await supabase.from("player_teams").select("team_id").eq("player_id", playerId);
  return (data ?? []).map((r) => r.team_id as string);
}

// Busca un jugador activo por RUT (para no duplicar en la carga masiva).
export async function findPlayerByRut(supabase: SupabaseClient, rut: string): Promise<{ id: string } | null> {
  const { data } = await supabase.from("players").select("id").eq("rut", rut).eq("activo", true).maybeSingle();
  return data;
}
