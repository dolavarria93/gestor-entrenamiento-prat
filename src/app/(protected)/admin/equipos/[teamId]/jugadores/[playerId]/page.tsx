import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PERIODOS, FUNDAMENTOS_POR_CATEGORIA } from "@/lib/fundamentos";
import AttendanceHistory from "@/components/AttendanceHistory";
import EvaluationPeriodSection from "@/components/EvaluationPeriodSection";
import type { Categoria, Periodo } from "@/lib/supabase/database.types";

export default async function JugadoraDetallePage({
  params,
}: {
  params: Promise<{ teamId: string; playerId: string }>;
}) {
  const { teamId, playerId } = await params;
  await requireProfile();
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("id, nombre, posicion, fecha_nacimiento, notas, team_id")
    .eq("id", playerId)
    .maybeSingle();

  if (!player || player.team_id !== teamId) notFound();

  const { data: team } = await supabase
    .from("teams")
    .select("id, nombre, categoria")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) notFound();

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

  const fundamentos = FUNDAMENTOS_POR_CATEGORIA[team.categoria as Categoria];

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <Link href={`/admin/equipos/${teamId}`} className="text-sm text-prat-blue hover:underline">
          ← {team.nombre}
        </Link>
        <h1 className="mt-2 font-display text-xl font-semibold text-ink">{player.nombre}</h1>
        {player.posicion && <p className="text-sm text-ink/50">{player.posicion}</p>}
      </div>

      <AttendanceHistory registros={registrosAsistencia} />

      {PERIODOS.map((periodo) => {
        const delPeriodo = (evaluaciones ?? []).filter((e) => e.periodo === (periodo as Periodo));
        return (
          <EvaluationPeriodSection
            key={periodo}
            categoria={team.categoria}
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
