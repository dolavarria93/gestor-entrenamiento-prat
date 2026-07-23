import type { SupabaseClient } from "@supabase/supabase-js";

// Fundamentos de evaluación de una categoría, en orden. Antes era un
// Record<Categoria, string[]> hardcodeado; ahora vive en fundamentos_evaluacion
// para que cada categoría nueva defina los suyos.
export async function getFundamentos(supabase: SupabaseClient, categoriaId: string): Promise<string[]> {
  const { data } = await supabase
    .from("fundamentos_evaluacion")
    .select("nombre")
    .eq("categoria_id", categoriaId)
    .order("orden");

  return (data ?? []).map((f) => f.nombre as string);
}
