import { NextResponse } from "next/server";
import { getUsuario } from "@/lib/auth";
import { cargarResumen } from "@/lib/resumen";

export const dynamic = "force-dynamic";

/**
 * Resumen del panel como JSON, filtrado por rol en el servidor. Sirve para
 * comprobar la regla de la Fase 2: entra como TALLER y esta respuesta no trae
 * ningún precio, costo ni margen.
 */
export async function GET() {
  const usuario = await getUsuario();
  if (!usuario) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  return NextResponse.json(await cargarResumen(usuario.rol));
}
