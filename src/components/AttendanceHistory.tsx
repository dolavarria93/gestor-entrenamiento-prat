"use client";

import { useState } from "react";

interface Registro {
  fecha: string; // YYYY-MM-DD
  presente: boolean;
}

type Modo = "diaria" | "semanal" | "mensual" | "semestral" | "anual";

function semestreKey(fechaISO: string): string {
  const [anio, mes] = fechaISO.split("-");
  const semestre = Number(mes) <= 6 ? "S1" : "S2";
  return `${anio}-${semestre}`;
}

function isoWeekKey(fechaISO: string): string {
  const date = new Date(fechaISO + "T00:00:00");
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function agrupar(registros: Registro[], modo: Modo) {
  if (modo === "diaria") {
    return registros.map((r) => ({ etiqueta: r.fecha, porcentaje: r.presente ? 100 : 0, total: 1 }));
  }

  const keyFn =
    modo === "semanal"
      ? isoWeekKey
      : modo === "mensual"
        ? (f: string) => f.slice(0, 7)
        : modo === "semestral"
          ? semestreKey
          : (f: string) => f.slice(0, 4);

  const grupos = new Map<string, { presentes: number; total: number }>();
  for (const r of registros) {
    const key = keyFn(r.fecha);
    const actual = grupos.get(key) ?? { presentes: 0, total: 0 };
    actual.total += 1;
    if (r.presente) actual.presentes += 1;
    grupos.set(key, actual);
  }

  return Array.from(grupos.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([etiqueta, { presentes, total }]) => ({
      etiqueta,
      porcentaje: Math.round((presentes / total) * 100),
      total,
    }));
}

const MODOS: { key: Modo; label: string }[] = [
  { key: "diaria", label: "Diaria" },
  { key: "semanal", label: "Semanal" },
  { key: "mensual", label: "Mensual" },
  { key: "semestral", label: "Semestral" },
  { key: "anual", label: "Anual" },
];

export default function AttendanceHistory({ registros }: { registros: Registro[] }) {
  const [modo, setModo] = useState<Modo>("semanal");

  const ordenados = [...registros].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const filas = agrupar(ordenados, modo);

  const totalPresentes = registros.filter((r) => r.presente).length;
  const porcentajeGeneral = registros.length > 0 ? Math.round((totalPresentes / registros.length) * 100) : null;

  return (
    <section className="rounded-xl border border-ink/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-prat-blue">Asistencia</h2>
        {porcentajeGeneral !== null && (
          <span className="font-display font-semibold text-cisnes-gold">{porcentajeGeneral}% general</span>
        )}
      </div>

      {registros.length === 0 ? (
        <p className="mt-2 text-sm text-ink/50">Todavía no hay sesiones registradas para este equipo.</p>
      ) : (
        <>
          <div className="mt-3 flex gap-1 rounded-lg bg-paper p-1">
            {MODOS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setModo(m.key)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                  modo === m.key ? "bg-prat-blue text-paper" : "text-ink/50 hover:text-ink"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-col divide-y divide-ink/5">
            {filas.map((f) => (
              <div key={f.etiqueta} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink">{f.etiqueta}</span>
                <span className={f.porcentaje >= 70 ? "text-success-green" : "text-alert-red"}>
                  {f.porcentaje}%{modo !== "diaria" && <span className="ml-1 text-ink/40">({f.total} ses.)</span>}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
