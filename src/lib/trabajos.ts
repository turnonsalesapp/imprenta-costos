import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { n, type AcabadoSel } from "./calculo";
import type { FormCotizacion } from "./cotizacion-form";

/**
 * Trabajos repetidos: la RECETA de un trabajo (medida, papel, tamaño,
 * capacidad, acabados) SIN el precio. Recotizar = cargar la receta con las
 * tasas y precios de hoy y calcular de nuevo.
 *
 * Ojo con el papel: el motor usa la `clave` estable como id, pero la relación
 * `Trabajo.papelId` apunta al `id` (cuid) de la tabla. Se mapea en ambos sentidos.
 */

/** Crea un trabajo desde el formulario de la calculadora. Devuelve su id o null. */
export async function crearTrabajoDesdeForm(
  form: FormCotizacion,
  clienteId: string | null,
): Promise<string | null> {
  // form.papelId es la CLAVE del papel; la relación necesita el id (cuid).
  let papelId: string | null = null;
  if (form.papelId) {
    const p = await db.papel.findUnique({
      where: { clave: form.papelId },
      select: { id: true },
    });
    papelId = p?.id ?? null;
  }

  const t = await db.trabajo.create({
    data: {
      clienteId,
      nombre: (form.trabajo || "Trabajo repetido").trim(),
      descripcion: form.descripcion?.trim() || null,
      ancho: Math.round(n(form.ancho)),
      alto: Math.round(n(form.alto)),
      tamano: form.tamano,
      papelId,
      capacidad: Math.round(n(form.capacidad)) || 0,
      capAuto: form.capAuto,
      acabados: form.acabados as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  return t.id;
}

/** Campos de formulario para recotizar un trabajo con las tasas de hoy. */
export type RecetaForm = Partial<FormCotizacion>;

export async function cargarTrabajoEnForm(id: string): Promise<RecetaForm | null> {
  const t = await db.trabajo.findUnique({
    where: { id },
    include: {
      papel: { select: { clave: true, activo: true } },
      cliente: { select: { id: true, nombre: true, activo: true } },
    },
  });
  if (!t) return null;

  // De vuelta a la CLAVE que entiende el motor (solo si el papel sigue activo).
  const papelClave = t.papel?.activo ? t.papel.clave : "";

  return {
    trabajoId: t.id,
    trabajo: t.nombre,
    descripcion: t.descripcion ?? "",
    ancho: t.ancho || "",
    alto: t.alto || "",
    tamano: t.tamano,
    papelId: papelClave,
    capacidad: t.capacidad || "",
    capAuto: t.capAuto,
    acabados: (t.acabados as unknown as Record<string, AcabadoSel>) ?? {},
    clienteId: t.cliente?.activo ? t.cliente.id : "",
    cliente: t.cliente?.nombre ?? "",
  };
}
