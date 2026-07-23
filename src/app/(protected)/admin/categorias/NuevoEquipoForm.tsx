"use client";

import { useActionState } from "react";
import { crearEquipo } from "@/lib/actions/categorias";

interface Categoria {
  id: string;
  nombre: string;
}

export default function NuevoEquipoForm({ categorias }: { categorias: Categoria[] }) {
  const [state, formAction, pending] = useActionState(crearEquipo, undefined);

  if (categorias.length === 0) {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-4 text-sm text-ink/50">
        Creá primero una categoría para poder agregarle un equipo.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-ink/10 bg-white p-4">
      <h2 className="font-display text-sm font-semibold text-prat-blue">Nuevo equipo</h2>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-ink/50">Nombre</label>
        <input
          name="nombre"
          required
          placeholder="Ej: Sub12 Damas"
          className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-prat-blue"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-ink/50">Categoría</label>
        <select
          name="categoria_id"
          className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-prat-blue"
        >
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-alert-red/10 px-3 py-2 text-sm text-alert-red">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-success-green/10 px-3 py-2 text-sm text-success-green">
          Equipo creado.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-prat-blue px-5 py-2.5 font-display font-semibold text-paper transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear equipo"}
      </button>
    </form>
  );
}
