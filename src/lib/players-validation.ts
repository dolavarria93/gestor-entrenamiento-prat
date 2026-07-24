import { validarRut, normalizarRut } from "@/lib/rut";
import { normalizarTexto, fechaDDMMAAAAaISO } from "@/lib/format";

export type CamposJugador =
  | { error: string }
  | { nombre: string; rut: string; posicion: string | null; fecha_nacimiento: string | null };

export function parseCamposJugador(
  nombreRaw: string,
  rutRaw: string,
  fechaRaw: string,
  posicionRaw: string,
): CamposJugador {
  const nombre = normalizarTexto(nombreRaw);
  const posicionLimpia = posicionRaw.trim();
  const posicion = posicionLimpia ? normalizarTexto(posicionLimpia) : null;
  const rutInput = rutRaw.trim();
  const fechaInput = fechaRaw.trim();

  if (!nombre) return { error: "Falta el nombre." };
  if (!rutInput || !validarRut(rutInput)) {
    return { error: "El RUT no es válido. Formato: 12345678-9, con dígito verificador correcto." };
  }

  let fecha_nacimiento: string | null = null;
  if (fechaInput) {
    fecha_nacimiento = fechaDDMMAAAAaISO(fechaInput);
    if (!fecha_nacimiento) {
      return { error: "La fecha de nacimiento debe tener el formato dd/mm/aaaa." };
    }
  }

  return { nombre, rut: normalizarRut(rutInput), posicion, fecha_nacimiento };
}
