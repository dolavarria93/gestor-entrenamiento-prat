import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireProfile } from "@/lib/auth";

export async function GET() {
  await requireProfile();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Jugadores");

  sheet.columns = [
    { header: "Nombre", key: "nombre", width: 30 },
    { header: "RUT", key: "rut", width: 14 },
    { header: "Fecha de nacimiento (dd/mm/aaaa)", key: "fecha", width: 26 },
    { header: "Posición", key: "posicion", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  const ejemplo = sheet.addRow({
    nombre: "EJEMPLO NOMBRE APELLIDO — BORRAR ESTA FILA",
    rut: "11111111-1",
    fecha: "01/01/2012",
    posicion: "ARMADOR",
  });
  ejemplo.font = { italic: true, color: { argb: "FF999999" } };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla_jugadores.xlsx"',
    },
  });
}
