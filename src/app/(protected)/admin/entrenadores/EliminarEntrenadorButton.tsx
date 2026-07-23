"use client";

import { useActionState } from "react";
import { eliminarEntrenador } from "@/lib/actions/coaches";

export default function EliminarEntrenadorButton({
  coachId,
  userId,
  nombre,
}: {
  coachId: string;
  userId: string;
  nombre: string;
}) {
  const [state, formAction, pending] = useActionState(eliminarEntrenador, undefined);

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!confirm(`¿Eliminar a ${nombre}? Pierde acceso a la app de inmediato.`)) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="coach_id" value={coachId} />
        <input type="hidden" name="user_id" value={userId} />
        <button
          type="submit"
          disabled={pending}
          className="text-xs text-alert-red hover:underline disabled:opacity-50"
        >
          {pending ? "Eliminando…" : "Eliminar"}
        </button>
      </form>
      {state?.error && <p className="mt-1 max-w-xs text-xs text-alert-red">{state.error}</p>}
      {state?.ok && <p className="mt-1 text-xs text-success-green">Eliminado.</p>}
    </div>
  );
}
