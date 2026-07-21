"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { EstadoOrden } from "@prisma/client";
import { requireUsuario, requireRol } from "@/lib/auth";
import {
  generarOrden, marcarEtapa, cambiarEstadoOrden, actualizarOrden, ESTADOS_ORDEN,
} from "@/lib/ordenes";

/** Genera la orden desde una cotización aprobada (ADMIN/VENDEDOR). */
export async function generarOrdenAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN", "VENDEDOR");
  const cotizacionId = String(formData.get("cotizacionId") ?? "");

  const r = await generarOrden(cotizacionId);
  if (!r.ok) {
    // El botón solo aparece cuando procede; ante un caso raro, vuelve al detalle.
    redirect(`/cotizaciones/${cotizacionId}`);
  }
  revalidatePath(`/cotizaciones/${cotizacionId}`);
  redirect(`/taller/${r.id}`);
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
