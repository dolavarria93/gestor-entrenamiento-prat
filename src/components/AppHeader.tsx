import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/lib/auth-actions";
import type { CurrentProfile } from "@/lib/auth";

const ROLE_LABELS: Record<CurrentProfile["role"], string> = {
  super_admin: "Super admin",
  admin_club: "Admin del club",
  entrenador: "Entrenador/a",
  apoderado: "Apoderado/a",
  directiva: "Directiva",
};

export default function AppHeader({ profile }: { profile: CurrentProfile }) {
  return (
    <header className="flex items-center justify-between bg-ink px-4 py-3 sm:px-6">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/brand/logo_club_prat.jpeg"
          alt="Club Prat"
          width={36}
          height={36}
          className="rounded-full"
        />
        <span className="font-display text-sm font-semibold text-paper sm:text-base">
          Gestor de Entrenamiento
        </span>
      </Link>

      <div className="flex items-center gap-3 text-sm">
        <div className="text-right leading-tight">
          <p className="text-paper">{profile.nombre}</p>
          <p className="text-sky-periwinkle">{ROLE_LABELS[profile.role]}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg border border-cisnes-gold/40 px-3 py-1.5 text-cisnes-gold transition hover:bg-cisnes-gold/10"
          >
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
