"use client";

import { useActionState, useState } from "react";
import { guardarSesion } from "@/lib/actions/sessions";

interface Player {
  id: string;
  nombre: string;
  posicion: string | null;
}

export default function SessionForm({
  teamId,
  fecha,
  contenidoPlanificado,
  contenidoRealizadoInicial,
  observacionesInicial,
  players,
  asistenciaPrevia,
  yaRegistrada,
}: {
  teamId: string;
  fecha: string;
  contenidoPlanificado: string;
  contenidoRealizadoInicial: string;
  observacionesInicial: string;
  players: Player[];
  asistenciaPrevia: Record<string, boolean>;
  yaRegistrada: boolean;
}) {
  const [state, formAction, pending] = useActionState(guardarSesion, undefined);
  const [presentes, setPresentes] = useState<Record<string, boolean>>(asistenciaPrevia);

  const togglePresente = (playerId: string) => {
    setPresentes((prev) => ({ ...prev, [playerId]: !prev[playerId] }));
  };

  const totalPresentes = Object.values(presentes).filter(Boolean).length;

  return (
    <form action={formAction} className="flex flex-col gap-6 pb-24">
      <input type="hidden" name="team_id" value={teamId} />
      <input type="hidden" name="fecha" value={fecha} />

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="font-display text-sm font-semibold text-prat-blue">Contenido planificado</h2>
        <textarea
          name="contenido_planificado"
          defaultValue={contenidoPlanificado}
          rows={5}
          className="mt-2 w-full resize-none rounded-lg border border-ink/10 bg-paper p-3 text-sm text-ink/80 outline-none focus:border-prat-blue"
        />
      </section>

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-prat-blue">Asistencia</h2>
          <span className="text-sm text-ink/50">
            {totalPresentes}/{players.length}
          </span>
        </div>

        {players.length === 0 ? (
          <p className="text-sm text-ink/50">Este equipo todavía no tiene jugadores cargados.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {players.map((player) => {
              const presente = Boolean(presentes[player.id]);
              return (
                <div key={player.id}>
                  <input type="hidden" name="player_id" value={player.id} />
                  <input
                    type="hidden"
                    name={`presente_${player.id}`}
                    value={presente ? "on" : "off"}
                  />
                  <button
                    type="button"
                    onClick={() => togglePresente(player.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                      presente
                        ? "border-cisnes-gold bg-cisnes-gold/15"
                        : "border-ink/10 bg-paper"
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
          placeholder="2-3 líneas sobre lo que se alcanzó a trabajar…"
          className="mt-2 w-full resize-none rounded-lg border border-ink/10 bg-paper p-3 text-sm text-ink outline-none focus:border-prat-blue"
        />
      </section>

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="font-display text-sm font-semibold text-prat-blue">Observaciones</h2>
        <textarea
          name="observaciones"
          defaultValue={observacionesInicial}
          rows={2}
          placeholder="Opcional"
          className="mt-2 w-full resize-none rounded-lg border border-ink/10 bg-paper p-3 text-sm text-ink outline-none focus:border-prat-blue"
        />
      </section>

      {state?.error && (
        <p className="rounded-lg bg-alert-red/10 px-3 py-2 text-sm text-alert-red">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-success-green/10 px-3 py-2 text-sm text-success-green">
          Sesión guardada.
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-ink/10 bg-paper/95 p-4 backdrop-blur">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-prat-blue px-4 py-3 font-display font-semibold text-paper transition hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Guardando…" : yaRegistrada ? "Actualizar sesión" : "Guardar sesión"}
        </button>
      </div>
    </form>
  );
}
