import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PERIODOS } from "@/lib/fundamentos";
import { getFundamentos } from "@/lib/queries/categorias";
import { getTeamIdsForPlayer } from "@/lib/queries/players";
import AttendanceHistory from "@/components/AttendanceHistory";
import EvaluationPeriodSection from "@/components/EvaluationPeriodSection";
import PlayerDetailHeader from "./PlayerDetailHeader";
import type { Periodo } from "@/lib/supabase/database.types";

export default async function JugadoraDetallePage({
  params,
}: {
  params: Promise<{ teamId: string; playerId: string }>;
}) {
  const { teamId, playerId } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("id, nombre, rut, posicion, fecha_nacimiento, notas")
    .eq("id", playerId)
    .maybeSingle();

  if (!player) notFound();

  const equiposSeleccionados = await getTeamIdsForPlayer(supabase, playerId);
  if (!equiposSeleccionados.includes(teamId)) notFound();

  const { data: team } = await supabase
    .from("teams")
    .select("id, nombre, categoria_id, club_id")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) notFound();

  const clubId = profile.club_id ?? team.club_id;

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nombre")
    .eq("club_id", clubId ?? "");
  const nombreCategoriaPorId = new Map((categorias ?? []).map((c) => [c.id, c.nombre]));

  const { data: todosLosEquipos } = await supabase
    .from("teams")
    .select("id, nombre, categoria_id")
    .eq("club_id", clubId ?? "");

  const equiposParaSelect = (todosLosEquipos ?? [])
    .map((t) => ({ id: t.id, nombre: t.nombre, categoriaNombre: nombreCategoriaPorId.get(t.categoria_id) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const { data: evaluaciones } = await supabase
    .from("evaluations")
    .select("periodo, fundamento, puntaje, notas")
    .eq("player_id", playerId);

  const { data: attendanceRaw } = await supabase
    .from("attendance")
    .select("presente, session_id")
    .eq("player_id", playerId);

  const sessionIds = (attendanceRaw ?? []).map((a) => a.session_id);
  const { data: sesionesAsistidas } = sessionIds.length
    ? await supabase.from("sessions").select("id, fecha").in("id", sessionIds)
    : { data: [] };
  const fechaPorSesion = new Map((sesionesAsistidas ?? []).map((s) => [s.id, s.fecha]));

  const registrosAsistencia = (attendanceRaw ?? [])
    .map((a) => ({ fecha: fechaPorSesion.get(a.session_id), presente: a.presente }))
    .filter((r): r is { fecha: string; presente: boolean } => Boolean(r.fecha));

  const fundamentos = await getFundamentos(supabase, team.categoria_id);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <Link href={`/admin/equipos/${teamId}`} className="text-sm text-prat-blue hover:underline">
          ← {team.nombre}
        </Link>
        <div className="mt-2">
          <PlayerDetailHeader
            player={player}
            teamId={teamId}
            equipos={equiposParaSelect}
            equiposSeleccionados={equiposSeleccionados}
          />
        </div>
      </div>

      <AttendanceHistory registros={registrosAsistencia} />

      {PERIODOS.map((periodo) => {
        const delPeriodo = (evaluaciones ?? []).filter((e) => e.periodo === (periodo as Periodo));
        return (
          <EvaluationPeriodSection
            key={periodo}
            categoriaId={team.categoria_id}
            playerId={player.id}
            periodo={periodo as Periodo}
            fundamentos={fundamentos}
            evaluacionesPeriodo={delPeriodo.map((e) => ({ fundamento: e.fundamento, puntaje: e.puntaje }))}
            notasPrevias={delPeriodo[0]?.notas ?? ""}
          />
        );
      })}
    </div>
  );
}
