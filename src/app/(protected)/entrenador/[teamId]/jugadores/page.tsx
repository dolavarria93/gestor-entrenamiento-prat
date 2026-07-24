import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { getPlayersForTeam, getTeamIdsForPlayer } from "@/lib/queries/players";
import TeamTabs from "@/components/TeamTabs";
import NuevoJugadorForm from "@/components/NuevoJugadorForm";
import ImportarJugadoresForm from "@/components/ImportarJugadoresForm";
import PlayerRow from "@/components/PlayerRow";

export default async function JugadoresEquipoPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("id, nombre, categoria_id")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) notFound();

  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();

  const { data: coachTeams } = coach
    ? await supabase.from("coach_teams").select("team_id").eq("coach_id", coach.id)
    : { data: [] };

  const teamIdsCoach = (coachTeams ?? []).map((ct) => ct.team_id);

  const { data: equiposCoachRaw } = teamIdsCoach.length
    ? await supabase.from("teams").select("id, nombre, categoria_id").in("id", teamIdsCoach)
    : { data: [] };

  const categoriaIdsCoach = [...new Set((equiposCoachRaw ?? []).map((t) => t.categoria_id))];
  const { data: todasCategoriasCoach } = categoriaIdsCoach.length
    ? await supabase.from("categorias").select("id, nombre").in("id", categoriaIdsCoach)
    : { data: [] };
  const nombreCategoriaPorId = new Map((todasCategoriasCoach ?? []).map((c) => [c.id, c.nombre]));

  const equiposParaSelect = (equiposCoachRaw ?? [])
    .map((t) => ({ id: t.id, nombre: t.nombre, categoriaNombre: nombreCategoriaPorId.get(t.categoria_id) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const players = await getPlayersForTeam(supabase, teamId);
  const equiposPorJugador = new Map(
    await Promise.all(players.map(async (p) => [p.id, await getTeamIdsForPlayer(supabase, p.id)] as const)),
  );

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink">{team.nombre}</h1>
        <a
          href={`/api/export/equipo/${teamId}`}
          className="rounded-lg border border-prat-blue px-3 py-1.5 text-xs text-prat-blue hover:bg-prat-blue/5"
        >
          Nómina (Excel)
        </a>
      </div>

      <TeamTabs teamId={team.id} active="jugadores" />

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="font-display text-sm font-semibold text-prat-blue">Plantel</h2>
        {players.length === 0 ? (
          <p className="mt-2 text-sm text-ink/50">Sin jugadores cargados todavía.</p>
        ) : (
          <div className="mt-2 flex flex-col divide-y divide-ink/5">
            {players.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                teamId={teamId}
                equipos={equiposParaSelect}
                equiposSeleccionados={equiposPorJugador.get(p.id) ?? [teamId]}
              />
            ))}
          </div>
        )}
      </section>

      <ImportarJugadoresForm teamId={team.id} />

      <NuevoJugadorForm teamId={team.id} equipos={equiposParaSelect} />
    </div>
  );
}
