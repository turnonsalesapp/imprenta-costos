import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import type { Sesion } from "./auth";
import { esSuperAdmin } from "./roles";

/**
 * Registro de actividad / bitácora de operaciones sensibles. Solo-agregar: nadie
 * la edita. La única forma de borrar es la purga por rango de fechas, reservada a
 * SUPERADMIN, que además deja su propio rastro.
 *
 * Hay UNA sola función para escribir, `registrar()`:
 *   - Sin transacción: mejor-esfuerzo. Nunca tumba la operación que audita; si la
 *     escritura falla, se traga el error (la acción de negocio ya ocurrió).
 *   - Con transacción (`tx`): escribe en la MISMA transacción del cambio, de modo
 *     que el registro y el cambio son atómicos —si uno falla, ambos se revierten—.
 *     Aquí el error SÍ se propaga (esa es la garantía de atomicidad).
 */

export type EntradaAuditoria = {
  actorId?: string | null;
  actorNombre?: string | null;
  accion: string;
  entidad?: string | null;
  detalle?: string | null;
};

/** Cliente de escritura: el `db` global o el cliente de una transacción. */
type ClienteEscritura = Pick<typeof db, "registroAuditoria"> | Prisma.TransactionClient;

/**
 * Registra una entrada de actividad. Si se pasa `tx`, escribe dentro de esa
 * transacción (atómico con el cambio, propaga errores). Si no, es mejor-esfuerzo.
 */
export async function registrar(entrada: EntradaAuditoria, tx?: Prisma.TransactionClient): Promise<void> {
  const cliente: ClienteEscritura = tx ?? db;
  const data = {
    actorId: entrada.actorId ?? null,
    actorNombre: entrada.actorNombre ?? null,
    accion: entrada.accion,
    entidad: entrada.entidad ?? null,
    detalle: entrada.detalle ?? null,
  };
  if (tx) {
    // Dentro de una transacción: el error debe propagarse para revertir el cambio.
    await cliente.registroAuditoria.create({ data });
    return;
  }
  try {
    await cliente.registroAuditoria.create({ data });
  } catch {
    // Fuera de transacción: la auditoría no debe romper la operación de negocio.
  }
}

/** Alias histórico de `registrar()` (mejor-esfuerzo). Prefiere `registrar`. */
export const registrarAuditoria = registrar;

export type FilaAuditoria = {
  id: string; fecha: Date; actorNombre: string | null;
  accion: string; entidad: string | null; detalle: string | null;
};

export async function listarAuditoria(limite = 100): Promise<FilaAuditoria[]> {
  const filas = await db.registroAuditoria.findMany({
    orderBy: { fecha: "desc" },
    take: limite,
    select: { id: true, fecha: true, actorNombre: true, accion: true, entidad: true, detalle: true },
  });
  return filas;
}

/** Acción registrada cuando SUPERADMIN purga la bitácora. */
export const ACCION_PURGA = "auditoria.purga";

/**
 * Purga la bitácora en un rango de fechas [desde, hasta]. Reservado a SUPERADMIN
 * (se valida el rol aquí, además de en la acción). Borra y deja rastro en la
 * MISMA transacción: cuenta cuántas filas cayeron y escribe una entrada
 * `auditoria.purga` con el rango y el total. Esa entrada de rastro se crea
 * DESPUÉS del borrado y con la fecha actual, así nunca se borra a sí misma.
 */
export async function purgarAuditoria(
  rango: { desde: Date; hasta: Date },
  actor: Pick<Sesion, "id" | "nombre" | "rol">,
): Promise<{ ok: true; borrados: number } | { ok: false; error: string }> {
  if (!esSuperAdmin(actor.rol)) {
    return { ok: false, error: "Solo un superadministrador puede purgar la bitácora." };
  }
  if (!(rango.desde instanceof Date) || !(rango.hasta instanceof Date) ||
      isNaN(rango.desde.getTime()) || isNaN(rango.hasta.getTime())) {
    return { ok: false, error: "Rango de fechas inválido." };
  }
  if (rango.desde > rango.hasta) {
    return { ok: false, error: "La fecha inicial no puede ser posterior a la final." };
  }

  const fmt = (d: Date) => d.toLocaleDateString("es-VE");
  const borrados = await db.$transaction(async (tx) => {
    const { count } = await tx.registroAuditoria.deleteMany({
      where: { fecha: { gte: rango.desde, lte: rango.hasta } },
    });
    await registrar({
      actorId: actor.id,
      actorNombre: actor.nombre,
      accion: ACCION_PURGA,
      detalle: `Purgó ${count} registro(s) del ${fmt(rango.desde)} al ${fmt(rango.hasta)}`,
    }, tx);
    return count;
  });

  return { ok: true, borrados };
}
