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
  crearCotizacionGranFormato,
  actualizarCotizacionGranFormato,
  crearCotizacionPersonalizado,
  actualizarCotizacionPersonalizado,
  crearCotizacionOffset,
  actualizarCotizacionOffset,
  crearCotizacionMixta,
  actualizarCotizacionMixta,
  cambiarEstadoCotizacion,
  eliminarCotizacion,
  cargarCotizacionEnDraft,
  ESTADOS,
  type ItemBorrador,
} from "@/lib/cotizaciones";
import type { FormCotizacion, FormProveedor, FormGranFormato, FormPersonalizado, FormOffset } from "@/lib/cotizacion-form";
import { puedeCotizarTipo, puedeEliminarCotizaciones, ETIQUETA_TIPO_COTIZACION } from "@/lib/roles";
import type { Sesion } from "@/lib/auth";
import type { TipoCotizacion } from "@prisma/client";
import { registrarAuditoria } from "@/lib/auditoria";

/** Verifica que el usuario pueda cotizar un tipo; devuelve el error si no. */
function vetoTipo(usuario: Sesion, tipo: TipoCotizacion): string | null {
  return puedeCotizarTipo(usuario, tipo)
    ? null
    : `No tienes permiso para cotizar ${ETIQUETA_TIPO_COTIZACION[tipo] ?? tipo}.`;
}

export type EstadoGuardar = { error: string | null };

/** Guarda una cotización (uno o varios ítems). Redirige a su detalle al terminar. */
export async function guardarCotizacionAction(
  items: FormCotizacion[],
): Promise<EstadoGuardar> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  if (!items.length) return { error: "Agrega al menos un ítem." };
  const veto = vetoTipo(usuario, "PROPIA");
  if (veto) return { error: veto };

  const editarId = items[0].editarId?.trim();
  const r = editarId
    ? await actualizarCotizacion(editarId, items)
    : await crearCotizacion(items, usuario.id);
  if (!r.ok) return { error: r.error };

  redirect(`/cotizaciones/${r.id}`);
}

/** Guarda una cotización de PROVEEDOR (crea o actualiza si es borrador). */
export async function guardarProveedorAction(
  form: FormProveedor,
): Promise<EstadoGuardar> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  const veto = vetoTipo(usuario, "PROVEEDOR");
  if (veto) return { error: veto };
  const editarId = form.editarId?.trim();
  const r = editarId
    ? await actualizarCotizacionProveedor(editarId, form)
    : await crearCotizacionProveedor(form, usuario.id);
  if (!r.ok) return { error: r.error };
  redirect(`/cotizaciones/${r.id}`);
}

/** Guarda una cotización de GRAN FORMATO (crea o actualiza si es borrador). */
export async function guardarGranFormatoAction(
  form: FormGranFormato,
): Promise<EstadoGuardar> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  const veto = vetoTipo(usuario, "GRAN_FORMATO");
  if (veto) return { error: veto };
  const editarId = form.editarId?.trim();
  const r = editarId
    ? await actualizarCotizacionGranFormato(editarId, form)
    : await crearCotizacionGranFormato(form, usuario.id);
  if (!r.ok) return { error: r.error };
  redirect(`/cotizaciones/${r.id}`);
}

/** Guarda una cotización de PERSONALIZADO / Material POP (crea o actualiza si es borrador). */
export async function guardarPersonalizadoAction(
  form: FormPersonalizado,
): Promise<EstadoGuardar> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  const veto = vetoTipo(usuario, "PERSONALIZADO");
  if (veto) return { error: veto };
  const editarId = form.editarId?.trim();
  const r = editarId
    ? await actualizarCotizacionPersonalizado(editarId, form)
    : await crearCotizacionPersonalizado(form, usuario.id);
  if (!r.ok) return { error: r.error };
  redirect(`/cotizaciones/${r.id}`);
}

/** Guarda una cotización de OFFSET (producción propia; crea o actualiza si es borrador). */
export async function guardarOffsetAction(
  form: FormOffset,
): Promise<EstadoGuardar> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  const veto = vetoTipo(usuario, "OFFSET");
  if (veto) return { error: veto };
  const editarId = form.editarId?.trim();
  const r = editarId
    ? await actualizarCotizacionOffset(editarId, form)
    : await crearCotizacionOffset(form, usuario.id);
  if (!r.ok) return { error: r.error };
  redirect(`/cotizaciones/${r.id}`);
}

/** Guarda una cotización MIXTA (crea, o actualiza si el borrador trae editarId). */
export async function guardarMixtaAction(
  borrador: { meta: { cliente?: string; clienteId?: string; trabajo?: string; editarId?: string }; items: ItemBorrador[] },
): Promise<EstadoGuardar> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  // Cada ítem debe ser de un tipo que el usuario tenga permitido cotizar.
  for (const it of borrador.items) {
    const veto = vetoTipo(usuario, it.tipo);
    if (veto) return { error: veto };
  }
  const editarId = borrador.meta.editarId?.trim();
  const r = editarId
    ? await actualizarCotizacionMixta(editarId, borrador)
    : await crearCotizacionMixta(borrador, usuario.id);
  if (!r.ok) return { error: r.error };
  redirect(`/cotizaciones/${r.id}`);
}

/**
 * Carga una cotización en el cotizador unificado (para los botones "Editar" y
 * "Usar como base" del listado). Devuelve el borrador o null.
 */
export async function cargarEnCotizadorAction(
  id: string, modo: "editar" | "copia",
) {
  await requireRol("ADMIN", "VENDEDOR");
  return cargarCotizacionEnDraft(id, modo);
}

/** Cambia el estado de una cotización (Borrador → Enviada → Aprobada…). */
export async function cambiarEstadoAction(formData: FormData): Promise<void> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");

  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "") as EstadoCotizacion;
  if (!id || !ESTADOS.includes(estado)) return;

  await cambiarEstadoCotizacion(id, estado);
  await registrarAuditoria({
    actorId: usuario.id, actorNombre: usuario.nombre,
    accion: "cotizacion.estado", entidad: id, detalle: `Estado → ${estado}`,
  });
  revalidatePath(`/cotizaciones/${id}`);
  revalidatePath("/cotizaciones");
  revalidatePath("/taller"); // el handoff pudo generar la orden
}

/**
 * Cambia el estado desde el tablero Kanban (arrastrar o el selector de la
 * tarjeta). Igual que `cambiarEstadoAction` pero con argumentos tipados para
 * llamarla desde el cliente, y devuelve `{error}` en vez de redirigir.
 */
export async function moverEstadoAction(
  id: string, estado: EstadoCotizacion,
): Promise<{ error: string | null }> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  if (!id || !ESTADOS.includes(estado)) return { error: "Estado inválido." };
  await cambiarEstadoCotizacion(id, estado);
  await registrarAuditoria({
    actorId: usuario.id, actorNombre: usuario.nombre,
    accion: "cotizacion.estado", entidad: id, detalle: `Estado → ${estado}`,
  });
  revalidatePath("/cotizaciones");
  revalidatePath("/taller"); // el handoff pudo generar la orden
  return { error: null };
}

/** Elimina una cotización (quien tenga permiso; solo borrador sin orden). */
export async function eliminarCotizacionAction(formData: FormData): Promise<void> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  if (!puedeEliminarCotizaciones(usuario)) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const r = await eliminarCotizacion(id);
  if (!r.ok) redirect(`/cotizaciones/${id}`);
  revalidatePath("/cotizaciones");
  redirect("/cotizaciones");
}
