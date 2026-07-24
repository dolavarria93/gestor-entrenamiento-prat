import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import NuevoEntrenadorForm from "./NuevoEntrenadorForm";
import EliminarEntrenadorButton from "./EliminarEntrenadorButton";

export default async function EntrenadoresPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  let clubId = profile.club_id;
  if (!clubId) {
    const { data: primerClub } = await supabase.from("clubs").select("id").limit(1).maybeSingle();
    clubId = primerClub?.id ?? null;
  }

  const { data: teams } = await supabase
    .from("teams")
    .select("id, nombre")
    .eq("club_id", clubId ?? "")
    .order("nombre");

  const { data: coaches } = await supabase
    .from("coaches")
    .select("id, user_id, nombre")
    .eq("club_id", clubId ?? "")
    .order("nombre");

  const { data: coachTeams } = await supabase
    .from("coach_teams")
    .select("coach_id, team_id");

  const nombreEquipo = new Map((teams ?? []).map((t) => [t.id, t.nombre]));
  const equiposPorCoach = new Map<string, string[]>();
  for (const ct of coachTeams ?? []) {
    const nombre = nombreEquipo.get(ct.team_id);
    if (!nombre) continue;
    const lista = equiposPorCoach.get(ct.coach_id) ?? [];
    lista.push(nombre);
    equiposPorCoach.set(ct.coach_id, lista);
  }

  const admin = createAdminClient();
  const coachesConEmail = await Promise.all(
    (coaches ?? []).map(async (coach) => {
      const { data } = await admin.auth.admin.getUserById(coach.user_id);
      return { ...coach, email: data.user?.email ?? "—" };
    }),
  );

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <Link href="/admin" className="text-sm text-prat-blue hover:underline">
          ← Panel del club
        </Link>
        <h1 className="mt-2 font-display text-xl font-semibold text-ink">Entrenadores</h1>
      </div>

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="font-display text-sm font-semibold text-prat-blue">Activos</h2>
        {coachesConEmail.length === 0 ? (
          <p className="mt-2 text-sm text-ink/50">Todavía no hay entrenadores cargados.</p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-ink/5">
            {coachesConEmail.map((coach) => (
              <div key={coach.id} className="flex items-start justify-between gap-4 py-2 text-sm">
                <div>
                  <p className="text-ink">{coach.nombre}</p>
                  <p className="text-xs text-ink/50">{coach.email}</p>
                  <p className="text-xs text-ink/40">
                    {(equiposPorCoach.get(coach.id) ?? []).join(", ") || "Sin equipo asignado"}
                  </p>
                </div>
                <EliminarEntrenadorButton coachId={coach.id} userId={coach.user_id} nombre={coach.nombre} />
              </div>
            ))}
          </div>
        )}
      </section>

      <NuevoEntrenadorForm teams={teams ?? []} />
    </div>
  );
}
