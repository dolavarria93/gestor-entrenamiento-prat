// Al llegar al final de la progresión de una categoría se repite desde el
// paso 1 (unidad base repetible por trimestre). Si la categoría todavía no
// tiene progresión cargada (planLength 0, ej. una categoría nueva), no hay
// paso que sugerir — el entrenador escribe el contenido a mano.
export function ordenSiguiente(planLength: number, sesionesPrevias: number): number | null {
  if (planLength <= 0) return null;
  return (sesionesPrevias % planLength) + 1;
}
