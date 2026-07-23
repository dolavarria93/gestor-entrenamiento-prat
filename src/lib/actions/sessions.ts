"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

function buildAttendanceRows(formData: FormData, sessionId: string) {
  const playerIds = formData.getAll("player_id").map(String);
  return playerIds.map((playerId) => ({
    session_id: sessionId,
    player_id: playerId,
    presente: formData.get(`presente_${playerId}`) === "on",
  }));
}

// Entrenador: crea o corrige la sesión de su equipo para una fecha dada
// (hoy por defecto, o una fecha pasada elegida desde el selector de fechas).
export async function guardarSesion(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const teamId = String(formData.get("team_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "") || new Date().toISOString().slice(0, 10);
  const contenidoPlanificado = String(formData.get("contenido_planificado") ?? "");
  const contenidoRealizado = String(formData.get("contenido_realizado") ?? "").trim();
  const observaciones = String(formData.get("observaciones") ?? "").trim();

  if (!teamId) return { error: "Falta el equipo." };

  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!coach) return { error: "No estás vinculado como entrenador/a." };

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .upsert(
      {
        team_id: teamId,
        coach_id: coach.id,
        fecha,
        contenido_planificado: contenidoPlanificado,
        contenido_realizado: contenidoRealizado || null,
        observaciones: observaciones || null,
      },
      { onConflict: "team_id,fecha" },
    )
    .select("id")
    .single();

  if (sessionError || !session) {
    return { error: "No se pudo guardar la sesión: " + (sessionError?.message ?? "error desconocido") };
  }

  const attendanceRows = buildAttendanceRows(formData, session.id);

  if (attendanceRows.length > 0) {
    const { error: attendanceError } = await supabase
      .from("attendance")
      .upsert(attendanceRows, { onConflict: "session_id,player_id" });

    if (attendanceError) {
      return { error: "Se guardó la sesión pero falló la asistencia: " + attendanceError.message };
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// Admin: corrige una sesión ya existente (contenido y asistencia) sin tocar
// coach_id ni fecha — para arreglar errores de carga sin suplantar al
// entrenador que la registró.
export async function actualizarSesionAdmin(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  await requireProfile();
  const supabase = await createClient();

  const sessionId = String(formData.get("session_id") ?? "");
  const contenidoPlanificado = String(formData.get("contenido_planificado") ?? "");
  const contenidoRealizado = String(formData.get("contenido_realizado") ?? "").trim();
  const observaciones = String(formData.get("observaciones") ?? "").trim();

  if (!sessionId) return { error: "Falta la sesión." };

  const { error: sessionError } = await supabase
    .from("sessions")
    .update({
      contenido_planificado: contenidoPlanificado,
      contenido_realizado: contenidoRealizado || null,
      observaciones: observaciones || null,
    })
    .eq("id", sessionId);

  if (sessionError) {
    return { error: "No se pudo actualizar la sesión: " + sessionError.message };
  }

  const attendanceRows = buildAttendanceRows(formData, sessionId);

  if (attendanceRows.length > 0) {
    const { error: attendanceError } = await supabase
      .from("attendance")
      .upsert(attendanceRows, { onConflict: "session_id,player_id" });

    if (attendanceError) {
      return { error: "Se actualizó el contenido pero falló la asistencia: " + attendanceError.message };
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
