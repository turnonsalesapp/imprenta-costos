"use server";

import { revalidatePath } from "next/cache";
import type { ProspectoEstado, ActividadTipo } from "@prisma/client";
import { requireRol } from "@/lib/auth";
import {
  crearProspecto, moverProspecto, actualizarProspecto, eliminarProspecto, PROSPECTO_ESTADOS,
  crearActividad, marcarActividad, ACTIVIDAD_TIPOS,
} from "@/lib/crm";

/** Datos editables de una oportunidad desde el tablero (args tipados). */
export type ActualizarProspectoInput = {
  nombre: string;
  clienteNombre: string | null;
  contacto: string | null;
  detalle: string | null;
  estado: ProspectoEstado;
};

/** Crea un prospecto/oportunidad (ADMIN/VENDEDOR). */
export async function crearProspectoAction(formData: FormData): Promise<{ error: string | null }> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  const r = await crearProspecto({
    nombre: String(formData.get("nombre") ?? ""),
    clienteNombre: String(formData.get("clienteNombre") ?? ""),
    contacto: String(formData.get("contacto") ?? ""),
    detalle: String(formData.get("detalle") ?? ""),
    usuarioId: usuario.id,
  });
  if (!r.ok) return { error: r.error };
  revalidatePath("/crm");
  return { error: null };
}

/** Cambia el estado de un prospecto en el tablero (arrastrar o selector). */
export async function moverProspectoAction(
  id: string, estado: ProspectoEstado,
): Promise<{ error: string | null }> {
  await requireRol("ADMIN", "VENDEDOR");
  if (!id || !PROSPECTO_ESTADOS.includes(estado)) return { error: "Estado inválido." };
  await moverProspecto(id, estado);
  revalidatePath("/crm");
  return { error: null };
}

/** Edita una oportunidad (prospecto) desde el tablero de cotizaciones. */
export async function actualizarProspectoAction(
  id: string, data: ActualizarProspectoInput,
): Promise<{ error: string | null }> {
  await requireRol("ADMIN", "VENDEDOR");
  if (!id) return { error: "Oportunidad inválida." };
  const r = await actualizarProspecto(id, data);
  if (!r.ok) return { error: r.error };
  revalidatePath("/cotizaciones");
  revalidatePath("/crm");
  return { error: null };
}

export async function eliminarProspectoAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN", "VENDEDOR");
  const id = String(formData.get("id") ?? "");
  if (id) await eliminarProspecto(id);
  revalidatePath("/crm");
}

/** Agenda una actividad comercial (reunión/llamada/seguimiento). */
export async function crearActividadAction(formData: FormData): Promise<{ error: string | null }> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  const tipoRaw = String(formData.get("tipo") ?? "REUNION") as ActividadTipo;
  const tipo = ACTIVIDAD_TIPOS.includes(tipoRaw) ? tipoRaw : "REUNION";
  const fechaRaw = String(formData.get("fecha") ?? "").trim();
  const r = await crearActividad({
    tipo,
    titulo: String(formData.get("titulo") ?? ""),
    fecha: fechaRaw ? new Date(fechaRaw) : null,
    clienteNombre: String(formData.get("clienteNombre") ?? ""),
    prospectoId: String(formData.get("prospectoId") ?? "") || null,
    notas: String(formData.get("notas") ?? ""),
    usuarioId: usuario.id,
  });
  if (!r.ok) return { error: r.error };
  revalidatePath("/crm");
  return { error: null };
}

/** Marca una actividad como hecha o pendiente. */
export async function marcarActividadAction(
  id: string, hecha: boolean,
): Promise<{ error: string | null }> {
  await requireRol("ADMIN", "VENDEDOR");
  if (!id) return { error: "Actividad inválida." };
  await marcarActividad(id, hecha);
  revalidatePath("/crm");
  return { error: null };
}
