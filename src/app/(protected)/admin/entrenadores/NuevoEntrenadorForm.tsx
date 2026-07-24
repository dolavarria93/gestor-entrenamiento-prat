"use client";

import { useActionState } from "react";
import { crearEntrenador } from "@/lib/actions/coaches";

interface Team {
  id: string;
  nombre: string;
}

export default function NuevoEntrenadorForm({ teams }: { teams: Team[] }) {
  const [state, formAction, pending] = useActionState(crearEntrenador, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-ink/10 bg-white p-4">
      <h2 className="font-display text-sm font-semibold text-prat-blue">Nuevo entrenador</h2>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-ink/50">Nombre</label>
        <input
          name="nombre"
          required
          className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-prat-blue"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-ink/50">Email</label>
        <input
          name="email"
          type="email"
          required
          className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-prat-blue"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-ink/50">Equipo(s)</label>
        <div className="flex flex-col gap-1.5">
          {teams.map((team) => (
            <label key={team.id} className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="team_id" value={team.id} className="accent-prat-blue" />
              {team.nombre}
            </label>
          ))}
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-alert-red/10 px-3 py-2 text-sm text-alert-red">{state.error}</p>
      )}

      {state?.ok && (
        <div className="rounded-lg bg-success-green/10 px-3 py-3 text-sm text-ink">
          <p className="font-semibold text-success-green">Entrenador creado.</p>
          <p className="mt-1">
            Email: <span className="font-mono">{state.email}</span>
          </p>
          <p>
            Contraseña temporal: <span className="font-mono">{state.password}</span>
          </p>
          <p className="mt-1 text-xs text-ink/50">
            Copiá estos datos ahora — la contraseña no se vuelve a mostrar. Compartíselos al entrenador por
            un canal privado.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-prat-blue px-5 py-2.5 font-display font-semibold text-paper transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear entrenador"}
      </button>
    </form>
  );
}
