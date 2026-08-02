import "server-only";
import {
  Prisma, type EstadoOrden, type EstadoEtapa,
  type CarrilPieza, type EstadoPieza, type EstadoCobro,
} from "@prisma/client";
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
  proveedorNombre?: string | null;
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

/** Dedupe de líneas de acabado (sin papel), en orden de taller, para las etapas. */
function etapasDeLineas(lineas: LineaCosto[]): { clave: string; nombre: string }[] {
  const vistas = new Set<string>();
  const src = (lineas ?? [])
    .filter((l) => l.k !== "papel")
    .filter((l) => (vistas.has(l.k) ? false : (vistas.add(l.k), true)))
    .map((l) => ({ clave: l.k, nombre: l.label, orden: ORDEN_ETAPAS[l.k] ?? 99 }))
    .sort((a, b) => a.orden - b.orden);
  return (src.length ? src : [{ clave: "produccion", nombre: "Producción", orden: 0 }])
    .map((e) => ({ clave: e.clave, nombre: e.nombre }));
}

/** Carril de una pieza según su tipo: propia/offset al taller, el resto a compras. */
export function carrilDe(tipo: string): CarrilPieza {
  return esProducible(tipo, tipo) ? "INTERNO" : "TERCERIZADO";
}

/**
 * Genera la orden desde una cotización APROBADA. Crea una PIEZA por cada ítem:
 * las internas (PROPIA/OFFSET) van al taller con sus etapas de acabado; las
 * tercerizadas (gran formato, proveedor, personalizado) van a compras con estado
 * POR_COTIZAR. La hoja del taller (Orden.items) mantiene solo lo interno, sin precios.
 */
export async function generarOrden(cotizacionId: string): Promise<ResultadoOrden> {
  const cot = await db.cotizacion.findUnique({
    where: { id: cotizacionId },
    select: {
      id: true, tipo: true, estado: true, lineas: true, items: true,
      titulo: true, cantidad: true, proveedorNombre: true, orden: { select: { id: true } },
    },
  });
  if (!cot) return { ok: false, error: "La cotización no existe." };
  if (cot.orden) return { ok: false, error: "Esta cotización ya tiene una orden." };
  if (cot.estado !== "APROBADA") {
    return { ok: false, error: "Solo se genera orden de una cotización aprobada." };
  }

  // Ítems fuente: los guardados o, en cotizaciones viejas, uno sintetizado de la cabecera.
  const guardados = (cot.items as unknown as ItemFuente[] | null) ?? [];
  const fuente: ItemFuente[] = guardados.length ? guardados : [{
    tipo: cot.tipo,
    titulo: cot.titulo,
    cantidad: cot.cantidad,
    proveedorNombre: cot.proveedorNombre ?? null,
    lineas: (cot.lineas as unknown as { k: string; label: string }[]) ?? [],
  }];

  // Cada ítem = una pieza. Internas con etapas; tercerizadas sin etapas.
  const plan = fuente.map((it, i) => {
    const tipo = it.tipo ?? cot.tipo;
    const carril = carrilDe(tipo);
    const interno = carril === "INTERNO";
    return {
      i, it, tipo, carril, interno,
      estado: (interno ? "EN_COLA" : "POR_COTIZAR") as EstadoPieza,
      snapshot: proyeccionProd([it])[0],
      etapas: interno ? etapasDeLineas((it.lineas as unknown as LineaCosto[]) ?? []) : [],
    };
  });

  const internas = fuente.filter((it) => carrilDe(it.tipo ?? cot.tipo) === "INTERNO");
  const itemsProd = proyeccionProd(internas.length ? internas : fuente);

  const orden = await db.orden.create({
    data: {
      cotizacionId: cot.id,
      items: itemsProd as unknown as Prisma.InputJsonValue,
      piezas: {
        create: plan.map((p) => ({
          carril: p.carril,
          tipo: p.tipo,
          titulo: p.it.titulo ?? "Ítem",
          cantidad: Math.round(Number(p.it.cantidad ?? 0)),
          estado: p.estado,
          orden: p.i,
          proveedorNombre: p.interno ? null : (p.it.proveedorNombre ?? cot.proveedorNombre ?? null),
          snapshot: p.snapshot as unknown as Prisma.InputJsonValue,
        })),
      },
    },
    select: { id: true, numero: true, piezas: { select: { id: true, orden: true } } },
  });

  // Etapas por pieza interna. Se crean con ordenId + piezaId (ordenId sigue NOT NULL
  // y lo usa el recálculo de estado de la orden, intacto).
  const etapasData: Prisma.EtapaOrdenCreateManyInput[] = [];
  for (const p of plan) {
    if (!p.interno || !p.etapas.length) continue;
    const creada = orden.piezas.find((x) => x.orden === p.i);
    if (!creada) continue;
    p.etapas.forEach((e, j) =>
      etapasData.push({ ordenId: orden.id, piezaId: creada.id, clave: e.clave, nombre: e.nombre, orden: j }),
    );
  }
  if (etapasData.length) await db.etapaOrden.createMany({ data: etapasData });

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
  estadoCobro: true,
  fechaFactura: true,
  fechaCobro: true,
  etapas: {
    orderBy: { orden: "asc" },
    select: {
      id: true, clave: true, nombre: true, orden: true, estado: true, responsable: true,
      terminadaEn: true,
    },
  },
  piezas: {
    orderBy: { orden: "asc" },
    select: {
      id: true, carril: true, tipo: true, titulo: true, cantidad: true,
      estado: true, orden: true, proveedorNombre: true,
    },
  },
} satisfies Prisma.OrdenSelect;

export type Etapa = {
  id: string; clave: string; nombre: string; orden: number; estado: EstadoEtapa;
  responsable: string | null; terminadaEn: Date | null;
};

export type PiezaVista = {
  id: string; carril: CarrilPieza; tipo: string; titulo: string; cantidad: number;
  estado: EstadoPieza; orden: number; proveedorNombre: string | null;
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
  piezas: PiezaVista[];
  estadoCobro: EstadoCobro;
  fechaFactura: Date | null;
  fechaCobro: Date | null;
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
    piezas: o.piezas,
    estadoCobro: o.estadoCobro,
    fechaFactura: o.fechaFactura,
    fechaCobro: o.fechaCobro,
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

// ─────────────────────── producción por pieza (Fase 2) ───────────────────────

/** Estados de una pieza INTERNA (taller), en orden de columna del tablero. */
export const ESTADOS_PIEZA_INTERNO: EstadoPieza[] = [
  "EN_COLA", "EN_DISENO", "ESPERANDO_ARTE", "EN_IMPRESION", "EN_ACABADO", "LISTA",
];

/** Estados de una pieza TERCERIZADA (compras al proveedor), en orden de columna. */
export const ESTADOS_PIEZA_TERCERIZADO: EstadoPieza[] = [
  "POR_COTIZAR", "COMPRADO", "RECIBIDO", "ENTREGADO",
];

export const ESTADOS_PIEZA: EstadoPieza[] = [
  ...ESTADOS_PIEZA_INTERNO, ...ESTADOS_PIEZA_TERCERIZADO,
];

export const ETIQUETA_PIEZA: Record<EstadoPieza, string> = {
  EN_COLA: "En cola de diseño",
  EN_DISENO: "En diseño",
  ESPERANDO_ARTE: "Esperando arte",
  EN_IMPRESION: "En impresión",
  EN_ACABADO: "En acabado",
  LISTA: "Lista",
  POR_COTIZAR: "Por cotizar",
  COMPRADO: "Comprado",
  RECIBIDO: "Recibido",
  ENTREGADO: "Entregado",
};

export const ESTADOS_COBRO: EstadoCobro[] = ["NO_FACTURADO", "FACTURADO", "COBRADO"];

export const ETIQUETA_COBRO: Record<EstadoCobro, string> = {
  NO_FACTURADO: "No facturado",
  FACTURADO: "Facturado",
  COBRADO: "Cobrado",
};

/** Cambia el estado de una pieza (mover tarjeta en el tablero de producción). */
export async function cambiarEstadoPieza(
  piezaId: string, estado: EstadoPieza,
): Promise<string | null> {
  const p = await db.piezaOrden.findUnique({
    where: { id: piezaId }, select: { ordenId: true },
  });
  if (!p) return null;
  await db.piezaOrden.update({ where: { id: piezaId }, data: { estado } });
  return p.ordenId;
}

/** Cambia el estado de cobro de la orden, sellando la fecha correspondiente. */
export async function cambiarEstadoCobro(id: string, estado: EstadoCobro): Promise<void> {
  const data: Prisma.OrdenUpdateInput = { estadoCobro: estado };
  if (estado === "FACTURADO") data.fechaFactura = new Date();
  if (estado === "COBRADO") data.fechaCobro = new Date();
  if (estado === "NO_FACTURADO") { data.fechaFactura = null; data.fechaCobro = null; }
  await db.orden.update({ where: { id }, data });
}

/** Una pieza en el tablero de producción, con contexto de su orden. SIN precios. */
export type PiezaTablero = {
  id: string;
  carril: CarrilPieza;
  tipo: string;
  titulo: string;
  cantidad: number;
  estado: EstadoPieza;
  proveedorNombre: string | null;
  ordenId: string;
  ordenNumero: number;
  cliente: string | null;
  fechaEntrega: Date | null;
};

// Selección del tablero de producción: como SELECT_PROD, JAMÁS una columna de
// dinero. Se exporta para que la prueba del invariante la escanee.
export const SELECT_PIEZA_TABLERO = {
  id: true, carril: true, tipo: true, titulo: true, cantidad: true,
  estado: true, proveedorNombre: true, ordenId: true,
  ordenProd: {
    select: { numero: true, fechaEntrega: true, cotizacion: { select: { clienteNombre: true } } },
  },
} satisfies Prisma.PiezaOrdenSelect;

/**
 * Tablero de producción POR PIEZA: piezas de las órdenes activas. Igual que el
 * taller, NO selecciona ninguna columna de dinero (invariante TALLER-sin-precios).
 */
export async function tableroPiezas(): Promise<PiezaTablero[]> {
  const filas = await db.piezaOrden.findMany({
    where: { ordenProd: { estado: { in: ["PENDIENTE", "EN_PROCESO", "TERMINADA"] } } },
    orderBy: [{ creadaEn: "asc" }, { orden: "asc" }],
    select: SELECT_PIEZA_TABLERO,
  });
  return filas.map((p) => ({
    id: p.id,
    carril: p.carril,
    tipo: p.tipo,
    titulo: p.titulo,
    cantidad: p.cantidad,
    estado: p.estado,
    proveedorNombre: p.proveedorNombre,
    ordenId: p.ordenId,
    ordenNumero: p.ordenProd.numero,
    cliente: p.ordenProd.cotizacion.clienteNombre,
    fechaEntrega: p.ordenProd.fechaEntrega,
  }));
}
