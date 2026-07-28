import "server-only";
import { Prisma, type EstadoOrden, type EstadoEtapa } from "@prisma/client";
import { db } from "./db";
import type { LineaCosto } from "./calculo";
import { descontarPorOrden } from "./inventario";

/**
 * Órdenes de producción. NO llevan precios: ni el modelo los tiene, ni estas
 * consultas seleccionan jamás una columna de dinero de la cotización. Es lo que
 * hace segura la pantalla del taller (rol TALLER) — el filtrado es estructural.
 */

/** Orden en que se ejecutan los acabados en el taller. */
export const ORDEN_ETAPAS: Record<string, number> = {
  prueba: 0,
  planchas: 5, arranque: 6, impresion: 12, // etapas de offset (producción propia)
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

/** Ítem de producción para el taller: SOLO datos de fabricación, sin dinero. */
export type ItemProd = {
  titulo: string;
  descripcion: string | null;
  cantidad: number;
  ancho: number;
  alto: number;
  tamano: string;
  papelNombre: string;
  capacidad: number;
  pliegos: number;
  acabados: string[];
};

/** Ítem congelado de la cotización (con dinero) del que se parte. */
type ItemFuente = {
  tipo?: string;
  titulo?: string;
  descripcion?: string | null;
  cantidad?: number;
  ancho?: number;
  alto?: number;
  tamano?: string;
  papelNombre?: string;
  capacidad?: number;
  pliegos?: number;
  lineas?: { k: string; label: string }[];
};

/** Un ítem va al taller solo si es de producción propia (digital u offset). */
function esProducible(tipo: string | undefined, cotTipo: string): boolean {
  const t = tipo ?? cotTipo;
  return t === "PROPIA" || t === "OFFSET";
}

/**
 * Proyecta los ítems de la cotización a su versión de PRODUCCIÓN: se queda solo
 * con los datos de fabricación y descarta cualquier campo de dinero. Puro y
 * testeable. Es lo único que se guarda en `Orden.items` y llega al taller.
 */
export function proyeccionProd(items: ItemFuente[] | null | undefined): ItemProd[] {
  if (!items) return [];
  return items.map((it) => ({
    titulo: it.titulo ?? "Ítem",
    descripcion: it.descripcion ?? null,
    cantidad: Number(it.cantidad ?? 0),
    ancho: Number(it.ancho ?? 0),
    alto: Number(it.alto ?? 0),
    tamano: it.tamano ?? "",
    papelNombre: it.papelNombre ?? "",
    capacidad: Number(it.capacidad ?? 0),
    pliegos: Number(it.pliegos ?? 0),
    acabados: (it.lineas ?? []).filter((l) => l.k !== "papel").map((l) => l.label),
  }));
}

/** Genera la orden desde una cotización APROBADA. Las etapas salen de sus acabados. */
export async function generarOrden(cotizacionId: string): Promise<ResultadoOrden> {
  const cot = await db.cotizacion.findUnique({
    where: { id: cotizacionId },
    select: { id: true, tipo: true, estado: true, lineas: true, items: true, orden: { select: { id: true } } },
  });
  if (!cot) return { ok: false, error: "La cotización no existe." };
  if (cot.orden) return { ok: false, error: "Esta cotización ya tiene una orden." };
  if (cot.estado !== "APROBADA") {
    return { ok: false, error: "Solo se genera orden de una cotización aprobada." };
  }

  // Solo los ítems de producción propia (digital/offset) van al taller.
  const todos = (cot.items as unknown as ItemFuente[] | null) ?? [];
  const producibles = todos.length ? todos.filter((it) => esProducible(it.tipo, cot.tipo)) : todos;
  if (todos.length && !producibles.length) {
    return { ok: false, error: "La cotización no tiene ítems de producción propia para el taller." };
  }

  // Las etapas salen de las líneas de acabado (excluye el papel) de los ítems producibles,
  // en orden de taller. Si no hay ítems (cotización vieja), se usan las líneas agregadas.
  const lineasFuente: LineaCosto[] = producibles.length
    ? (producibles.flatMap((it) => (it.lineas as LineaCosto[]) ?? []))
    : ((cot.lineas as unknown as LineaCosto[]) ?? []);
  const vistas = new Set<string>();
  const src = lineasFuente
    .filter((l) => l.k !== "papel")
    .filter((l) => (vistas.has(l.k) ? false : (vistas.add(l.k), true)))
    .map((l) => ({ clave: l.k, nombre: l.label, orden: ORDEN_ETAPAS[l.k] ?? 99 }))
    .sort((a, b) => a.orden - b.orden);
  const etapas = (src.length ? src : [{ clave: "produccion", nombre: "Producción", orden: 0 }])
    .map((e, i) => ({ clave: e.clave, nombre: e.nombre, orden: i }));

  // Proyección SIN precios de los ítems producibles, para la hoja del taller.
  const itemsProd = proyeccionProd(producibles);

  const orden = await db.orden.create({
    data: {
      cotizacionId: cot.id,
      items: itemsProd as unknown as Prisma.InputJsonValue,
      etapas: { create: etapas },
    },
    select: { id: true, numero: true },
  });
  return { ok: true, id: orden.id, numero: orden.numero };
}

// Selección SIN precios: solo lo que el taller necesita ver.
// Se exporta para que una prueba (seguridad.test.ts) verifique el invariante
// TALLER-sin-precios de forma estructural, sin depender de la base de datos.
export const SELECT_PROD = {
  id: true,
  numero: true,
  estado: true,
  fechaEntrega: true,
  prioridad: true,
  instrucciones: true,
  creadaEn: true,
  items: true, // proyección SIN precios (columna propia de Orden)
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
  items: ItemProd[];
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
    items: (o.items as unknown as ItemProd[]) ?? [],
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
    // Al terminar, se descuenta el papel del inventario (una sola vez).
    if (nuevo === "TERMINADA") await descontarPorOrden(ordenId);
  }
}

export async function cambiarEstadoOrden(id: string, estado: EstadoOrden): Promise<void> {
  await db.orden.update({
    where: { id },
    data: { estado, cerradaEn: estado === "ENTREGADA" || estado === "TERMINADA" ? new Date() : null },
  });
  // Terminar/entregar a mano también descuenta el inventario (una sola vez).
  if (estado === "TERMINADA" || estado === "ENTREGADA") await descontarPorOrden(id);
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
