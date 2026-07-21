import { NextResponse } from "next/server";
import { getUsuario } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico de la fuente de tasas (solo ADMIN). Muestra la URL consultada, el
 * código HTTP y el cuerpo crudo que devuelve, para ver por qué no llegan las
 * tasas sin adivinar. Ábrelo en el navegador estando logueado como admin.
 */
export async function GET() {
  const usuario = await getUsuario();
  if (!usuario || usuario.rol !== "ADMIN") {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const url = process.env.TASAS_API ?? "https://ve.dolarapi.com/v1/dolares";
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const body = await res.text();
    return NextResponse.json({ url, status: res.status, cuerpo: body.slice(0, 3000) });
  } catch (e) {
    return NextResponse.json({ url, error: e instanceof Error ? e.message : String(e) });
  }
}
