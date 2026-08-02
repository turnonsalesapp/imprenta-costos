"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { EstadoOrden, EstadoPieza, EstadoCobro } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUsuario, requireRol } from "@/lib/auth";
import {
  generarOrden, marcarEtapa, cambiarEstadoOrden, actualizarOrden, ESTADOS_ORDEN,
  cambiarEstadoPieza, cambiarEstadoCobro, ESTADOS_PIEZA, ESTADOS_COBRO,
} from "@/lib/ordenes";

/** Genera la orden desde una cotización aprobada (ADMIN/VENDEDOR). */
export async function generarOrdenAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN", "VENDEDOR");
  const cotizacionId = String(formData.get("cotizacionId") ?? "");

  let destino: string | null = null;
  try {
    const r = await generarOrden(cotizacionId);
    if (r.ok) destino = `/taller/${r.id}`;
  } catch {
    // Carrera con el handoff automático (violación de @unique): la orden ya existe.
    const orden = await db.orden.findUnique({
      where: { cotizacionId }, select: { id: true },
    });
    if (orden) destino = `/taller/${orden.id}`;
  }
  revalidatePath(`/cotizaciones/${cotizacionId}`);
  revalidatePath("/taller");
  // El botón solo aparece cuando procede; ante un caso raro, vuelve al detalle.
  redirect(destino ?? `/cotizaciones/${cotizacionId}`);
}

/** Marca una etapa lista o pendiente. La puede hacer el TALLER. */
export async function marcarEtapaAction(formData: FormData): Promise<void> {
  const usuario = await requireUsuario();
  const etapaId = String(formData.get("etapaId") ?? "");
  const lista = String(formData.get("lista") ?? "") === "1";
  if (!etapaId) return;

  const ordenId = await marcarEtapa(etapaId, lista, usuario.nombre);
  revalidatePath("/taller");
  if (ordenId) revalidatePath(`/taller/${ordenId}`);
}

/** Mueve una pieza a otro estado en el tablero de producción. La hace el TALLER. */
export async function moverPiezaAction(
  id: string, estado: EstadoPieza,
): Promise<{ error: string | null }> {
  await requireUsuario();
  if (!id || !ESTADOS_PIEZA.includes(estado)) return { error: "Estado inválido." };
  const ordenId = await cambiarEstadoPieza(id, estado);
  revalidatePath("/taller");
  if (ordenId) revalidatePath(`/taller/${ordenId}`);
  return { error: null };
}

/** Cambia el estado de cobro de la orden (ADMIN/VENDEDOR). */
export async function cambiarCobroAction(
  id: string, estado: EstadoCobro,
): Promise<{ error: string | null }> {
  await requireRol("ADMIN", "VENDEDOR");
  if (!id || !ESTADOS_COBRO.includes(estado)) return { error: "Estado de cobro inválido." };
  await cambiarEstadoCobro(id, estado);
  revalidatePath("/taller");
  revalidatePath(`/taller/${id}`);
  return { error: null };
}

/** Cambia el estado de la orden a mano (ADMIN/VENDEDOR): entregada, anulada… */
export async function cambiarEstadoOrdenAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN", "VENDEDOR");
  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "") as EstadoOrden;
  if (!id || !ESTADOS_ORDEN.includes(estado)) return;

  await cambiarEstadoOrden(id, estado);
  revalidatePath(`/taller/${id}`);
  revalidatePath("/taller");
}

/** Fija la fecha de entrega y las instrucciones (ADMIN/VENDEDOR). */
export async function actualizarOrdenAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN", "VENDEDOR");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const fechaStr = String(formData.get("fecha") ?? "").trim();
  const fecha = fechaStr ? new Date(fechaStr + "T00:00:00") : null;
  const instrucciones = String(formData.get("instrucciones") ?? "").trim() || null;

  await actualizarOrden(id, {
    fechaEntrega: fecha && !isNaN(fecha.getTime()) ? fecha : null,
    instrucciones,
  });
  revalidatePath(`/taller/${id}`);
  revalidatePath("/taller");
}
