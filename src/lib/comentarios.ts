import "server-only";
import { db } from "./db";
import type { Sesion } from "./auth";
import { puedeBorrarDelHilo } from "./roles";

/**
 * Hilo del trabajo — comentarios. El hilo se ancla a la COTIZACIÓN; la orden
 * (que ve el TALLER) muestra el MISMO hilo vía su cotizacionId. El hilo NO
 * contiene dinero: por diseño es seguro para el rol TALLER.
 *
 * Aquí viven además los dos ayudantes de acceso al trabajo, que comparten
 * comentarios y adjuntos:
 *   - `resolverCotizacionDeOrden(ordenId)`  → cotizacionId de una orden.
 *   - `puedeVerTrabajo(usuario, cotizacionId)` → ¿puede este usuario ver el hilo?
 */

export type ComentarioVista = {
  id: string;
  autorId: string | null;
  autorNombre: string;
  texto: string;
  creadoEn: Date;
};

/** cotizacionId de una orden (o null si la orden no existe). */
export async function resolverCotizacionDeOrden(ordenId: string): Promise<string | null> {
  if (!ordenId) return null;
  const o = await db.orden.findUnique({
    where: { id: ordenId },
    select: { cotizacionId: true },
  });
  return o?.cotizacionId ?? null;
}

/**
 * ¿Puede el usuario ver (y participar en) el hilo de este trabajo?
 *   - ADMIN / VENDEDOR ven la cotización directamente.
 *   - TALLER solo llega al trabajo VÍA la orden: puede participar únicamente si
 *     la cotización ya tiene una orden generada (el hilo no tiene precios).
 * En todos los casos la cotización debe existir.
 */
export async function puedeVerTrabajo(
  usuario: Pick<Sesion, "rol">,
  cotizacionId: string,
): Promise<boolean> {
  if (!cotizacionId) return false;
  const c = await db.cotizacion.findUnique({
    where: { id: cotizacionId },
    select: { id: true, orden: { select: { id: true } } },
  });
  if (!c) return false;
  if (usuario.rol === "TALLER") return c.orden != null;
  return true; // ADMIN y VENDEDOR
}

/** Comentarios del trabajo, en orden cronológico (los más viejos primero). */
export async function listarComentarios(cotizacionId: string): Promise<ComentarioVista[]> {
  return db.comentario.findMany({
    where: { cotizacionId },
    orderBy: { creadoEn: "asc" },
    select: { id: true, autorId: true, autorNombre: true, texto: true, creadoEn: true },
  });
}

/** Máximo de caracteres de un comentario. */
export const MAX_TEXTO = 4000;

/** Crea un comentario. El texto se recorta y valida (no vacío, dentro del límite). */
export async function crearComentario(input: {
  cotizacionId: string;
  autorId: string | null;
  autorNombre: string;
  texto: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const texto = input.texto.trim();
  if (!texto) return { ok: false, error: "El comentario está vacío." };
  if (texto.length > MAX_TEXTO) return { ok: false, error: "El comentario es demasiado largo." };
  await db.comentario.create({
    data: {
      cotizacionId: input.cotizacionId,
      autorId: input.autorId,
      autorNombre: input.autorNombre,
      texto,
    },
  });
  return { ok: true };
}

/**
 * Elimina un comentario si el usuario es su autor o ADMIN. Devuelve el
 * cotizacionId (para revalidar) o un error.
 */
export async function eliminarComentario(
  id: string,
  usuario: Pick<Sesion, "id" | "rol">,
): Promise<{ ok: true; cotizacionId: string } | { ok: false; error: string }> {
  const c = await db.comentario.findUnique({
    where: { id },
    select: { id: true, autorId: true, cotizacionId: true },
  });
  if (!c) return { ok: false, error: "El comentario no existe." };
  if (!puedeBorrarDelHilo(usuario, c.autorId)) {
    return { ok: false, error: "No puedes eliminar este comentario." };
  }
  await db.comentario.delete({ where: { id } });
  return { ok: true, cotizacionId: c.cotizacionId };
}
