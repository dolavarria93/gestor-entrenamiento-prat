"use client";

import { useActionState, useState } from "react";
import { actualizarSesionAdmin } from "@/lib/actions/sessions";

interface Player {
  id: string;
  nombre: string;
  posicion: string | null;
}

export default function SessionEditForm({
  sessionId,
  contenidoPlanificadoInicial,
  contenidoRealizadoInicial,
  observacionesInicial,
  players,
  asistenciaPrevia,
}: {
  sessionId: string;
  contenidoPlanificadoInicial: string;
  contenidoRealizadoInicial: string;
  observacionesInicial: string;
  players: Player[];
  asistenciaPrevia: Record<string, boolean>;
}) {
  const [state, formAction, pending] = useActionState(actualizarSesionAdmin, undefined);
  const [presentes, setPresentes] = useState<Record<string, boolean>>(asistenciaPrevia);

  const togglePresente = (playerId: string) => {
    setPresentes((prev) => ({ ...prev, [playerId]: !prev[playerId] }));
  };

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="session_id" value={sessionId} />

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="font-display text-sm font-semibold text-prat-blue">Contenido planificado</h2>
        <textarea
          name="contenido_planificado"
          defaultValue={contenidoPlanificadoInicial}
          rows={4}
          className="mt-2 w-full resize-none rounded-lg border border-ink/10 bg-paper p-3 text-sm text-ink/80 outline-none focus:border-prat-blue"
        />
      </section>

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="font-display text-sm font-semibold text-prat-blue">Asistencia</h2>
        {players.length === 0 ? (
          <p className="mt-2 text-sm text-ink/50">Este equipo todavía no tiene jugadores cargados.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {players.map((player) => {
              const presente = Boolean(presentes[player.id]);
              return (
                <div key={player.id}>
                  <input type="hidden" name="player_id" value={player.id} />
                  <input type="hidden" name={`presente_${player.id}`} value={presente ? "on" : "off"} />
                  <button
                    type="button"
                    onClick={() => togglePresente(player.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left transition ${
                      presente ? "border-cisnes-gold bg-cisnes-gold/15" : "border-ink/10 bg-paper"
                    }`}
                  >
                    <span className="text-ink">
                      {player.nombre}
                      {player.posicion && <span className="ml-2 text-xs text-ink/40">{player.posicion}</span>}
                    </span>
                    <span
                      className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                        presente ? "border-cisnes-gold bg-cisnes-gold" : "border-ink/20"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="font-display text-sm font-semibold text-prat-blue">¿Qué se trabajó realmente?</h2>
        <textarea
          name="contenido_realizado"
          defaultValue={contenidoRealizadoInicial}
          rows={3}
          className="mt-2 w-full resize-none rounded-lg border border-ink/10 bg-paper p-3 text-sm text-ink outline-none focus:border-prat-blue"
        />
      </section>

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="font-display text-sm font-semibold text-prat-blue">Observaciones</h2>
        <textarea
          name="observaciones"
          defaultValue={observacionesInicial}
          rows={2}
          className="mt-2 w-full resize-none rounded-lg border border-ink/10 bg-paper p-3 text-sm text-ink outline-none focus:border-prat-blue"
        />
      </section>

      {state?.error && (
        <p className="rounded-lg bg-alert-red/10 px-3 py-2 text-sm text-alert-red">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-success-green/10 px-3 py-2 text-sm text-success-green">
          Sesión actualizada.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-prat-blue px-5 py-2.5 font-display font-semibold text-paper transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
