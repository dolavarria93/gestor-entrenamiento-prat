import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

const DIAS_ALERTA = 10;

function diasDesde(fechaISO: string): number {
  const hoy = new Date();
  const fecha = new Date(fechaISO + "T00:00:00");
  return Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AdminPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  let clubId = profile.club_id;
  if (!clubId) {
    const { data: primerClub } = await supabase.from("clubs").select("id").limit(1).maybeSingle();
    clubId = primerClub?.id ?? null;
  }

  const { data: teams } = await supabase
    .from("teams")
    .select("id, nombre, categoria")
    .eq("club_id", clubId ?? "")
    .order("categoria");

  const equipos = await Promise.all(
    (teams ?? []).map(async (team) => {
      const { data: sesiones } = await supabase
        .from("sessions")
        .select("id, fecha")
        .eq("team_id", team.id)
        .order("fecha", { ascending: false });

      const ultimaSesion = sesiones?.[0] ?? null;
      const sessionIds = (sesiones ?? []).map((s) => s.id);

      let asistenciaPromedio: number | null = null;
      if (sessionIds.length > 0) {
        const { data: attendance } = await supabase
          .from("attendance")
          .select("presente")
          .in("session_id", sessionIds);

        if (attendance && attendance.length > 0) {
          const presentes = attendance.filter((a) => a.presente).length;
          asistenciaPromedio = Math.round((presentes / attendance.length) * 100);
        }
      }

      const dias = ultimaSesion ? diasDesde(ultimaSesion.fecha) : null;
      const alerta = dias === null || dias > DIAS_ALERTA;

      return { team, ultimaSesion, asistenciaPromedio, dias, alerta };
    }),
  );

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <h1 className="font-display text-xl font-semibold text-ink">Panel del club</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {equipos.map(({ team, ultimaSesion, asistenciaPromedio, dias, alerta }) => (
          <Link
            key={team.id}
            href={`/admin/equipos/${team.id}`}
            className={`flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition hover:border-prat-blue ${
              alerta ? "border-alert-red/40" : "border-ink/10"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-ink/50">{team.categoria}</p>
                <p className="font-display font-semibold text-ink">{team.nombre}</p>
              </div>
              {alerta && (
                <span className="rounded-full bg-alert-red/10 px-2 py-1 text-xs font-medium text-alert-red">
                  {dias === null ? "Sin sesiones" : `+${DIAS_ALERTA} días`}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/50">Última sesión</span>
                <span className="text-ink">
                  {ultimaSesion ? `${ultimaSesion.fecha} (hace ${dias} d)` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/50">Asistencia promedio</span>
                <span className={asistenciaPromedio !== null && asistenciaPromedio >= 70 ? "text-cisnes-gold" : "text-ink"}>
                  {asistenciaPromedio !== null ? `${asistenciaPromedio}%` : "—"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {equipos.length === 0 && (
        <p className="text-ink/50">Todavía no hay equipos cargados para este club.</p>
      )}
    </div>
  );
}
