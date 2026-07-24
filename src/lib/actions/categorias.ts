"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

async function resolveClubId(supabase: Awaited<ReturnType<typeof createClient>>, clubIdDelPerfil: string | null) {
  if (clubIdDelPerfil) return clubIdDelPerfil;
  const { data: primerClub } = await supabase.from("clubs").select("id").limit(1).maybeSingle();
  return primerClub?.id ?? null;
}

export async function crearCategoria(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();
  if (profile.role !== "admin_club" && profile.role !== "super_admin") {
    return { error: "No tenés permiso para crear categorías." };
  }

  const nombre = String(formData.get("nombre") ?? "").trim();
  const fundamentosTexto = String(formData.get("fundamentos") ?? "").trim();
  const copiarDeId = String(formData.get("copiar_de") ?? "").trim();

  if (!nombre) return { error: "Falta el nombre de la categoría." };

  const supabase = await createClient();
  const clubId = await resolveClubId(supabase, profile.club_id);
  if (!clubId) return { error: "No se encontró el club." };

  const { count: existentes } = await supabase
    .from("categorias")
    .select("id", { count: "exact", head: true })
    .eq("club_id", clubId);

  const { data: categoria, error: catError } = await supabase
    .from("categorias")
    .insert({ club_id: clubId, nombre, orden: (existentes ?? 0) + 1 })
    .select("id")
    .single();

  if (catError || !categoria) {
    return { error: "No se pudo crear la categoría: " + (catError?.message ?? "error desconocido") };
  }

  let fundamentos: string[] = [];
  if (copiarDeId) {
    const { data: fuente } = await supabase
      .from("fundamentos_evaluacion")
      .select("nombre")
      .eq("categoria_id", copiarDeId)
      .order("orden");
    fundamentos = (fuente ?? []).map((f) => f.nombre);
  } else {
    fundamentos = fundamentosTexto
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);
  }

  if (fundamentos.length > 0) {
    const { error: fundError } = await supabase.from("fundamentos_evaluacion").insert(
      fundamentos.map((nombreFundamento, i) => ({
        categoria_id: categoria.id,
        nombre: nombreFundamento,
        orden: i + 1,
      })),
    );
    if (fundError) {
      return { error: "La categoría se creó pero fallaron los fundamentos: " + fundError.message };
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function crearEquipo(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();
  if (profile.role !== "admin_club" && profile.role !== "super_admin") {
    return { error: "No tenés permiso para crear equipos." };
  }

  const nombre = String(formData.get("nombre") ?? "").trim();
  const categoriaId = String(formData.get("categoria_id") ?? "");

  if (!nombre || !categoriaId) return { error: "Falta el nombre o la categoría." };

  const supabase = await createClient();
  const clubId = await resolveClubId(supabase, profile.club_id);
  if (!clubId) return { error: "No se encontró el club." };

  const { error } = await supabase
    .from("teams")
    .insert({ club_id: clubId, nombre, categoria_id: categoriaId });

  if (error) return { error: "No se pudo crear el equipo: " + error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function actualizarFundamentos(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();
  if (profile.role !== "admin_club" && profile.role !== "super_admin") {
    return { error: "No tenés permiso para editar fundamentos." };
  }

  const categoriaId = String(formData.get("categoria_id") ?? "");
  const fundamentosTexto = String(formData.get("fundamentos") ?? "").trim();

  if (!categoriaId) return { error: "Falta la categoría." };

  const fundamentos = fundamentosTexto
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("fundamentos_evaluacion")
    .delete()
    .eq("categoria_id", categoriaId);

  if (deleteError) {
    return { error: "No se pudo actualizar: " + deleteError.message };
  }

  if (fundamentos.length > 0) {
    const { error: insertError } = await supabase.from("fundamentos_evaluacion").insert(
      fundamentos.map((nombreFundamento, i) => ({
        categoria_id: categoriaId,
        nombre: nombreFundamento,
        orden: i + 1,
      })),
    );
    if (insertError) {
      return { error: "No se pudo actualizar: " + insertError.message };
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function actualizarEquipo(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();
  if (profile.role !== "admin_club" && profile.role !== "super_admin") {
    return { error: "No tenés permiso para editar equipos." };
  }

  const teamId = String(formData.get("team_id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const categoriaId = String(formData.get("categoria_id") ?? "");

  if (!teamId || !nombre || !categoriaId) return { error: "Falta el nombre o la categoría." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("teams")
    .update({ nombre, categoria_id: categoriaId })
    .eq("id", teamId);

  if (error) return { error: "No se pudo actualizar el equipo: " + error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function actualizarCategoria(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const profile = await requireProfile();
  if (profile.role !== "admin_club" && profile.role !== "super_admin") {
    return { error: "No tenés permiso para editar categorías." };
  }

  const categoriaId = String(formData.get("categoria_id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();

  if (!categoriaId || !nombre) return { error: "Falta el nombre." };

  const supabase = await createClient();
  const { error } = await supabase.from("categorias").update({ nombre }).eq("id", categoriaId);

  if (error) return { error: "No se pudo renombrar la categoría: " + error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
