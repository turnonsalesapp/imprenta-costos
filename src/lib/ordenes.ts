import "server-only";
import { Prisma, type EstadoOrden, type EstadoEtapa } from "@prisma/client";
import { db } from "./db";
import type { LineaCosto } from "./calculo";

/**
 * Órdenes de producción. NO llevan precios: ni el modelo los tiene, ni estas
 * consultas seleccionan jamás una columna de dinero de la cotización. Es lo que
 * hace segura la pantalla del taller (rol TALLER) — el filtrado es estructural.
 */

/** Orden en que se ejecutan los acabados en el taller. */
export const ORDEN_ETAPAS: Record<string, number> = {
  prueba: 0,
  impTiro: 10, impRetiro: 11,
  lamTiro: 20, lamRetiro: 21,
  troqDig: 30, troquel: 31, troquelado: 32,
  pegado: 40, acetato: 41,
  guillotina: 50,
};

export const ETIQUETA_ORDEN: Record<EstadoOrden, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  TERMINADA: "Terminada",
  ENTREGADA: "Entregada",
  ANULADA: "Anulada",
};

export const ESTADOS_ORDEN: EstadoOrden[] = [
  "PENDIENTE", "EN_PROCESO", "TERMINADA", "ENTREGADA", "ANULADA",
];

export type ResultadoOrden =
  | { ok: true; id: string; numero: number }
  | { ok: false; error: string };

/** Genera la orden desde una cotización APROBADA. Las etapas salen de sus acabados. */
export async function generarOrden(cotizacionId: string): Promise<ResultadoOrden> {
  const cot = await db.cotizacion.findUnique({
    where: { id: cotizacionId },
    select: { id: true, estado: true, lineas: true, orden: { select: { id: true } } },
  });
  if (!cot) return { ok: false, error: "La cotización no existe." };
  if (cot.orden) return { ok: false, error: "Esta cotización ya tiene una orden." };
  if (cot.estado !== "APROBADA") {
    return { ok: false, error: "Solo se genera orden de una cotización aprobada." };
  }

  // Las etapas salen de las líneas de acabado (excluye el papel), en orden de taller.
  const lineas = (cot.lineas as unknown as LineaCosto[]) ?? [];
  const src = lineas
    .filter((l) => l.k !== "papel")
    .map((l) => ({ clave: l.k, nombre: l.label, orden: ORDEN_ETAPAS[l.k] ?? 99 }))
    .sort((a, b) => a.orden - b.orden);
  const etapas = (src.length ? src : [{ clave: "produccion", nombre: "Producción", orden: 0 }])
    .map((e, i) => ({ clave: e.clave, nombre: e.nombre, orden: i }));

  const orden = await db.orden.create({
    data: { cotizacionId: cot.id, etapas: { create: etapas } },
    select: { id: true, numero: true },
  });
  return { ok: true, id: orden.id, numero: orden.numero };
}

// Selección SIN precios: solo lo que el taller necesita ver.
const SELECT_PROD = {
  id: true,
  numero: true,
  estado: true,
  fechaEntrega: true,
  prioridad: true,
  instrucciones: true,
  creadaEn: true,
  cotizacion: {
    select: {
      numero: true, clienteNombre: true, titulo: true, descripcion: true, cantidad: true,
      papelNombre: true, tamano: true, ancho: true, alto: true, capacidad: true,
      pliegos: true,
    },
  },
  etapas: {
    orderBy: { orden: "asc" },
    select: {
      id: true, clave: true, nombre: true, orden: true, estado: true, responsable: true,
      terminadaEn: true,
    },
  },
} satisfies Prisma.OrdenSelect;

export type Etapa = {
  id: string; clave: string; nombre: string; orden: number; estado: EstadoEtapa;
  responsable: string | null; terminadaEn: Date | null;
};

export type OrdenProd = {
  id: string;
  numero: number;
  cotizacionNumero: number;
  estado: EstadoOrden;
  fechaEntrega: Date | null;
  prioridad: number;
  instrucciones: string | null;
  creadaEn: Date;
  cliente: string | null;
  titulo: string;
  descripcion: string | null;
  cantidad: number;
  papelNombre: string;
  tamano: string;
  ancho: number;
  alto: number;
  capacidad: number;
  pliegos: number;
  etapas: Etapa[];
};

type FilaProd = Prisma.OrdenGetPayload<{ select: typeof SELECT_PROD }>;

function aVista(o: FilaProd): OrdenProd {
  return {
    id: o.id,
    numero: o.numero,
    cotizacionNumero: o.cotizacion.numero,
    estado: o.estado,
    fechaEntrega: o.fechaEntrega,
    prioridad: o.prioridad,
    instrucciones: o.instrucciones,
    creadaEn: o.creadaEn,
    cliente: o.cotizacion.clienteNombre,
    titulo: o.cotizacion.titulo,
    descripcion: o.cotizacion.descripcion,
    cantidad: o.cotizacion.cantidad,
    papelNombre: o.cotizacion.papelNombre,
    tamano: o.cotizacion.tamano,
    ancho: o.cotizacion.ancho,
    alto: o.cotizacion.alto,
    capacidad: o.cotizacion.capacidad,
    pliegos: Number(o.cotizacion.pliegos),
    etapas: o.etapas,
  };
}

/** Tablero del taller: órdenes activas por fecha de entrega. Sin precios. */
export async function tablero(): Promise<OrdenProd[]> {
  const filas = await db.orden.findMany({
    where: { estado: { in: ["PENDIENTE", "EN_PROCESO", "TERMINADA"] } },
    orderBy: [
      { estado: "asc" },
      { fechaEntrega: { sort: "asc", nulls: "last" } },
      { creadaEn: "asc" },
    ],
    select: SELECT_PROD,
  });
  return filas.map(aVista);
}

export async function obtenerOrden(id: string): Promise<OrdenProd | null> {
  const o = await db.orden.findUnique({ where: { id }, select: SELECT_PROD });
  return o ? aVista(o) : null;
}

/** Marca una etapa lista (o la devuelve a pendiente) y recalcula el estado de la orden. */
export async function marcarEtapa(
  etapaId: string,
  lista: boolean,
  responsable: string,
): Promise<string | null> {
  const etapa = await db.etapaOrden.findUnique({
    where: { id: etapaId },
    select: { ordenId: true },
  });
  if (!etapa) return null;

  await db.etapaOrden.update({
    where: { id: etapaId },
    data: lista
      ? { estado: "LISTA", responsable, terminadaEn: new Date() }
      : { estado: "PENDIENTE", responsable: null, terminadaEn: null },
  });

  await recomputarEstadoOrden(etapa.ordenId);
  return etapa.ordenId;
}

async function recomputarEstadoOrden(ordenId: string): Promise<void> {
  const o = await db.orden.findUnique({
    where: { id: ordenId },
    select: { estado: true, etapas: { select: { estado: true } } },
  });
  if (!o) return;
  // No pisamos estados finales fijados a mano.
  if (o.estado === "ENTREGADA" || o.estado === "ANULADA") return;

  const total = o.etapas.length;
  const listas = o.etapas.filter((e) => e.estado === "LISTA" || e.estado === "OMITIDA").length;

  let nuevo: EstadoOrden;
  if (total > 0 && listas === total) nuevo = "TERMINADA";
  else if (listas > 0) nuevo = "EN_PROCESO";
  else nuevo = "PENDIENTE";

  if (nuevo !== o.estado) {
    await db.orden.update({
      where: { id: ordenId },
      data: { estado: nuevo, cerradaEn: nuevo === "TERMINADA" ? new Date() : null },
    });
  }
}

export async function cambiarEstadoOrden(id: string, estado: EstadoOrden): Promise<void> {
  await db.orden.update({
    where: { id },
    data: { estado, cerradaEn: estado === "ENTREGADA" || estado === "TERMINADA" ? new Date() : null },
  });
}

export async function fijarEntrega(id: string, fecha: Date | null): Promise<void> {
  await db.orden.update({ where: { id }, data: { fechaEntrega: fecha } });
}

export async function actualizarOrden(
  id: string,
  data: { fechaEntrega?: Date | null; instrucciones?: string | null },
): Promise<void> {
  await db.orden.update({ where: { id }, data });
}
