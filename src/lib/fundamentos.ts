import type { Categoria } from "@/lib/supabase/database.types";

// Fundamentos de evaluación por categoría — mismo modelo que pauta_evaluacion.docx
// y la pestaña "Evaluación" del Gestor de Desarrollo de Jugadores (Excel).
export const FUNDAMENTOS_POR_CATEGORIA: Record<Categoria, string[]> = {
  Mini: [
    "Coordinación motriz",
    "Manejo de balón",
    "Desplazamiento/Ubicación",
    "Trabajo en equipo",
    "Actitud",
  ],
  Sub15: [
    "Saque",
    "Recepción",
    "Defensa",
    "Colocación/Armado",
    "Ataque",
    "Bloqueo",
    "Trabajo en equipo",
    "Actitud",
  ],
  Sub18: [
    "Saque",
    "Recepción",
    "Defensa",
    "Colocación/Armado",
    "Ataque",
    "Bloqueo",
    "Trabajo en equipo",
    "Actitud",
  ],
};

// Escala 1-5 usada en pauta_evaluacion.docx
export const ESCALA_EVALUACION = [
  { valor: 1, etiqueta: "Inicial" },
  { valor: 2, etiqueta: "En desarrollo" },
  { valor: 3, etiqueta: "Adecuado" },
  { valor: 4, etiqueta: "Sólido" },
  { valor: 5, etiqueta: "Destacado" },
] as const;

export const PERIODOS = ["Pretemporada", "Mitad de temporada", "Cierre de temporada"] as const;
