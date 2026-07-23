"use client";

import { useActionState, useState } from "react";
import { crearCategoria } from "@/lib/actions/categorias";

interface Categoria {
  id: string;
  nombre: string;
}

export default function NuevaCategoriaForm({ categorias }: { categorias: Categoria[] }) {
  const [state, formAction, pending] = useActionState(crearCategoria, undefined);
  const [modo, setModo] = useState<"copiar" | "manual">(categorias.length > 0 ? "copiar" : "manual");

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-ink/10 bg-white p-4">
      <h2 className="font-display text-sm font-semibold text-prat-blue">Nueva categoría</h2>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-ink/50">Nombre</label>
        <input
          name="nombre"
          required
          placeholder="Ej: Sub12"
          className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-prat-blue"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-ink/50">Fundamentos de evaluación</label>

        {categorias.length > 0 && (
          <div className="flex gap-4 text-sm text-ink">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="modo"
                checked={modo === "copiar"}
                onChange={() => setModo("copiar")}
                className="accent-prat-blue"
              />
              Copiar de una categoría existente
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="modo"
                checked={modo === "manual"}
                onChange={() => setModo("manual")}
                className="accent-prat-blue"
              />
              Escribirlos a mano
            </label>
          </div>
        )}

        {modo === "copiar" && categorias.length > 0 ? (
          <select
            name="copiar_de"
            className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-prat-blue"
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        ) : (
          <textarea
            name="fundamentos"
            rows={5}
            placeholder={"Uno por línea, por ejemplo:\nSaque\nRecepción\nAtaque\nTrabajo en equipo"}
            className="resize-none rounded-lg border border-ink/10 bg-paper p-3 text-sm text-ink outline-none focus:border-prat-blue"
          />
        )}
      </div>

      {state?.error && (
        <p className="rounded-lg bg-alert-red/10 px-3 py-2 text-sm text-alert-red">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-success-green/10 px-3 py-2 text-sm text-success-green">
          Categoría creada.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-prat-blue px-5 py-2.5 font-display font-semibold text-paper transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear categoría"}
      </button>
    </form>
  );
}
