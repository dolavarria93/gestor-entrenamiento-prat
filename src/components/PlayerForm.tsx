"use client";

import { useActionState } from "react";
import { fechaISOaDDMMAAAA } from "@/lib/format";

type EstadoAccion = { error?: string; ok?: boolean };
type Accion = (state: EstadoAccion | undefined, formData: FormData) => Promise<EstadoAccion>;

interface EquipoOpcion {
  id: string;
  nombre: string;
  categoriaNombre?: string;
}

export default function PlayerForm({
  action,
  hiddenFields,
  initial,
  equipos,
  equiposSeleccionados,
  submitLabel,
  onCancel,
}: {
  action: Accion;
  hiddenFields: Record<string, string>;
  initial?: {
    nombre?: string;
    rut?: string | null;
    fecha_nacimiento?: string | null;
    posicion?: string | null;
  };
  equipos: EquipoOpcion[];
  equiposSeleccionados: string[];
  submitLabel: string;
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-ink/50">Nombre completo</label>
        <input
          name="nombre"
          required
          defaultValue={initial?.nombre}
          placeholder="Nombre y apellidos"
          className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-prat-blue"
        />
        <p className="text-xs text-ink/40">Se guarda en MAYÚSCULA y sin tildes automáticamente.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-ink/50">RUT</label>
        <input
          name="rut"
          required
          defaultValue={initial?.rut ?? ""}
          placeholder="12345678-9"
          className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-prat-blue"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-ink/50">Fecha de nacimiento</label>
        <input
          name="fecha_nacimiento"
          defaultValue={initial?.fecha_nacimiento ? fechaISOaDDMMAAAA(initial.fecha_nacimiento) : ""}
          placeholder="dd/mm/aaaa"
          className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-prat-blue"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-ink/50">Posición (opcional)</label>
        <input
          name="posicion"
          defaultValue={initial?.posicion ?? ""}
          className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-prat-blue"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-ink/50">Equipos (puede estar en más de uno)</label>
        <div className="flex flex-col gap-1 rounded-lg border border-ink/10 bg-paper p-2">
          {equipos.map((eq) => (
            <label key={eq.id} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="team_id"
                value={eq.id}
                defaultChecked={equiposSeleccionados.includes(eq.id)}
                className="accent-prat-blue"
              />
              {eq.nombre}
              {eq.categoriaNombre && <span className="text-xs text-ink/40">({eq.categoriaNombre})</span>}
            </label>
          ))}
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-alert-red/10 px-3 py-2 text-sm text-alert-red">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-success-green/10 px-3 py-2 text-sm text-success-green">Guardado.</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg bg-prat-blue px-4 py-2 text-sm font-display font-semibold text-paper transition hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Guardando…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-ink/10 px-4 py-2 text-sm text-ink/60"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
