// Validación de RUT chileno (dígito verificador módulo 11).

function limpiar(rut: string): string {
  return rut.replace(/\./g, "").replace(/\s+/g, "").toUpperCase().trim();
}

function calcularDV(numero: number): string {
  let suma = 0;
  let multiplicador = 2;
  let n = numero;
  while (n > 0) {
    suma += (n % 10) * multiplicador;
    n = Math.floor(n / 10);
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

// Exige guión + dígito verificador, y que el dígito cierre matemáticamente.
export function validarRut(rutInput: string): boolean {
  const limpio = limpiar(rutInput);
  const match = limpio.match(/^(\d{1,8})-([0-9K])$/);
  if (!match) return false;
  const [, numero, dv] = match;
  return calcularDV(Number(numero)) === dv;
}

// Formato de guardado: sin puntos, con guión, DV en mayúscula.
export function normalizarRut(rutInput: string): string {
  return limpiar(rutInput);
}
