import Link from "next/link";

export default function TeamTabs({ teamId, active }: { teamId: string; active: "sesion" | "evaluaciones" }) {
  const tabs = [
    { key: "sesion", label: "Sesión de hoy", href: `/entrenador/${teamId}` },
    { key: "evaluaciones", label: "Evaluación", href: `/entrenador/${teamId}/evaluaciones` },
  ] as const;

  return (
    <div className="flex gap-2 border-b border-ink/10">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`px-3 pb-2 text-sm font-medium ${
            active === tab.key
              ? "border-b-2 border-prat-blue text-prat-blue"
              : "text-ink/50 hover:text-ink"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
