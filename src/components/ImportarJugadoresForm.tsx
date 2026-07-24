"use client";

import { useActionState } from "react";
import { importarJugadores } from "@/lib/actions/players";

export default function ImportarJugadoresForm({ teamId }: { teamId: string }) {
  const [state, formAction, pending] = useActionState(importarJugadores, undefined);

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <h2 className="font-display text-sm font-semibold text-prat-blue">Carga masiva</h2>
      <p className="mt-1 text-xs text-ink/50">
        Para cargar varios jugadores de una — ideal la primera vez que armás el equipo.
      </p>

      <a
        href="/api/export/plantilla-jugadores"
        className="mt-2 inline-block text-xs text-prat-blue hover:underline"
      >
        Descargar plantilla (Excel)
      </a>

      <form action={formAction} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="team_id" value={teamId} />
        <input
          type="file"
          name="archivo"
          accept=".xlsx"
          required
          className="text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-prat-blue file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-paper"
        />

        {state?.error && (
          <p className="rounded-lg bg-alert-red/10 px-3 py-2 text-sm text-alert-red">{state.error}</p>
        )}
        {state?.ok && (
          <div className="rounded-lg bg-success-green/10 px-3 py-2 text-sm">
            <p className="text-success-green">{state.importados} jugador(es) importado(s).</p>
            {state.errores && state.errores.length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-xs text-alert-red">
                {state.errores.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg bg-prat-blue px-4 py-2 text-sm font-display font-semibold text-paper transition hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Importando…" : "Importar"}
        </button>
      </form>
    </div>
  );
}
