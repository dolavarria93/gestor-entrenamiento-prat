"use client";

import { useActionState, useState } from "react";
import { actualizarCategoria, actualizarFundamentos } from "@/lib/actions/categorias";
import EquipoRow from "./EquipoRow";

interface Categoria {
  id: string;
  nombre: string;
}

export default function CategoriaCard({
  categoria,
  fundamentos,
  equipos,
  todasLasCategorias,
}: {
  categoria: Categoria;
  fundamentos: string[];
  equipos: { id: string; nombre: string; categoria_id: string }[];
  todasLasCategorias: Categoria[];
}) {
  const [nombreState, nombreAction, nombrePending] = useActionState(actualizarCategoria, undefined);
  const [fundState, fundAction, fundPending] = useActionState(actualizarFundamentos, undefined);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [editandoFundamentos, setEditandoFundamentos] = useState(false);

  return (
    <div className="rounded-lg border border-ink/10 p-3">
      {editandoNombre ? (
        <form action={nombreAction} className="flex items-center gap-2">
          <input type="hidden" name="categoria_id" value={categoria.id} />
          <input
            name="nombre"
            defaultValue={categoria.nombre}
            className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm text-ink outline-none focus:border-prat-blue"
          />
          <button
            type="submit"
            disabled={nombrePending}
            className="rounded-md bg-prat-blue px-2 py-1 text-xs font-medium text-paper disabled:opacity-60"
          >
            {nombrePending ? "…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => setEditandoNombre(false)}
            className="text-xs text-ink/50 hover:underline"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink">{categoria.nombre}</p>
          <button
            type="button"
            onClick={() => setEditandoNombre(true)}
            className="text-xs text-prat-blue hover:underline"
          >
            Renombrar
          </button>
        </div>
      )}
      {nombreState?.error && <p className="mt-1 text-xs text-alert-red">{nombreState.error}</p>}

      <div className="mt-2 flex flex-col gap-1">
        <p className="text-xs font-medium text-ink/50">Equipos</p>
        {equipos.length === 0 ? (
          <p className="text-xs text-ink/40">Ninguno todavía.</p>
        ) : (
          equipos.map((eq) => <EquipoRow key={eq.id} equipo={eq} categorias={todasLasCategorias} />)
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-ink/50">Fundamentos de evaluación</p>
          <button
            type="button"
            onClick={() => setEditandoFundamentos((v) => !v)}
            className="text-xs text-prat-blue hover:underline"
          >
            {editandoFundamentos ? "Cancelar" : "Editar"}
          </button>
        </div>

        {editandoFundamentos ? (
          <form action={fundAction} className="mt-1 flex flex-col gap-2">
            <input type="hidden" name="categoria_id" value={categoria.id} />
            <textarea
              name="fundamentos"
              rows={Math.max(4, fundamentos.length)}
              defaultValue={fundamentos.join("\n")}
              className="resize-none rounded-md border border-ink/10 bg-paper p-2 text-xs text-ink outline-none focus:border-prat-blue"
            />
            <p className="text-xs text-ink/40">
              Uno por línea. Ojo: si le cambiás el nombre a un fundamento, las evaluaciones ya guardadas con
              el nombre viejo quedan como registro histórico aparte.
            </p>
            {fundState?.error && <p className="text-xs text-alert-red">{fundState.error}</p>}
            <button
              type="submit"
              disabled={fundPending}
              className="self-start rounded-md bg-prat-blue px-3 py-1.5 text-xs font-medium text-paper disabled:opacity-60"
            >
              {fundPending ? "Guardando…" : "Guardar fundamentos"}
            </button>
          </form>
        ) : (
          <p className="text-xs text-ink/40">{fundamentos.join(", ") || "sin definir"}</p>
        )}
      </div>
    </div>
  );
}
