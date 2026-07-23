import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/supabase/database.types";

export interface CurrentProfile {
  id: string;
  club_id: string | null;
  role: Role;
  nombre: string;
}

export async function requireProfile(): Promise<CurrentProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, club_id, role, nombre")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Usuario autenticado en Supabase Auth pero sin fila en profiles todavía
    // (falta el alta manual del admin_club). Sin rol no hay a dónde mandarlo.
    redirect("/login?error=sin_perfil");
  }

  return profile;
}

export function homePathForRole(role: Role): string {
  switch (role) {
    case "super_admin":
    case "admin_club":
      return "/admin";
    case "entrenador":
      return "/entrenador";
    case "apoderado":
      return "/apoderado";
    case "directiva":
      return "/directiva";
  }
}
