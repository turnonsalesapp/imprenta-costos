import "server-only";
import { db } from "./db";

/**
 * Bitácora de operaciones sensibles. Solo-agregar: nunca se edita ni se borra.
 * Registrar nunca debe tumbar la operación que audita; si la escritura falla,
 * se traga el error (la acción de negocio ya ocurrió).
 */

export type EntradaAuditoria = {
  actorId?: string | null;
  actorNombre?: string | null;
  accion: string;
  entidad?: string | null;
  detalle?: string | null;
};

export async function registrarAuditoria(e: EntradaAuditoria): Promise<void> {
  try {
    await db.registroAuditoria.create({
      data: {
        actorId: e.actorId ?? null,
        actorNombre: e.actorNombre ?? null,
        accion: e.accion,
        entidad: e.entidad ?? null,
        detalle: e.detalle ?? null,
      },
    });
  } catch {
    // No propagar: la auditoría no debe romper la operación de negocio.
  }
}

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
