import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { calcularEdad, fechaISOaDDMMAAAA } from "@/lib/format";
import { getPlayersForTeam } from "@/lib/queries/players";

export async function GET(_req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  await requireProfile();
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("id, nombre, categoria_id")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) {
    return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
  }

  const { data: categoria } = await supabase
    .from("categorias")
    .select("nombre")
    .eq("id", team.categoria_id)
    .maybeSingle();

  const players = await getPlayersForTeam(supabase, teamId);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Nómina");

  sheet.columns = [
    { header: "Nombre", key: "nombre", width: 30 },
    { header: "RUT", key: "rut", width: 14 },
    { header: "Fecha de nacimiento", key: "fecha", width: 18 },
    { header: "Edad", key: "edad", width: 8 },
    { header: "Posición", key: "posicion", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const p of players) {
    sheet.addRow({
      nombre: p.nombre,
      rut: p.rut ?? "",
      fecha: p.fecha_nacimiento ? fechaISOaDDMMAAAA(p.fecha_nacimiento) : "",
      edad: p.fecha_nacimiento ? calcularEdad(p.fecha_nacimiento) : "",
      posicion: p.posicion ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  const nombreArchivo = `nomina_${`${team.nombre}_${categoria?.nombre ?? ""}`.replace(/[^a-zA-Z0-9]+/g, "_")}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
