import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fetchTasasExternas } from "@/lib/tasas";
import { obtenerConfig, actualizarConfig } from "@/lib/variables";

export const dynamic = "force-dynamic";

/**
 * Refresco de tasas para automatización (cron). Protegido por un token: apunta
 * un programador (ej. cron de Railway) a esta URL con ?token=$CRON_SECRET.
 * Si CRON_SECRET no está configurado, queda deshabilitado.
 */
export async function GET(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  const token = req.nextUrl.searchParams.get("token");
  if (!secreto || token !== secreto) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const t = await fetchTasasExternas();
  if (!t) {
    return NextResponse.json({ ok: false, error: "fuente no disponible" }, { status: 502 });
  }

  const cfg = await obtenerConfig();
  await actualizarConfig({ ...cfg, tasaBCV: t.bcv, binCompra: t.binCompra, binVenta: t.binVenta });
  return NextResponse.json({ ok: true, ...t });
}
