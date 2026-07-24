import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PERIODOS } from "@/lib/fundamentos";
import { getFundamentos } from "@/lib/queries/categorias";
import { getPlayersForTeam } from "@/lib/queries/players";
import type { Periodo } from "@/lib/supabase/database.types";
import TeamTabs from "@/components/TeamTabs";
import EvaluationForm from "@/components/EvaluationForm";
import PlayerPeriodPicker from "./PlayerPeriodPicker";

export default async function EvaluacionesPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ player?: string; periodo?: string }>;
}) {
  const { teamId } = await params;
  const sp = await searchParams;
  await requireProfile();
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("id, nombre, categoria_id")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) notFound();

  const { data: categoria } = await supabase
    .from("categorias")
    .select("nombre")
    .eq("id", team.categoria_id)
    .maybeSingle();

  const players = await getPlayersForTeam(supabase, teamId);

  const fundamentos = await getFundamentos(supabase, team.categoria_id);

  const selectedPlayerId = sp.player ?? players[0]?.id ?? "";
  const selectedPeriodo = (sp.periodo as Periodo) ?? PERIODOS[0];

  let puntajesPrevios: Record<string, number> = {};
  let notasPrevias = "";
  if (selectedPlayerId) {
    const { data: evaluaciones } = await supabase
      .from("evaluations")
      .select("fundamento, puntaje, notas")
      .eq("player_id", selectedPlayerId)
      .eq("periodo", selectedPeriodo);

    puntajesPrevios = Object.fromEntries((evaluaciones ?? []).map((e) => [e.fundamento, e.puntaje]));
    notasPrevias = evaluaciones?.[0]?.notas ?? "";
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      <div>
        <p className="text-sm text-ink/50">{categoria?.nombre ?? ""} · Evaluación</p>
        <h1 className="font-display text-xl font-semibold text-ink">{team.nombre}</h1>
      </div>

      <TeamTabs teamId={team.id} active="evaluaciones" />

      {players.length === 0 ? (
        <p className="text-ink/50">Este equipo todavía no tiene jugadores cargados.</p>
      ) : fundamentos.length === 0 ? (
        <p className="text-ink/50">
          Esta categoría todavía no tiene fundamentos de evaluación definidos. Pedile al admin del club que
          los cargue en Panel del club → Categorías.
        </p>
      ) : (
        <>
          <PlayerPeriodPicker
            players={players}
            periodos={PERIODOS as unknown as string[]}
            selectedPlayerId={selectedPlayerId}
            selectedPeriodo={selectedPeriodo}
          />

          <EvaluationForm
            key={`${selectedPlayerId}-${selectedPeriodo}`}
            categoriaId={team.categoria_id}
            playerId={selectedPlayerId}
            periodo={selectedPeriodo}
            fundamentos={fundamentos}
            puntajesPrevios={puntajesPrevios}
            notasPrevias={notasPrevias}
          />
        </>
      )}
    </div>
  );
}
