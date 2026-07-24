"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { parseCamposJugador, type CamposJugador } from "@/lib/players-validation";
import { findPlayerByRut } from "@/lib/queries/players";

function celdaComoTexto(valor: unknown): string {
  if (valor instanceof Date) {
    const dd = String(valor.getUTCDate()).padStart(2, "0");
    const mm = String(valor.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = valor.getUTCFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  if (valor && typeof valor === "object" && "text" in valor) {
    return String((valor as { text: unknown }).text ?? "").trim();
  }
  return String(valor ?? "").trim();
}

function parseCampos(formData: FormData): CamposJugador {
  return parseCamposJugador(
    String(formData.get("nombre") ?? ""),
    String(formData.get("rut") ?? ""),
    String(formData.get("fecha_nacimiento") ?? ""),
    String(formData.get("posicion") ?? ""),
  );
}

function puedeGestionarJugadores(role: string): boolean {
  return role === "admin_club" || role === "super_admin" || role === "entrenador";
}

export async function crearJugador(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();
  if (!puedeGestionarJugadores(profile.role)) {
    return { error: "No tenés permiso para agregar jugadores." };
  }

  const teamIds = formData.getAll("team_id").map(String).filter(Boolean);
  if (teamIds.length === 0) return { error: "Elegí al menos un equipo." };

  const campos = parseCampos(formData);
  if ("error" in campos) return campos;

  const supabase = await createClient();

  // Generamos el id acá en vez de pedirle a Postgres que lo devuelva
  // (RETURNING): un jugador recién creado, sin ninguna fila en player_teams
  // todavía, no es "visible" para nadie según la policy de select — y
  // RETURNING exige poder leer la fila que se acaba de insertar.
  const playerId = crypto.randomUUID();

  const { error } = await supabase.from("players").insert({ id: playerId, ...campos });
  if (error) {
    return { error: "No se pudo crear el jugador: " + error.message };
  }

  const { error: ptError } = await supabase
    .from("player_teams")
    .insert(teamIds.map((team_id) => ({ player_id: playerId, team_id })));

  if (ptError) {
    return { error: "El jugador se creó pero falló asignarlo a el/los equipo(s): " + ptError.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function actualizarJugador(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();
  if (!puedeGestionarJugadores(profile.role)) {
    return { error: "No tenés permiso para editar jugadores." };
  }

  const playerId = String(formData.get("player_id") ?? "");
  if (!playerId) return { error: "Falta el jugador." };

  const teamIdsNuevos = formData.getAll("team_id").map(String).filter(Boolean);
  if (teamIdsNuevos.length === 0) return { error: "Elegí al menos un equipo." };

  const campos = parseCampos(formData);
  if ("error" in campos) return campos;

  const supabase = await createClient();

  const { error } = await supabase.from("players").update(campos).eq("id", playerId);
  if (error) return { error: "No se pudo actualizar el jugador: " + error.message };

  const { data: actuales } = await supabase.from("player_teams").select("team_id").eq("player_id", playerId);
  const actualesIds = new Set((actuales ?? []).map((r) => r.team_id as string));
  const nuevosIds = new Set(teamIdsNuevos);

  const aAgregar = teamIdsNuevos.filter((id) => !actualesIds.has(id));
  const aQuitar = [...actualesIds].filter((id) => !nuevosIds.has(id));

  if (aAgregar.length > 0) {
    const { error: addError } = await supabase
      .from("player_teams")
      .insert(aAgregar.map((team_id) => ({ player_id: playerId, team_id })));
    if (addError) return { error: "No se pudieron agregar todos los equipos: " + addError.message };
  }

  if (aQuitar.length > 0) {
    const { error: delError } = await supabase
      .from("player_teams")
      .delete()
      .eq("player_id", playerId)
      .in("team_id", aQuitar);
    if (delError) return { error: "No se pudieron quitar todos los equipos: " + delError.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// Saca al jugador de UN equipo/categoría puntual, sin tocar su estado en
// las demás categorías donde también juegue ni su historial.
export async function quitarDeEquipo(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();
  if (!puedeGestionarJugadores(profile.role)) {
    return { error: "No tenés permiso para editar el plantel." };
  }

  const playerId = String(formData.get("player_id") ?? "");
  const teamId = String(formData.get("team_id") ?? "");
  if (!playerId || !teamId) return { error: "Falta el jugador o el equipo." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("player_teams")
    .delete()
    .eq("player_id", playerId)
    .eq("team_id", teamId);

  if (error) return { error: "No se pudo quitar del equipo: " + error.message };

  revalidatePath("/", "layout");

  const redirectTo = String(formData.get("redirect_to") ?? "");
  if (redirectTo) redirect(redirectTo);

  return { ok: true };
}

export async function importarJugadores(
  _prevState: { error?: string; ok?: boolean; importados?: number; errores?: string[] } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();
  if (!puedeGestionarJugadores(profile.role)) {
    return { error: "No tenés permiso para importar jugadores." };
  }

  const teamId = String(formData.get("team_id") ?? "");
  if (!teamId) return { error: "Falta el equipo." };

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Subí un archivo Excel (.xlsx)." };
  }

  const buffer = await archivo.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    return { error: "No se pudo leer el archivo. ¿Es un .xlsx válido?" };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) return { error: "El archivo no tiene ninguna hoja." };

  const supabase = await createClient();
  const errores: string[] = [];
  let importados = 0;

  const filas = sheet.rowCount > 1 ? (sheet.getRows(2, sheet.rowCount - 1) ?? []) : [];

  for (const row of filas) {
    const nombreRaw = celdaComoTexto(row.getCell(1).value);
    const rutRaw = celdaComoTexto(row.getCell(2).value);
    const fechaRaw = celdaComoTexto(row.getCell(3).value);
    const posicionRaw = celdaComoTexto(row.getCell(4).value);

    if (!nombreRaw && !rutRaw) continue; // fila vacía

    const campos = parseCamposJugador(nombreRaw, rutRaw, fechaRaw, posicionRaw);
    if ("error" in campos) {
      errores.push(`Fila ${row.number}: ${campos.error}`);
      continue;
    }

    const existente = await findPlayerByRut(supabase, campos.rut);

    if (existente) {
      const { error: ptError } = await supabase
        .from("player_teams")
        .upsert({ player_id: existente.id, team_id: teamId }, { onConflict: "player_id,team_id" });
      if (ptError) {
        errores.push(`Fila ${row.number} (${campos.rut}): ya existía, pero falló sumarlo al equipo — ${ptError.message}`);
        continue;
      }
      importados++;
      continue;
    }

    const nuevoPlayerId = crypto.randomUUID();
    const { error: insError } = await supabase.from("players").insert({ id: nuevoPlayerId, ...campos });

    if (insError) {
      errores.push(`Fila ${row.number} (${campos.rut}): ${insError.message}`);
      continue;
    }

    const { error: ptError } = await supabase
      .from("player_teams")
      .insert({ player_id: nuevoPlayerId, team_id: teamId });

    if (ptError) {
      errores.push(`Fila ${row.number} (${campos.rut}): se creó pero falló asignarlo al equipo — ${ptError.message}`);
      continue;
    }

    importados++;
  }

  revalidatePath("/", "layout");
  return { ok: true, importados, errores };
}

// "Eliminar" un jugador es una baja lógica con motivo obligatorio — no se
// borra la fila, para conservar su historial de asistencia y evaluaciones.
export async function darDeBajaJugador(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();
  if (!puedeGestionarJugadores(profile.role)) {
    return { error: "No tenés permiso para dar de baja jugadores." };
  }

  const playerId = String(formData.get("player_id") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!playerId) return { error: "Falta el jugador." };
  if (!motivo) return { error: "Falta el motivo de la baja." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("players")
    .update({
      activo: false,
      motivo_baja: motivo,
      fecha_baja: new Date().toISOString().slice(0, 10),
    })
    .eq("id", playerId);

  if (error) return { error: "No se pudo dar de baja al jugador: " + error.message };

  revalidatePath("/", "layout");

  const redirectTo = String(formData.get("redirect_to") ?? "");
  if (redirectTo) redirect(redirectTo);

  return { ok: true };
}
