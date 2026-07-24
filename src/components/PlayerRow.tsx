"use client";

import { useRef, useState, useActionState } from "react";
import PlayerForm from "@/components/PlayerForm";
import { actualizarJugador, darDeBajaJugador, quitarDeEquipo } from "@/lib/actions/players";
import { calcularEdad } from "@/lib/format";

interface Player {
  id: string;
  nombre: string;
  rut: string | null;
  fecha_nacimiento: string | null;
  posicion: string | null;
}

interface EquipoOpcion {
  id: string;
  nombre: string;
  categoriaNombre?: string;
}

export default function PlayerRow({
  player,
  teamId,
  equipos,
  equiposSeleccionados,
}: {
  player: Player;
  teamId: string;
  equipos: EquipoOpcion[];
  equiposSeleccionados: string[];
}) {
  const [editando, setEditando] = useState(false);
  const [quitarState, quitarAction, quitarPending] = useActionState(quitarDeEquipo, undefined);
  const [bajaState, bajaAction, bajaPending] = useActionState(darDeBajaJugador, undefined);
  const motivoRef = useRef<HTMLInputElement>(null);

  if (editando) {
    return (
      <div className="rounded-lg bg-paper p-3">
        <PlayerForm
          action={actualizarJugador}
          hiddenFields={{ player_id: player.id }}
          initial={{
            nombre: player.nombre,
            rut: player.rut,
            fecha_nacimiento: player.fecha_nacimiento,
            posicion: player.posicion,
          }}
          equipos={equipos}
          equiposSeleccionados={equiposSeleccionados}
          submitLabel="Guardar cambios"
          onCancel={() => setEditando(false)}
        />
      </div>
    );
  }

  const edad = player.fecha_nacimiento ? calcularEdad(player.fecha_nacimiento) : null;
  const detalle = [player.rut, player.posicion, edad !== null ? `${edad} años` : null].filter(Boolean).join(" · ");
  const enVariosEquipos = equiposSeleccionados.length > 1;

  return (
    <div className="flex flex-col gap-1 py-2 text-sm">
      <div className="flex items-center justify-between">
        <p className="text-ink">{player.nombre}</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setEditando(true)} className="text-xs text-prat-blue hover:underline">
            Editar
          </button>

          {enVariosEquipos && (
            <form
              action={quitarAction}
              onSubmit={(e) => {
                if (!confirm(`¿Quitar a ${player.nombre} solo de este equipo? Sigue activo en sus otras categorías.`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="player_id" value={player.id} />
              <input type="hidden" name="team_id" value={teamId} />
              <button
                type="submit"
                disabled={quitarPending}
                className="text-xs text-ink/50 hover:underline disabled:opacity-50"
              >
                {quitarPending ? "…" : "Quitar de este equipo"}
              </button>
            </form>
          )}

          <form
            action={bajaAction}
            onSubmit={(e) => {
              const motivo = prompt(
                `¿Por qué se da de baja del CLUB a ${player.nombre}? (queda inactivo en todas sus categorías, no solo esta)`,
              );
              if (!motivo || !motivo.trim()) {
                e.preventDefault();
                return;
              }
              if (motivoRef.current) motivoRef.current.value = motivo.trim();
            }}
          >
            <input type="hidden" name="player_id" value={player.id} />
            <input ref={motivoRef} type="hidden" name="motivo" value="" />
            <button
              type="submit"
              disabled={bajaPending}
              className="text-xs text-alert-red hover:underline disabled:opacity-50"
            >
              {bajaPending ? "…" : "Baja del club"}
            </button>
          </form>
        </div>
      </div>
      {detalle && <p className="text-xs text-ink/40">{detalle}</p>}
      {quitarState?.error && <p className="text-xs text-alert-red">{quitarState.error}</p>}
      {bajaState?.error && <p className="text-xs text-alert-red">{bajaState.error}</p>}
    </div>
  );
}
