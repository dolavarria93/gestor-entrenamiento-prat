import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import SessionEditForm from "@/components/SessionEditForm";
import { getPlayersForTeam } from "@/lib/queries/players";

export default async function AdminSesionEditPage({
  params,
}: {
  params: Promise<{ teamId: string; sessionId: string }>;
}) {
  const { teamId, sessionId } = await params;
  await requireProfile();
  const supabase = await createClient();

  const { data: team } = await supabase.from("teams").select("id, nombre").eq("id", teamId).maybeSingle();
  if (!team) notFound();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, team_id, fecha, contenido_planificado, contenido_realizado, observaciones")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.team_id !== teamId) notFound();

  const players = await getPlayersForTeam(supabase, teamId);

  const { data: attendance } = await supabase
    .from("attendance")
    .select("player_id, presente")
    .eq("session_id", sessionId);

  const asistenciaPrevia = Object.fromEntries((attendance ?? []).map((a) => [a.player_id, a.presente]));

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <Link href={`/admin/equipos/${teamId}`} className="text-sm text-prat-blue hover:underline">
          ← {team.nombre}
        </Link>
        <h1 className="mt-2 font-display text-xl font-semibold text-ink">Sesión del {session.fecha}</h1>
      </div>

      <SessionEditForm
        sessionId={session.id}
        contenidoPlanificadoInicial={session.contenido_planificado ?? ""}
        contenidoRealizadoInicial={session.contenido_realizado ?? ""}
        observacionesInicial={session.observaciones ?? ""}
        players={players ?? []}
        asistenciaPrevia={asistenciaPrevia}
      />
    </div>
  );
}
