import Link from "next/link";

interface SesionResumen {
  id: string;
  fecha: string;
}

export default function SessionDateStrip({
  teamId,
  today,
  fechaSeleccionada,
  sesiones,
}: {
  teamId: string;
  today: string;
  fechaSeleccionada: string;
  sesiones: SesionResumen[];
}) {
  const fechas = sesiones.map((s) => s.fecha);
  if (!fechas.includes(today)) fechas.unshift(today);

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {fechas.map((fecha) => {
        const activa = fecha === fechaSeleccionada;
        const href = fecha === today ? `/entrenador/${teamId}` : `/entrenador/${teamId}?fecha=${fecha}`;
        return (
          <Link
            key={fecha}
            href={href}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              activa
                ? "border-prat-blue bg-prat-blue text-paper"
                : "border-ink/10 bg-white text-ink/60 hover:border-prat-blue"
            }`}
          >
            {fecha === today ? "Hoy" : fecha}
          </Link>
        );
      })}
    </div>
  );
}
