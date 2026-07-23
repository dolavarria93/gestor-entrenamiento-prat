import type { Categoria } from "@/lib/supabase/database.types";

// Cantidad de pasos en la progresión de cada categoría (ver seed_plan_progresion.sql).
// Al llegar al final se repite desde el paso 1 (unidad base repetible por trimestre).
export const PLAN_LENGTH: Record<Categoria, number> = {
  Mini: 8,
  Sub15: 6,
  Sub18: 6,
};

export function ordenSiguiente(categoria: Categoria, sesionesPrevias: number): number {
  return (sesionesPrevias % PLAN_LENGTH[categoria]) + 1;
}
