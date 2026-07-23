"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";

function generarPassword(): string {
  return (
    Math.random().toString(36).slice(-8) +
    Math.random().toString(36).slice(-4).toUpperCase()
  );
}

export async function crearEntrenador(
  _prevState: { error?: string; ok?: boolean; email?: string; password?: string } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();

  if (profile.role !== "admin_club" && profile.role !== "super_admin") {
    return { error: "No tenés permiso para crear entrenadores." };
  }

  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const teamIds = formData.getAll("team_id").map(String);

  if (!nombre || !email) return { error: "Falta nombre o email." };
  if (teamIds.length === 0) return { error: "Elegí al menos un equipo." };

  let clubId = profile.club_id;
  if (!clubId) {
    const supabaseTmp = await createClient();
    const { data: primerClub } = await supabaseTmp.from("clubs").select("id").limit(1).maybeSingle();
    clubId = primerClub?.id ?? null;
  }
  if (!clubId) return { error: "No se encontró el club." };

  const password = generarPassword();
  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: "No se pudo crear el usuario: " + (createError?.message ?? "error desconocido") };
  }

  const supabase = await createClient();

  const { error: profileError } = await supabase.from("profiles").insert({
    id: created.user.id,
    club_id: clubId,
    role: "entrenador",
    nombre,
  });

  if (profileError) {
    return { error: "El usuario se creó pero falló el perfil: " + profileError.message };
  }

  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .insert({ club_id: clubId, user_id: created.user.id, nombre })
    .select("id")
    .single();

  if (coachError || !coach) {
    return { error: "Falló crear el registro de entrenador: " + (coachError?.message ?? "error desconocido") };
  }

  const { error: ctError } = await supabase
    .from("coach_teams")
    .insert(teamIds.map((teamId) => ({ coach_id: coach.id, team_id: teamId })));

  if (ctError) {
    return { error: "Se creó el entrenador pero falló asignar el/los equipo(s): " + ctError.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, email, password };
}

export async function eliminarEntrenador(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();

  if (profile.role !== "admin_club" && profile.role !== "super_admin") {
    return { error: "No tenés permiso para eliminar entrenadores." };
  }

  const coachId = String(formData.get("coach_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");

  if (!coachId || !userId) return { error: "Falta el entrenador." };

  const supabase = await createClient();

  // Le sacamos el acceso a sus equipos de entrada, pase lo que pase con el
  // resto — así deja de poder cargar nada aunque no se pueda borrar del todo.
  const { error: ctError } = await supabase.from("coach_teams").delete().eq("coach_id", coachId);
  if (ctError) {
    return { error: "No se pudo quitar el acceso a los equipos: " + ctError.message };
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

  if (deleteError) {
    revalidatePath("/", "layout");
    return {
      error:
        "Le saqué el acceso a sus equipos, pero no se pudo borrar la cuenta por completo — probablemente " +
        "tiene sesiones registradas en el historial. Ya no puede cargar ni ver nada nuevo.",
    };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
