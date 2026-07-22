"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { EstadoCotizacion } from "@prisma/client";
import { requireRol } from "@/lib/auth";
import {
  crearCotizacion,
  actualizarCotizacion,
  crearCotizacionProveedor,
  actualizarCotizacionProveedor,
  cambiarEstadoCotizacion,
  eliminarCotizacion,
  ESTADOS,
} from "@/lib/cotizaciones";
import type { FormCotizacion, FormProveedor } from "@/lib/cotizacion-form";

export type EstadoGuardar = { error: string | null };

/** Guarda una cotización nueva. Redirige a su detalle al terminar. */
export async function guardarCotizacionAction(
  form: FormCotizacion,
): Promise<EstadoGuardar> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");

  const editarId = form.editarId?.trim();
  const r = editarId
    ? await actualizarCotizacion(editarId, form)
    : await crearCotizacion(form, usuario.id);
  if (!r.ok) return { error: r.error };

  redirect(`/cotizaciones/${r.id}`);
}

/** Guarda una cotización de PROVEEDOR (crea o actualiza si es borrador). */
export async function guardarProveedorAction(
  form: FormProveedor,
): Promise<EstadoGuardar> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  const editarId = form.editarId?.trim();
  const r = editarId
    ? await actualizarCotizacionProveedor(editarId, form)
    : await crearCotizacionProveedor(form, usuario.id);
  if (!r.ok) return { error: r.error };
  redirect(`/cotizaciones/${r.id}`);
}

/** Cambia el estado de una cotización (Borrador → Enviada → Aprobada…). */
export async function cambiarEstadoAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN", "VENDEDOR");

  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "") as EstadoCotizacion;
  if (!id || !ESTADOS.includes(estado)) return;

  await cambiarEstadoCotizacion(id, estado);
  revalidatePath(`/cotizaciones/${id}`);
  revalidatePath("/cotizaciones");
}

/** Elimina una cotización (solo ADMIN, solo borrador sin orden). */
export async function eliminarCotizacionAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const r = await eliminarCotizacion(id);
  if (!r.ok) redirect(`/cotizaciones/${id}`);
  revalidatePath("/cotizaciones");
  redirect("/cotizaciones");
}
