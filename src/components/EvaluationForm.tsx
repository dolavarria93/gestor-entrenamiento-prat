"use client";

import { useActionState, useState } from "react";
import { guardarEvaluacion } from "@/lib/actions/evaluations";
import { ESCALA_EVALUACION } from "@/lib/fundamentos";
import type { Categoria, Periodo } from "@/lib/supabase/database.types";

export default function EvaluationForm({
  categoria,
  playerId,
  periodo,
  fundamentos,
  puntajesPrevios,
  notasPrevias,
  variant = "fixed",
}: {
  categoria: Categoria;
  playerId: string;
  periodo: Periodo;
  fundamentos: string[];
  puntajesPrevios: Record<string, number>;
  notasPrevias: string;
  variant?: "fixed" | "inline";
}) {
  const [state, formAction, pending] = useActionState(guardarEvaluacion, undefined);
  const [puntajes, setPuntajes] = useState<Record<string, number>>(puntajesPrevios);

  return (
    <form action={formAction} className={`flex flex-col gap-4 ${variant === "fixed" ? "pb-24" : ""}`}>
      <input type="hidden" name="categoria" value={categoria} />
      <input type="hidden" name="player_id" value={playerId} />
      <input type="hidden" name="periodo" value={periodo} />

      {fundamentos.map((fundamento) => (
        <section key={fundamento} className="rounded-xl border border-ink/10 bg-white p-4">
          <h2 className="font-display text-sm font-semibold text-prat-blue">{fundamento}</h2>
          <input type="hidden" name={`puntaje_${fundamento}`} value={puntajes[fundamento] ?? ""} />
          <div className="mt-3 grid grid-cols-5 gap-2">
            {ESCALA_EVALUACION.map((nivel) => {
              const activo = puntajes[fundamento] === nivel.valor;
              return (
                <button
                  key={nivel.valor}
                  type="button"
                  onClick={() => setPuntajes((prev) => ({ ...prev, [fundamento]: nivel.valor }))}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center transition ${
                    activo ? "border-cisnes-gold bg-cisnes-gold/15" : "border-ink/10 bg-paper"
                  }`}
                >
                  <span className={`font-display text-lg font-semibold ${activo ? "text-cisnes-gold" : "text-ink"}`}>
                    {nivel.valor}
                  </span>
                  <span className="text-[10px] leading-tight text-ink/50">{nivel.etiqueta}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="font-display text-sm font-semibold text-prat-blue">Notas</h2>
        <textarea
          name="notas"
          defaultValue={notasPrevias}
          rows={3}
          placeholder="Opcional"
          className="mt-2 w-full resize-none rounded-lg border border-ink/10 bg-paper p-3 text-sm text-ink outline-none focus:border-prat-blue"
        />
      </section>

      {state?.error && (
        <p className="rounded-lg bg-alert-red/10 px-3 py-2 text-sm text-alert-red">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-success-green/10 px-3 py-2 text-sm text-success-green">
          Evaluación guardada.
        </p>
      )}

      {variant === "fixed" ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-ink/10 bg-paper/95 p-4 backdrop-blur">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-prat-blue px-4 py-3 font-display font-semibold text-paper transition hover:brightness-95 disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar evaluación"}
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-prat-blue px-4 py-2.5 font-display font-semibold text-paper transition hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      )}
    </form>
  );
}
