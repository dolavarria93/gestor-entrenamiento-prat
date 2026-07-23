import { requireProfile } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-paper">
      <AppHeader profile={profile} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
