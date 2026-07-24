import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { getPlayersForTeam } from "@/lib/queries/players";
import NuevoJugadorForm from "@/components/NuevoJugadorForm";
import ImportarJugadoresForm from "@/components/ImportarJugadoresForm";

export default async function AdminEquipoPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("id, nombre, categoria_id, club_id")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) notFound();

  const { data: categoria } = await supabase
    .from("categorias")
    .select("nombre")
    .eq("id", team.categoria_id)
    .maybeSingle();

  const clubId = profile.club_id ?? team.club_id;

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nombre, orden")
    .eq("club_id", clubId ?? "")
    .order("orden");

  const nombreCategoriaPorId = new Map((categorias ?? []).map((c) => [c.id, c.nombre]));

  const { data: todosLosEquipos } = await supabase
    .from("teams")
    .select("id, nombre, categoria_id")
    .eq("club_id", clubId ?? "");

  const equiposParaSelect = (todosLosEquipos ?? [])
    .map((t) => ({ id: t.id, nombre: t.nombre, categoriaNombre: nombreCategoriaPorId.get(t.categoria_id) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const players = await getPlayersForTeam(supabase, teamId);

  const { data: sesiones } = await supabase
    .from("sessions")
    .select("id, fecha, contenido_realizado, observaciones")
    .eq("team_id", teamId)
    .order("fecha", { ascending: false })
    .limit(10);

  const nombrePorJugador = new Map(players.map((p) => [p.id, p.nombre]));

  const sesionesConAsistencia = await Promise.all(
    (sesiones ?? []).map(async (s) => {
      const { data: attendance } = await supabase
        .from("attendance")
        .select("presente, player_id")
        .eq("session_id", s.id);

      const nombresPresentes = (attendance ?? [])
        .filter((a) => a.presente)
        .map((a) => nombrePorJugador.get(a.player_id))
        .filter((n): n is string => Boolean(n));
      const nombresAusentes = (attendance ?? [])
        .filter((a) => !a.presente)
        .map((a) => nombrePorJugador.get(a.player_id))
        .filter((n): n is string => Boolean(n));

      return {
        ...s,
        presentes: nombresPresentes.length,
        total: attendance?.length ?? 0,
        nombresPresentes,
        nombresAusentes,
      };
    }),
  );

  const promediosPorJugador = await Promise.all(
    players.map(async (player) => {
      const { data: evals } = await supabase
        .from("evaluations")
        .select("puntaje, periodo")
        .eq("player_id", player.id)
        .order("fecha", { ascending: false });

      if (!evals || evals.length === 0) return { player, promedio: null, periodo: null as string | null };

      const ultimoPeriodo = evals[0].periodo;
      const delPeriodo = evals.filter((e) => e.periodo === ultimoPeriodo);
      const promedio = Math.round(
        (delPeriodo.reduce((acc, e) => acc + e.puntaje, 0) / delPeriodo.length) * 10,
      ) / 10;

      return { player, promedio, periodo: ultimoPeriodo };
    }),
  );

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin" className="text-sm text-prat-blue hover:underline">
            ← Panel del club
          </Link>
          <p className="mt-2 text-sm text-ink/50">{categoria?.nombre ?? ""}</p>
          <h1 className="font-display text-xl font-semibold text-ink">{team.nombre}</h1>
        </div>
        <a
          href={`/api/export/equipo/${teamId}`}
          className="rounded-lg border border-prat-blue px-3 py-1.5 text-sm text-prat-blue hover:bg-prat-blue/5"
        >
          Descargar nómina (Excel)
        </a>
      </div>

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="font-display text-sm font-semibold text-prat-blue">Plantel</h2>
        {players.length === 0 ? (
          <p className="mt-2 text-sm text-ink/50">Sin jugadores cargados todavía.</p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-ink/5">
            {promediosPorJugador.map(({ player, promedio, periodo }) => (
              <Link
                key={player.id}
                href={`/admin/equipos/${teamId}/jugadores/${player.id}`}
                className="flex items-center justify-between py-2 text-sm transition hover:bg-paper"
              >
                <div>
                  <p className="text-ink">{player.nombre}</p>
                  {player.posicion && <p className="text-xs text-ink/40">{player.posicion}</p>}
                </div>
                <div className="text-right">
                  {promedio !== null ? (
                    <>
                      <p className="font-display font-semibold text-cisnes-gold">{promedio}/5</p>
                      <p className="text-xs text-ink/40">{periodo}</p>
                    </>
                  ) : (
                    <p className="text-xs text-ink/30">Sin evaluación</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="font-display text-sm font-semibold text-prat-blue">Últimas sesiones</h2>
        {sesionesConAsistencia.length === 0 ? (
          <p className="mt-2 text-sm text-ink/50">Todavía no hay sesiones registradas.</p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-ink/5">
            {sesionesConAsistencia.map((s) => (
              <div key={s.id} className="py-2 text-sm">
                <div className="flex items-center justify-between">
                  <p className="text-ink">{s.fecha}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-ink/50">
                      {s.presentes}/{s.total} presentes
                    </p>
                    <Link
                      href={`/admin/equipos/${teamId}/sesiones/${s.id}`}
                      className="text-xs text-prat-blue hover:underline"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
                {s.contenido_realizado && <p className="mt-1 text-ink/60">{s.contenido_realizado}</p>}
                {s.nombresPresentes.length > 0 && (
                  <p className="mt-1 text-xs text-success-green">Presentes: {s.nombresPresentes.join(", ")}</p>
                )}
                {s.nombresAusentes.length > 0 && (
                  <p className="mt-0.5 text-xs text-alert-red">Ausentes: {s.nombresAusentes.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <ImportarJugadoresForm teamId={teamId} />

      <NuevoJugadorForm teamId={teamId} equipos={equiposParaSelect} />
    </div>
  );
}
