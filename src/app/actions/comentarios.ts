"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUsuario } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  puedeVerTrabajo, puedeVerOportunidad,
  crearComentario, eliminarComentario,
  listarComentariosProspecto,
} from "@/lib/comentarios";
import {
  crearAdjunto, eliminarAdjunto, listarAdjuntosProspecto,
} from "@/lib/adjuntos";
import { validarArchivo } from "@/lib/almacenamiento";
import type { ComentarioUI, AdjuntoUI } from "@/app/(app)/_hilo/HiloTrabajo";

/**
 * Acciones del hilo del trabajo (comentarios + adjuntos). El hilo se ancla a una
 * COTIZACIÓN (trabajo) o a una OPORTUNIDAD (prospecto). El TALLER participa solo
 * en el hilo de la cotización, a través de la orden (sin ver precios); las
 * oportunidades son comerciales y las ven ADMIN/VENDEDOR. Toda acción exige
 * sesión y que el usuario pueda ver ESE destino.
 */

type Resultado = { error: string | null };

/** Destino del hilo leído del FormData: exactamente uno. */
type Destino =
  | { cotizacionId: string; prospectoId?: undefined }
  | { prospectoId: string; cotizacionId?: undefined };

/** Lee y valida el destino del FormData (una cotización O una oportunidad). */
function leerDestino(formData: FormData): Destino | null {
  const cotizacionId = String(formData.get("cotizacionId") ?? "");
  const prospectoId = String(formData.get("prospectoId") ?? "");
  if (cotizacionId && !prospectoId) return { cotizacionId };
  if (prospectoId && !cotizacionId) return { prospectoId };
  return null;
}

/** ¿Puede el usuario ver/participar en este destino? */
async function puedeVerDestino(
  usuario: Awaited<ReturnType<typeof requireUsuario>>,
  destino: Destino,
): Promise<boolean> {
  return destino.cotizacionId
    ? puedeVerTrabajo(usuario, destino.cotizacionId)
    : puedeVerOportunidad(usuario);
}

/** Revalida las vistas afectadas por un cambio en el hilo de un destino. */
async function revalidarDestino(
  destino: { cotizacionId: string | null; prospectoId: string | null },
): Promise<void> {
  if (destino.prospectoId) {
    revalidatePath("/cotizaciones");
    return;
  }
  if (!destino.cotizacionId) return;
  const cotizacionId = destino.cotizacionId;
  revalidatePath(`/cotizaciones/${cotizacionId}`);
  const orden = await db.orden.findUnique({
    where: { cotizacionId },
    select: { id: true },
  });
  revalidatePath("/taller");
  if (orden) revalidatePath(`/taller/${orden.id}`);
}

/** Agrega un comentario al hilo (cotizacionId | prospectoId + texto). */
export async function agregarComentarioAction(formData: FormData): Promise<Resultado> {
  const usuario = await requireUsuario();
  const destino = leerDestino(formData);
  const texto = String(formData.get("texto") ?? "");

  if (!destino) return { error: "Falta el destino del comentario." };
  if (!(await puedeVerDestino(usuario, destino))) {
    return { error: "No tienes acceso a este hilo." };
  }

  const r = await crearComentario({
    cotizacionId: destino.cotizacionId ?? null,
    prospectoId: destino.prospectoId ?? null,
    autorId: usuario.id,
    autorNombre: usuario.nombre,
    texto,
  });
  if (!r.ok) return { error: r.error };

  await registrarAuditoria({
    actorId: usuario.id,
    actorNombre: usuario.nombre,
    accion: "trabajo.comentario",
    entidad: destino.cotizacionId ?? destino.prospectoId ?? null,
    detalle: "Agregó un comentario",
  });
  await revalidarDestino({
    cotizacionId: destino.cotizacionId ?? null,
    prospectoId: destino.prospectoId ?? null,
  });
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
    entidad: r.cotizacionId ?? r.prospectoId ?? null,
    detalle: "Eliminó un comentario",
  });
  await revalidarDestino(r);
  return { error: null };
}

/** Sube un adjunto al hilo (cotizacionId | prospectoId + archivo). */
export async function subirAdjuntoAction(formData: FormData): Promise<Resultado> {
  const usuario = await requireUsuario();
  const destino = leerDestino(formData);
  const archivo = formData.get("archivo");

  if (!destino) return { error: "Falta el destino del adjunto." };
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo." };
  }
  if (!(await puedeVerDestino(usuario, destino))) {
    return { error: "No tienes acceso a este hilo." };
  }

  // Validación temprana por metadatos (evita leer un archivo demasiado grande).
  const previo = validarArchivo({ nombre: archivo.name, tipo: archivo.type, tamano: archivo.size });
  if (!previo.ok) return { error: previo.error };

  const bytes = Buffer.from(await archivo.arrayBuffer());
  const r = await crearAdjunto({
    cotizacionId: destino.cotizacionId ?? null,
    prospectoId: destino.prospectoId ?? null,
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
    entidad: destino.cotizacionId ?? destino.prospectoId ?? null,
    detalle: `Subió el adjunto «${archivo.name}»`,
  });
  await revalidarDestino({
    cotizacionId: destino.cotizacionId ?? null,
    prospectoId: destino.prospectoId ?? null,
  });
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
    entidad: r.cotizacionId ?? r.prospectoId ?? null,
    detalle: "Eliminó un adjunto",
  });
  await revalidarDestino(r);
  return { error: null };
}

/* ─────────────────────── carga del hilo de una oportunidad ─────────────────────── */

function fmtFecha(d: Date): string {
  return (
    d.toLocaleDateString("es-VE") +
    " " +
    d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })
  );
}

/**
 * Carga el hilo (comentarios + adjuntos) de una OPORTUNIDAD para el modal de
 * previsualización en el listado/tablero de cotizaciones. Solo ADMIN/VENDEDOR.
 */
export async function cargarHiloProspectoAction(
  prospectoId: string,
): Promise<{ error: string } | { comentarios: ComentarioUI[]; adjuntos: AdjuntoUI[] }> {
  const usuario = await requireUsuario();
  if (!puedeVerOportunidad(usuario)) return { error: "No tienes acceso a este hilo." };
  if (!prospectoId) return { error: "Falta la oportunidad." };

  const [comentariosRaw, adjuntosRaw] = await Promise.all([
    listarComentariosProspecto(prospectoId),
    listarAdjuntosProspecto(prospectoId),
  ]);

  return {
    comentarios: comentariosRaw.map((c) => ({
      id: c.id,
      autorId: c.autorId,
      autorNombre: c.autorNombre,
      texto: c.texto,
      fecha: fmtFecha(c.creadoEn),
    })),
    adjuntos: adjuntosRaw.map((a) => ({
      id: a.id,
      autorId: a.autorId,
      autorNombre: a.autorNombre,
      nombre: a.nombre,
      tipo: a.tipo,
      tamano: a.tamano,
      fecha: fmtFecha(a.creadoEn),
    })),
  };
}
