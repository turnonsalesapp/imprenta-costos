"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUsuario } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  puedeVerTrabajo, crearComentario, eliminarComentario,
} from "@/lib/comentarios";
import { crearAdjunto, eliminarAdjunto } from "@/lib/adjuntos";
import { validarArchivo } from "@/lib/almacenamiento";

/**
 * Acciones del hilo del trabajo (comentarios + adjuntos). El hilo se ancla a la
 * cotización; el TALLER participa a través de la orden (sin ver precios). Toda
 * acción exige sesión y que el usuario pueda ver ESE trabajo.
 */

type Resultado = { error: string | null };

/** Revalida el detalle de la cotización y, si existe, el de su orden en el taller. */
async function revalidarTrabajo(cotizacionId: string): Promise<void> {
  revalidatePath(`/cotizaciones/${cotizacionId}`);
  const orden = await db.orden.findUnique({
    where: { cotizacionId },
    select: { id: true },
  });
  revalidatePath("/taller");
  if (orden) revalidatePath(`/taller/${orden.id}`);
}

/** Agrega un comentario al hilo (cotizacionId + texto). */
export async function agregarComentarioAction(formData: FormData): Promise<Resultado> {
  const usuario = await requireUsuario();
  const cotizacionId = String(formData.get("cotizacionId") ?? "");
  const texto = String(formData.get("texto") ?? "");

  if (!cotizacionId) return { error: "Falta el trabajo." };
  if (!(await puedeVerTrabajo(usuario, cotizacionId))) {
    return { error: "No tienes acceso a este trabajo." };
  }

  const r = await crearComentario({
    cotizacionId,
    autorId: usuario.id,
    autorNombre: usuario.nombre,
    texto,
  });
  if (!r.ok) return { error: r.error };

  await registrarAuditoria({
    actorId: usuario.id,
    actorNombre: usuario.nombre,
    accion: "trabajo.comentario",
    entidad: cotizacionId,
    detalle: "Agregó un comentario",
  });
  await revalidarTrabajo(cotizacionId);
  return { error: null };
}

/** Elimina un comentario (autor o ADMIN). */
export async function eliminarComentarioAction(formData: FormData): Promise<Resultado> {
  const usuario = await requireUsuario();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el comentario." };

  const r = await eliminarComentario(id, usuario);
  if (!r.ok) return { error: r.error };

  await registrarAuditoria({
    actorId: usuario.id,
    actorNombre: usuario.nombre,
    accion: "trabajo.comentario.borrar",
    entidad: r.cotizacionId,
    detalle: "Eliminó un comentario",
  });
  await revalidarTrabajo(r.cotizacionId);
  return { error: null };
}

/** Sube un adjunto al hilo (cotizacionId + archivo). */
export async function subirAdjuntoAction(formData: FormData): Promise<Resultado> {
  const usuario = await requireUsuario();
  const cotizacionId = String(formData.get("cotizacionId") ?? "");
  const archivo = formData.get("archivo");

  if (!cotizacionId) return { error: "Falta el trabajo." };
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo." };
  }
  if (!(await puedeVerTrabajo(usuario, cotizacionId))) {
    return { error: "No tienes acceso a este trabajo." };
  }

  // Validación temprana por metadatos (evita leer un archivo demasiado grande).
  const previo = validarArchivo({ nombre: archivo.name, tipo: archivo.type, tamano: archivo.size });
  if (!previo.ok) return { error: previo.error };

  const bytes = Buffer.from(await archivo.arrayBuffer());
  const r = await crearAdjunto({
    cotizacionId,
    autorId: usuario.id,
    autorNombre: usuario.nombre,
    nombre: archivo.name,
    tipo: archivo.type,
    bytes,
  });
  if (!r.ok) return { error: r.error };

  await registrarAuditoria({
    actorId: usuario.id,
    actorNombre: usuario.nombre,
    accion: "trabajo.adjunto",
    entidad: cotizacionId,
    detalle: `Subió el adjunto «${archivo.name}»`,
  });
  await revalidarTrabajo(cotizacionId);
  return { error: null };
}

/** Elimina un adjunto (autor o ADMIN). */
export async function eliminarAdjuntoAction(formData: FormData): Promise<Resultado> {
  const usuario = await requireUsuario();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el adjunto." };

  const r = await eliminarAdjunto(id, usuario);
  if (!r.ok) return { error: r.error };

  await registrarAuditoria({
    actorId: usuario.id,
    actorNombre: usuario.nombre,
    accion: "trabajo.adjunto.borrar",
    entidad: r.cotizacionId,
    detalle: "Eliminó un adjunto",
  });
  await revalidarTrabajo(r.cotizacionId);
  return { error: null };
}
