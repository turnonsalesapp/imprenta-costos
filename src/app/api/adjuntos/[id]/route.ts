import type { NextRequest } from "next/server";
import { getUsuario } from "@/lib/auth";
import { obtenerAdjunto } from "@/lib/adjuntos";
import { puedeVerTrabajo, puedeVerOportunidad } from "@/lib/comentarios";
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

  const autorizado = a.prospectoId
    ? puedeVerOportunidad(usuario)
    : a.cotizacionId
      ? await puedeVerTrabajo(usuario, a.cotizacionId)
      : false;
  if (!autorizado) {
    return new Response("No autorizado", { status: 403 });
  }

  // Los bytes según el backend: "db" desde la fila; "drive" en streaming desde
  // Google Drive con la cuenta de servicio (así el usuario no necesita cuenta
  // de Google para verlo).
  let bytes: Buffer | null = null;
  if (a.almacen === "drive") {
    if (!a.driveFileId) return new Response("Adjunto no disponible", { status: 404 });
    try {
      const { descargarDeDrive } = await import("@/lib/drive");
      bytes = await descargarDeDrive(a.driveFileId);
    } catch {
      return new Response("No se pudo leer el archivo de Drive", { status: 502 });
    }
  } else {
    bytes = a.datos ?? null;
  }
  if (!bytes) return new Response("Adjunto no disponible", { status: 404 });

  const disp = esInline(a.tipo) ? "inline" : "attachment";
  const nombre = a.nombre.replace(/"/g, "");
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": a.tipo || "application/octet-stream",
      "Content-Disposition": `${disp}; filename="${nombre}"`,
      "Content-Length": String(bytes.length),
      "Cache-Control": "no-store",
    },
  });
}
