import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { ordenSiguiente } from "@/lib/plan";
import TeamTabs from "@/components/TeamTabs";
import SessionDateStrip from "./SessionDateStrip";
import SessionForm from "./SessionForm";

export default async function EquipoSesionPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { teamId } = await params;
  const sp = await searchParams;
  await requireProfile();
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("id, nombre, categoria")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) notFound();

  const { data: players } = await supabase
    .from("players")
    .select("id, nombre, posicion")
    .eq("team_id", teamId)
    .order("nombre");

  const today = new Date().toISOString().slice(0, 10);
  const fechaSeleccionada = sp.fecha ?? today;

  const { data: sesionesRecientes } = await supabase
    .from("sessions")
    .select("id, fecha")
    .eq("team_id", teamId)
    .order("fecha", { ascending: false })
    .limit(8);

  const { data: sesion } = await supabase
    .from("sessions")
    .select("id, contenido_planificado, contenido_realizado, observaciones")
    .eq("team_id", teamId)
    .eq("fecha", fechaSeleccionada)
    .maybeSingle();

  let contenidoPlanificado = sesion?.contenido_planificado ?? "";

  if (!sesion) {
    const { count } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId);

    const orden = ordenSiguiente(team.categoria, count ?? 0);

    const { data: pasoPlan } = await supabase
      .from("plan_progresion")
      .select("titulo, contenido")
      .eq("categoria", team.categoria)
      .eq("orden", orden)
      .maybeSingle();

    contenidoPlanificado = pasoPlan ? `${pasoPlan.titulo}\n\n${pasoPlan.contenido}` : "";
  }

  let asistenciaPrevia: Record<string, boolean> = {};
  if (sesion) {
    const { data: attendance } = await supabase
      .from("attendance")
      .select("player_id, presente")
      .eq("session_id", sesion.id);
    asistenciaPrevia = Object.fromEntries((attendance ?? []).map((a) => [a.player_id, a.presente]));
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      <div>
        <p className="text-sm text-ink/50">{team.categoria}</p>
        <h1 className="font-display text-xl font-semibold text-ink">{team.nombre}</h1>
      </div>

      <TeamTabs teamId={team.id} active="sesion" />

      <SessionDateStrip
        teamId={team.id}
        today={today}
        fechaSeleccionada={fechaSeleccionada}
        sesiones={sesionesRecientes ?? []}
      />

      <SessionForm
        key={fechaSeleccionada}
        teamId={team.id}
        fecha={fechaSeleccionada}
        contenidoPlanificado={contenidoPlanificado}
        contenidoRealizadoInicial={sesion?.contenido_realizado ?? ""}
        observacionesInicial={sesion?.observaciones ?? ""}
        players={players ?? []}
        asistenciaPrevia={asistenciaPrevia}
        yaRegistrada={Boolean(sesion)}
      />
    </div>
  );
}
