"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { FUNDAMENTOS_POR_CATEGORIA } from "@/lib/fundamentos";
import type { Categoria, Periodo } from "@/lib/supabase/database.types";

export async function guardarEvaluacion(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const playerId = String(formData.get("player_id") ?? "");
  const periodo = String(formData.get("periodo") ?? "") as Periodo;
  const categoria = String(formData.get("categoria") ?? "") as Categoria;
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!playerId || !periodo || !categoria) {
    return { error: "Falta seleccionar jugador y período." };
  }

  const fundamentos = FUNDAMENTOS_POR_CATEGORIA[categoria];

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
