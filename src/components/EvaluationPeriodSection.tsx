"use client";

import { useState } from "react";
import EvaluationForm from "./EvaluationForm";
import { ESCALA_EVALUACION } from "@/lib/fundamentos";
import type { Categoria, Periodo } from "@/lib/supabase/database.types";

interface EvaluacionFundamento {
  fundamento: string;
  puntaje: number;
}

export default function EvaluationPeriodSection({
  categoria,
  playerId,
  periodo,
  fundamentos,
  evaluacionesPeriodo,
  notasPrevias,
}: {
  categoria: Categoria;
  playerId: string;
  periodo: Periodo;
  fundamentos: string[];
  evaluacionesPeriodo: EvaluacionFundamento[];
  notasPrevias: string;
}) {
  const [editando, setEditando] = useState(false);

  const etiquetaNivel = (puntaje: number) =>
    ESCALA_EVALUACION.find((n) => n.valor === puntaje)?.etiqueta ?? "";

  const promedio =
    evaluacionesPeriodo.length > 0
      ? Math.round((evaluacionesPeriodo.reduce((acc, e) => acc + e.puntaje, 0) / evaluacionesPeriodo.length) * 10) / 10
      : null;

  const puntajesPrevios = Object.fromEntries(evaluacionesPeriodo.map((e) => [e.fundamento, e.puntaje]));

  return (
    <section className="rounded-xl border border-ink/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-prat-blue">{periodo}</h2>
        <div className="flex items-center gap-3">
          {promedio !== null && <span className="font-display font-semibold text-cisnes-gold">{promedio}/5</span>}
          <button
            type="button"
            onClick={() => setEditando((v) => !v)}
            className="text-sm text-prat-blue hover:underline"
          >
            {editando ? "Cancelar" : "Editar"}
          </button>
        </div>
      </div>

      {editando ? (
        <div className="mt-3">
          <EvaluationForm
            categoria={categoria}
            playerId={playerId}
            periodo={periodo}
            fundamentos={fundamentos}
            puntajesPrevios={puntajesPrevios}
            notasPrevias={notasPrevias}
            variant="inline"
          />
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-col divide-y divide-ink/5">
            {fundamentos.map((fundamento) => {
              const ev = evaluacionesPeriodo.find((e) => e.fundamento === fundamento);
              return (
                <div key={fundamento} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-ink">{fundamento}</span>
                  <span className="text-ink/60">
                    {ev ? `${ev.puntaje}/5 · ${etiquetaNivel(ev.puntaje)}` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
          {notasPrevias && <p className="mt-3 rounded-lg bg-paper p-3 text-sm text-ink/70">{notasPrevias}</p>}
        </>
      )}
    </section>
  );
}
