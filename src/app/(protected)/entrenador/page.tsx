import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export default async function EntrenadorPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!coach) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">Sin equipo asignado</h1>
        <p className="max-w-sm text-ink/60">
          Tu usuario todavía no está vinculado a ningún equipo. Pídele al admin del club que te asigne uno.
        </p>
      </div>
    );
  }

  const { data: coachTeams } = await supabase
    .from("coach_teams")
    .select("team_id, teams(id, nombre, categoria)")
    .eq("coach_id", coach.id);

  const teams = (coachTeams ?? [])
    .map((ct) => ct.teams)
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  if (teams.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">Sin equipo asignado</h1>
        <p className="max-w-sm text-ink/60">
          Tu usuario todavía no está vinculado a ningún equipo. Pídele al admin del club que te asigne uno.
        </p>
      </div>
    );
  }

  if (teams.length === 1) {
    redirect(`/entrenador/${teams[0].id}`);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <h1 className="font-display text-xl font-semibold text-ink">Tus equipos</h1>
      <div className="flex flex-col gap-3">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/entrenador/${team.id}`}
            className="rounded-xl border border-ink/10 bg-white px-4 py-4 shadow-sm transition hover:border-prat-blue"
          >
            <p className="font-display font-semibold text-ink">{team.nombre}</p>
            <p className="text-sm text-ink/50">{team.categoria}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
