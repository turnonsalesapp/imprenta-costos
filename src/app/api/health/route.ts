import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Railway consulta esta ruta para saber si el despliegue quedó sano.
 * Si responde 503, Railway no envía tráfico a esta versión y mantiene
 * la anterior en línea.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "conectada" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, db: "sin conexión", detalle: e instanceof Error ? e.message : String(e) },
      { status: 503 },
    );
  }
}
