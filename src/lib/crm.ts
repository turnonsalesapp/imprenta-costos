import "server-only";
import { db } from "./db";
import type { ProspectoEstado, ActividadTipo } from "@prisma/client";

/**
 * CRM comercial ligero: prospectos (leads antes de cotizar) y actividades
 * (reuniones/seguimientos). Reemplaza las columnas "Clientes" y "Agendar
 * Reunión" del tablero comercial de Trello. Se enlaza por id, sin FK dura.
 */

export const PROSPECTO_ESTADOS: ProspectoEstado[] = [
  "NUEVO", "CONTACTADO", "CONVERTIDO", "DESCARTADO",
];

export const ETIQUETA_PROSPECTO: Record<ProspectoEstado, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  CONVERTIDO: "Convertido",
  DESCARTADO: "Descartado",
};

export const ACTIVIDAD_TIPOS: ActividadTipo[] = ["REUNION", "LLAMADA", "SEGUIMIENTO", "NOTA"];

export const ETIQUETA_ACTIVIDAD: Record<ActividadTipo, string> = {
  REUNION: "Reunión",
  LLAMADA: "Llamada",
  SEGUIMIENTO: "Seguimiento",
  NOTA: "Nota",
};

export type ProspectoFila = {
  id: string;
  nombre: string;
  clienteNombre: string | null;
  contacto: string | null;
  detalle: string | null;
  estado: ProspectoEstado;
  cotizacionId: string | null;
  creadoEn: Date;
};

export async function listarProspectos(): Promise<ProspectoFila[]> {
  return db.prospecto.findMany({
    orderBy: [{ actualizadoEn: "desc" }],
    select: {
      id: true, nombre: true, clienteNombre: true, contacto: true,
      detalle: true, estado: true, cotizacionId: true, creadoEn: true,
    },
  });
}

export async function crearProspecto(data: {
  nombre: string; clienteNombre?: string | null; contacto?: string | null;
  detalle?: string | null; usuarioId?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const nombre = data.nombre?.trim();
  if (!nombre) return { ok: false, error: "El nombre de la oportunidad es obligatorio." };
  const p = await db.prospecto.create({
    data: {
      nombre,
      clienteNombre: data.clienteNombre?.trim() || null,
      contacto: data.contacto?.trim() || null,
      detalle: data.detalle?.trim() || null,
      usuarioId: data.usuarioId ?? null,
    },
    select: { id: true },
  });
  return { ok: true, id: p.id };
}

/** Cambia el estado del prospecto en el tablero (arrastrar o selector). */
export async function moverProspecto(id: string, estado: ProspectoEstado): Promise<void> {
  await db.prospecto.update({ where: { id }, data: { estado } });
}

/**
 * Edita los datos de una oportunidad (prospecto): nombre, cliente, contacto,
 * detalle y estado. Valida que el nombre no vaya vacío y que el estado sea uno
 * de los válidos. Los campos de texto vacíos se guardan como null.
 */
export async function actualizarProspecto(
  id: string,
  data: {
    nombre: string;
    clienteNombre?: string | null;
    contacto?: string | null;
    detalle?: string | null;
    estado: ProspectoEstado;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const nombre = data.nombre?.trim();
  if (!nombre) return { ok: false, error: "El nombre de la oportunidad es obligatorio." };
  if (!PROSPECTO_ESTADOS.includes(data.estado)) return { ok: false, error: "Estado inválido." };
  await db.prospecto.update({
    where: { id },
    data: {
      nombre,
      clienteNombre: data.clienteNombre?.trim() || null,
      contacto: data.contacto?.trim() || null,
      detalle: data.detalle?.trim() || null,
      estado: data.estado,
    },
  });
  return { ok: true };
}

export async function eliminarProspecto(id: string): Promise<void> {
  await db.prospecto.delete({ where: { id } });
}

// ─────────────────────────── actividades ───────────────────────────

export type ActividadFila = {
  id: string;
  tipo: ActividadTipo;
  titulo: string;
  fecha: Date | null;
  hecha: boolean;
  notas: string | null;
  clienteNombre: string | null;
  creadoEn: Date;
};

/** Actividades pendientes (no hechas), las agendadas primero por fecha. */
export async function proximasActividades(): Promise<ActividadFila[]> {
  return db.actividad.findMany({
    where: { hecha: false },
    orderBy: [{ fecha: { sort: "asc", nulls: "last" } }, { creadoEn: "desc" }],
    select: {
      id: true, tipo: true, titulo: true, fecha: true, hecha: true,
      notas: true, clienteNombre: true, creadoEn: true,
    },
  });
}

export async function crearActividad(data: {
  tipo: ActividadTipo; titulo: string; fecha?: Date | null;
  clienteNombre?: string | null; prospectoId?: string | null;
  cotizacionId?: string | null; notas?: string | null; usuarioId?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const titulo = data.titulo?.trim();
  if (!titulo) return { ok: false, error: "La actividad necesita un título." };
  const a = await db.actividad.create({
    data: {
      tipo: data.tipo,
      titulo,
      fecha: data.fecha ?? null,
      clienteNombre: data.clienteNombre?.trim() || null,
      prospectoId: data.prospectoId ?? null,
      cotizacionId: data.cotizacionId ?? null,
      notas: data.notas?.trim() || null,
      usuarioId: data.usuarioId ?? null,
    },
    select: { id: true },
  });
  return { ok: true, id: a.id };
}

export async function marcarActividad(id: string, hecha: boolean): Promise<void> {
  await db.actividad.update({ where: { id }, data: { hecha } });
}
