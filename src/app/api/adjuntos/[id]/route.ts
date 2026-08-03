import type { NextRequest } from "next/server";
import { getUsuario } from "@/lib/auth";
import { obtenerAdjunto } from "@/lib/adjuntos";
import { puedeVerTrabajo } from "@/lib/comentarios";
import { esInline } from "@/lib/almacenamiento";

export const dynamic = "force-dynamic";

/**
 * Descarga de un adjunto del hilo del trabajo. Exige sesión y que el usuario
 * pueda ver ESE trabajo (TALLER solo si la cotización ya tiene orden). Nunca
 * expone un archivo sin sesión. Imágenes y PDF se muestran en línea; el resto se
 * descarga. Sin caché (el permiso se comprueba en cada petición).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await getUsuario();
  if (!usuario) return new Response("No autorizado", { status: 401 });

  const { id } = await params;
  const a = await obtenerAdjunto(id);
  if (!a) return new Response("No encontrado", { status: 404 });

  if (!(await puedeVerTrabajo(usuario, a.cotizacionId))) {
    return new Response("No autorizado", { status: 403 });
  }

  // Backend "drive": el archivo vive fuera; redirige a su URL.
  if (a.almacen === "drive") {
    if (!a.url) return new Response("Adjunto no disponible", { status: 404 });
    return Response.redirect(a.url, 302);
  }

  // Backend "db": responde los bytes guardados.
  if (!a.datos) return new Response("Adjunto no disponible", { status: 404 });

  const disp = esInline(a.tipo) ? "inline" : "attachment";
  const nombre = a.nombre.replace(/"/g, "");
  return new Response(new Uint8Array(a.datos), {
    headers: {
      "Content-Type": a.tipo || "application/octet-stream",
      "Content-Disposition": `${disp}; filename="${nombre}"`,
      "Content-Length": String(a.datos.length),
      "Cache-Control": "no-store",
    },
  });
}
