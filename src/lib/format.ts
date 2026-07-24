// Mayúscula sin tildes — estándar para nombres/posiciones en nóminas.
export function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ");
}

// "dd/mm/aaaa" -> "aaaa-mm-dd" (para guardar como date). null si no es una
// fecha válida en ese formato.
export function fechaDDMMAAAAaISO(input: string): string | null {
  const match = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, ddStr, mmStr, yyyyStr] = match;
  const dia = Number(ddStr);
  const mes = Number(mmStr);
  const anio = Number(yyyyStr);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;

  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) {
    return null; // ej. 31/02
  }

  return `${String(anio).padStart(4, "0")}-${mmStr.padStart(2, "0")}-${ddStr.padStart(2, "0")}`;
}

// "aaaa-mm-dd" -> "dd/mm/aaaa"
export function fechaISOaDDMMAAAA(iso: string): string {
  const [yyyy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

export function calcularEdad(iso: string): number {
  const hoy = new Date();
  const nacimiento = new Date(iso + "T00:00:00");
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const diffMes = hoy.getMonth() - nacimiento.getMonth();
  if (diffMes < 0 || (diffMes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}
