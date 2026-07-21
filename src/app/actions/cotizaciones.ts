"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { EstadoCotizacion } from "@prisma/client";
import { requireRol } from "@/lib/auth";
import {
  crearCotizacion,
  cambiarEstadoCotizacion,
  ESTADOS,
} from "@/lib/cotizaciones";
import type { FormCotizacion } from "@/lib/cotizacion-form";

export type EstadoGuardar = { error: string | null };

/** Guarda una cotización nueva. Redirige a su detalle al terminar. */
export async function guardarCotizacionAction(
  form: FormCotizacion,
): Promise<EstadoGuardar> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");

  const r = await crearCotizacion(form, usuario.id);
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
