import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import NuevaCategoriaForm from "./NuevaCategoriaForm";
import NuevoEquipoForm from "./NuevoEquipoForm";
import CategoriaCard from "./CategoriaCard";

export default async function CategoriasPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  let clubId = profile.club_id;
  if (!clubId) {
    const { data: primerClub } = await supabase.from("clubs").select("id").limit(1).maybeSingle();
    clubId = primerClub?.id ?? null;
  }

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nombre, orden")
    .eq("club_id", clubId ?? "")
    .order("orden");

  const categoriaIds = (categorias ?? []).map((c) => c.id);

  const { data: fundamentos } = categoriaIds.length
    ? await supabase
        .from("fundamentos_evaluacion")
        .select("categoria_id, nombre")
        .in("categoria_id", categoriaIds)
        .order("orden")
    : { data: [] };

  const { data: teams } = categoriaIds.length
    ? await supabase.from("teams").select("id, nombre, categoria_id").in("categoria_id", categoriaIds)
    : { data: [] };

  const fundamentosPorCategoria = new Map<string, string[]>();
  for (const f of fundamentos ?? []) {
    const lista = fundamentosPorCategoria.get(f.categoria_id) ?? [];
    lista.push(f.nombre);
    fundamentosPorCategoria.set(f.categoria_id, lista);
  }

  const equiposPorCategoria = new Map<string, { id: string; nombre: string; categoria_id: string }[]>();
  for (const t of teams ?? []) {
    const lista = equiposPorCategoria.get(t.categoria_id) ?? [];
    lista.push(t);
    equiposPorCategoria.set(t.categoria_id, lista);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <Link href="/admin" className="text-sm text-prat-blue hover:underline">
          ← Panel del club
        </Link>
        <h1 className="mt-2 font-display text-xl font-semibold text-ink">Categorías</h1>
      </div>

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="font-display text-sm font-semibold text-prat-blue">Existentes</h2>
        {!categorias || categorias.length === 0 ? (
          <p className="mt-2 text-sm text-ink/50">Todavía no hay categorías cargadas.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {categorias.map((cat) => (
              <CategoriaCard
                key={cat.id}
                categoria={cat}
                fundamentos={fundamentosPorCategoria.get(cat.id) ?? []}
                equipos={equiposPorCategoria.get(cat.id) ?? []}
                todasLasCategorias={categorias}
              />
            ))}
          </div>
        )}
      </section>

      <NuevaCategoriaForm categorias={categorias ?? []} />
      <NuevoEquipoForm categorias={categorias ?? []} />
    </div>
  );
}
