import "server-only";
import { db } from "./db";
import type { Sesion } from "./auth";
import { puedeBorrarDelHilo } from "./roles";
import { elegirAlmacen, validarArchivo, type NombreAlmacen } from "./almacenamiento";

/**
 * Hilo del trabajo — adjuntos (artes, referencias, pruebas). Igual que los
 * comentarios, se anclan a la COTIZACIÓN y NO contienen dinero: seguros para el
 * rol TALLER. Los bytes se guardan según el backend elegido (`ALMACEN_ADJUNTOS`):
 * "db" (bytea en la fila) o "drive" (referencia remota, aún no implementado).
 */

/** Vista de un adjunto SIN los bytes (para listar sin cargar el binario). */
export type AdjuntoVista = {
  id: string;
  autorId: string | null;
  autorNombre: string;
  nombre: string;
  tipo: string;
  tamano: number;
  almacen: string;
  creadoEn: Date;
};

/** Adjuntos del trabajo, en orden cronológico. Nunca trae `datos` (los bytes). */
export async function listarAdjuntos(cotizacionId: string): Promise<AdjuntoVista[]> {
  return db.adjunto.findMany({
    where: { cotizacionId },
    orderBy: { creadoEn: "asc" },
    select: {
      id: true, autorId: true, autorNombre: true, nombre: true,
      tipo: true, tamano: true, almacen: true, creadoEn: true,
    },
  });
}

/**
 * Sube un adjunto: valida tamaño/tipo, delega los bytes al backend configurado y
 * crea la fila. `bytes` es el contenido ya leído del `File`.
 */
export async function crearAdjunto(input: {
  cotizacionId: string;
  autorId: string | null;
  autorNombre: string;
  nombre: string;
  tipo: string;
  bytes: Buffer;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const v = validarArchivo({ nombre: input.nombre, tipo: input.tipo, tamano: input.bytes.length });
  if (!v.ok) return v;

  const almacen = elegirAlmacen();
  let guardado;
  try {
    guardado = await almacen.guardar({ nombre: input.nombre, tipo: input.tipo, bytes: input.bytes });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar el archivo." };
  }

  await db.adjunto.create({
    data: {
      cotizacionId: input.cotizacionId,
      autorId: input.autorId,
      autorNombre: input.autorNombre,
      nombre: input.nombre,
      tipo: input.tipo,
      tamano: input.bytes.length,
      almacen: guardado.almacen,
      datos: guardado.datos ? new Uint8Array(guardado.datos) : null,
      driveFileId: guardado.driveFileId ?? null,
      url: guardado.url ?? null,
    },
  });
  return { ok: true };
}

/** Adjunto completo (con bytes) para la ruta de descarga. */
export type AdjuntoDescarga = {
  id: string;
  cotizacionId: string;
  nombre: string;
  tipo: string;
  almacen: NombreAlmacen;
  datos: Buffer | null;
  driveFileId: string | null;
  url: string | null;
};

/** Trae un adjunto con sus bytes, para servirlo desde la ruta de descarga. */
export async function obtenerAdjunto(id: string): Promise<AdjuntoDescarga | null> {
  const a = await db.adjunto.findUnique({
    where: { id },
    select: {
      id: true, cotizacionId: true, nombre: true, tipo: true,
      almacen: true, datos: true, driveFileId: true, url: true,
    },
  });
  if (!a) return null;
  return {
    id: a.id,
    cotizacionId: a.cotizacionId,
    nombre: a.nombre,
    tipo: a.tipo,
    almacen: a.almacen as NombreAlmacen,
    datos: a.datos ? Buffer.from(a.datos) : null,
    driveFileId: a.driveFileId,
    url: a.url,
  };
}

/**
 * Elimina un adjunto si el usuario es su autor o ADMIN. Devuelve el cotizacionId
 * (para revalidar) o un error.
 */
export async function eliminarAdjunto(
  id: string,
  usuario: Pick<Sesion, "id" | "rol">,
): Promise<{ ok: true; cotizacionId: string } | { ok: false; error: string }> {
  const a = await db.adjunto.findUnique({
    where: { id },
    select: { id: true, autorId: true, cotizacionId: true },
  });
  if (!a) return { ok: false, error: "El adjunto no existe." };
  if (!puedeBorrarDelHilo(usuario, a.autorId)) {
    return { ok: false, error: "No puedes eliminar este adjunto." };
  }
  // TODO Drive: si almacen === "drive", borrar también el archivo remoto.
  await db.adjunto.delete({ where: { id } });
  return { ok: true, cotizacionId: a.cotizacionId };
}
