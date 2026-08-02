import { getUsuario } from "@/lib/auth";
import { generarPlantilla } from "@/lib/proveedores-excel";

export const dynamic = "force-dynamic";

/** Descarga la plantilla .xlsx de listas de precios, pre-rellenada con el catálogo. */
export async function GET() {
  const usuario = await getUsuario();
  if (!usuario || usuario.rol !== "ADMIN") {
    return new Response("No autorizado", { status: 403 });
  }
  const buf = await generarPlantilla();
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-precios.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
