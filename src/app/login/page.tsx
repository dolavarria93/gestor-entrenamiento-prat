import Image from "next/image";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-ink px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <Image
          src="/brand/logo_club_prat.jpeg"
          alt="Club de Vóleibol Prat"
          width={140}
          height={140}
          className="rounded-full"
          priority
        />

        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-paper">Gestor de Entrenamiento</h1>
          <p className="mt-1 text-sm text-sky-periwinkle">Club de Vóleibol Prat</p>
        </div>

        <LoginForm />
      </div>

      <div className="seam-divider mt-16 w-full max-w-sm" />
    </div>
  );
}
