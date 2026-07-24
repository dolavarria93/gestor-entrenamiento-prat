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

export default function PlayerDetailHeader({
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
      <div className="rounded-xl border border-ink/10 bg-white p-4">
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
    <div>
      <h1 className="font-display text-xl font-semibold text-ink">{player.nombre}</h1>
      {detalle && <p className="text-sm text-ink/50">{detalle}</p>}

      <div className="mt-2 flex flex-wrap gap-4">
        <button type="button" onClick={() => setEditando(true)} className="text-sm text-prat-blue hover:underline">
          Editar datos
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
            <input type="hidden" name="redirect_to" value={`/admin/equipos/${teamId}`} />
            <button
              type="submit"
              disabled={quitarPending}
              className="text-sm text-ink/50 hover:underline disabled:opacity-50"
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
          <input type="hidden" name="redirect_to" value={`/admin/equipos/${teamId}`} />
          <button
            type="submit"
            disabled={bajaPending}
            className="text-sm text-alert-red hover:underline disabled:opacity-50"
          >
            {bajaPending ? "Dando de baja…" : "Baja del club"}
          </button>
        </form>
      </div>
      {quitarState?.error && <p className="mt-1 text-sm text-alert-red">{quitarState.error}</p>}
      {bajaState?.error && <p className="mt-1 text-sm text-alert-red">{bajaState.error}</p>}
    </div>
  );
}
