"use client";

import PlayerForm from "@/components/PlayerForm";
import { crearJugador } from "@/lib/actions/players";

interface EquipoOpcion {
  id: string;
  nombre: string;
  categoriaNombre?: string;
}

export default function NuevoJugadorForm({
  teamId,
  equipos,
}: {
  teamId: string;
  equipos: EquipoOpcion[];
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <h2 className="mb-3 font-display text-sm font-semibold text-prat-blue">Nuevo jugador</h2>
      <PlayerForm
        action={crearJugador}
        hiddenFields={{}}
        equipos={equipos}
        equiposSeleccionados={[teamId]}
        submitLabel="Crear jugador"
      />
    </div>
  );
}
