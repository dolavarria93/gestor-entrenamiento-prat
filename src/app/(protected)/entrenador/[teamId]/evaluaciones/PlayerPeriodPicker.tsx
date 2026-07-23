"use client";

import { useRouter, usePathname } from "next/navigation";

export default function PlayerPeriodPicker({
  players,
  periodos,
  selectedPlayerId,
  selectedPeriodo,
}: {
  players: { id: string; nombre: string }[];
  periodos: string[];
  selectedPlayerId: string;
  selectedPeriodo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (player: string, periodo: string) => {
    router.push(`${pathname}?player=${player}&periodo=${encodeURIComponent(periodo)}`);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink/10 bg-white p-4 sm:flex-row">
      <div className="flex flex-1 flex-col gap-1.5">
        <label className="text-xs text-ink/50">Jugador/a</label>
        <select
          value={selectedPlayerId}
          onChange={(e) => navigate(e.target.value, selectedPeriodo)}
          className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-ink outline-none focus:border-prat-blue"
        >
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <label className="text-xs text-ink/50">Período</label>
        <select
          value={selectedPeriodo}
          onChange={(e) => navigate(selectedPlayerId, e.target.value)}
          className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-ink outline-none focus:border-prat-blue"
        >
          {periodos.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
