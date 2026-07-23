"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { getFundamentos } from "@/lib/queries/categorias";
import type { Periodo } from "@/lib/supabase/database.types";

export async function guardarEvaluacion(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const playerId = String(formData.get("player_id") ?? "");
  const periodo = String(formData.get("periodo") ?? "") as Periodo;
  const categoriaId = String(formData.get("categoria_id") ?? "");
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!playerId || !periodo || !categoriaId) {
    return { error: "Falta seleccionar jugador y período." };
  }

  const fundamentos = await getFundamentos(supabase, categoriaId);
  if (fundamentos.length === 0) {
    return { error: "Esta categoría todavía no tiene fundamentos de evaluación definidos." };
  }

  const rows = fundamentos.map((fundamento) => {
    const puntaje = Number(formData.get(`puntaje_${fundamento}`));
    return {
      player_id: playerId,
      periodo,
      fundamento,
      puntaje,
      notas,
      evaluado_por: profile.id,
    };
  });

  if (rows.some((r) => !r.puntaje || r.puntaje < 1 || r.puntaje > 5)) {
    return { error: "Falta puntuar todos los fundamentos (1 a 5)." };
  }

  const { error } = await supabase
    .from("evaluations")
    .upsert(rows, { onConflict: "player_id,periodo,fundamento" });

  if (error) {
    return { error: "No se pudo guardar la evaluación: " + error.message };
  }

  // Se llama tanto desde /entrenador/[teamId]/evaluaciones como desde
  // /admin/equipos/[teamId]/jugadores/[playerId] — revalidar todo es más
  // simple que enumerar ambas rutas y la app es chica.
  revalidatePath("/", "layout");
  return { ok: true };
}
