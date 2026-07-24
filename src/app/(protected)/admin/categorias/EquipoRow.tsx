"use client";

import { useActionState, useState } from "react";
import { actualizarEquipo } from "@/lib/actions/categorias";

interface Categoria {
  id: string;
  nombre: string;
}

export default function EquipoRow({
  equipo,
  categorias,
}: {
  equipo: { id: string; nombre: string; categoria_id: string };
  categorias: Categoria[];
}) {
  const [state, formAction, pending] = useActionState(actualizarEquipo, undefined);
  const [editando, setEditando] = useState(false);

  if (!editando) {
    return (
      <div className="flex items-center justify-between text-xs text-ink/60">
        <span>{equipo.nombre}</span>
        <button type="button" onClick={() => setEditando(true)} className="text-prat-blue hover:underline">
          Editar
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-lg bg-paper p-2">
      <input type="hidden" name="team_id" value={equipo.id} />
      <input
        name="nombre"
        defaultValue={equipo.nombre}
        className="rounded-md border border-ink/10 bg-white px-2 py-1 text-xs text-ink outline-none focus:border-prat-blue"
      />
      <select
        name="categoria_id"
        defaultValue={equipo.categoria_id}
        className="rounded-md border border-ink/10 bg-white px-2 py-1 text-xs text-ink outline-none focus:border-prat-blue"
      >
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
      {state?.error && <p className="text-xs text-alert-red">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-prat-blue px-2 py-1 text-xs font-medium text-paper disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="rounded-md border border-ink/10 px-2 py-1 text-xs text-ink/60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
