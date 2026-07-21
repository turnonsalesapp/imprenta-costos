import "server-only";
import { Prisma, type EstadoCotizacion } from "@prisma/client";
import { db } from "./db";
import { cargarConfig, snapshot } from "./config";
import { calcular, n, type LineaCosto } from "./calculo";
import { formAEntrada, type FormCotizacion } from "./cotizacion-form";
import { crearTrabajoDesdeForm } from "./trabajos";

/**
 * Guardar, listar y leer cotizaciones.
 *
 * REGLA DE ORO: la cotización es inmutable. Al crearla, el SERVIDOR vuelve a
 * calcular con la configuración de HOY y congela en `snapshot` los papeles,
 * acabados y variables del momento. Nunca se recalcula al leerla: el detalle
 * se muestra desde lo guardado. Si mañana sube el papel, esta no se mueve.
 */

const num = (v: unknown): number => (v == null ? 0 : Number(v));

export const ESTADOS: EstadoCotizacion[] = [
  "BORRADOR",
  "ENVIADA",
  "APROBADA",
  "RECHAZADA",
  "VENCIDA",
];

export const ETIQUETA_ESTADO: Record<EstadoCotizacion, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  VENCIDA: "Vencida",
};

export type ResultadoGuardar =
  | { ok: true; id: string }
  | { ok: false; error: string };

/** Crea la cotización recalculando y congelando en el servidor. */
export async function crearCotizacion(
  form: FormCotizacion,
  usuarioId: string,
): Promise<ResultadoGuardar> {
  const cliente = (form.cliente ?? "").trim();
  const trabajo = (form.trabajo ?? "").trim();
  if (!cliente && !trabajo) {
    return { ok: false, error: "Falta el cliente o el nombre del trabajo." };
  }

  const cfg = await cargarConfig();
  const entrada = formAEntrada(form);
  const r = calcular(entrada, cfg);

  if (r.cant <= 0) {
    return { ok: false, error: "Indica la cantidad de piezas." };
  }

  const papel = cfg.papeles.find((p) => p.id === entrada.papelId) ?? null;

  const clienteId = form.clienteId?.trim() || null;

  // Si viene de un trabajo repetido, se enlaza; si se pidió guardar la receta y
  // no venía de uno, se crea ahora y se enlaza la cotización a ese trabajo.
  let trabajoId = form.trabajoId?.trim() || null;
  if (form.guardarComoTrabajo && !trabajoId) {
    trabajoId = await crearTrabajoDesdeForm(form, clienteId);
  }

  const cot = await db.cotizacion.create({
    data: {
      estado: "BORRADOR",
      usuarioId,
      clienteId,
      trabajoId,
      clienteNombre: cliente || null,
      titulo: trabajo || "Sin título",
      descripcion: form.descripcion?.trim() || null,
      cantidad: r.cant,
      ancho: Math.round(n(form.ancho)),
      alto: Math.round(n(form.alto)),
      tamano: entrada.tamano,
      papelNombre: papel?.nombre ?? "—",
      capacidad: Math.round(n(form.capacidad)) || 0,

      // Copias inmutables del momento del cálculo.
      entrada: entrada as unknown as Prisma.InputJsonValue,
      snapshot: snapshot(cfg) as unknown as Prisma.InputJsonValue,
      lineas: r.lineas as unknown as Prisma.InputJsonValue,

      // Cifras congeladas.
      pliegos: r.pliegos,
      costoTotal: r.costoTotal,
      costoUnit: r.costoUnit,
      diferencial: r.dif,
      margen: num(entrada.margen),
      precioUnit: r.precioUnit,
      ventaTotal: r.ventaTotal,
      precioML: r.precioML,
      tasaBCV: num(entrada.tasaBCV),
      precioBs: r.precioBs,
    },
    select: { id: true },
  });

  return { ok: true, id: cot.id };
}

export type FiltroLista = { q?: string; estado?: EstadoCotizacion | "" };

/** Fila del listado (Decimals ya convertidos a number). */
export type CotizacionFila = {
  id: string;
  numero: number;
  creadaEn: Date;
  estado: EstadoCotizacion;
  clienteNombre: string | null;
  titulo: string;
  papelNombre: string;
  tamano: string;
  cantidad: number;
  costoUnit: number;
  precioUnit: number;
  ventaTotal: number;
  costoTotal: number;
};

export async function listarCotizaciones(f: FiltroLista): Promise<CotizacionFila[]> {
  const filas = await db.cotizacion.findMany({
    where: whereLista(f),
    orderBy: { creadaEn: "desc" },
    select: {
      id: true, numero: true, creadaEn: true, estado: true, clienteNombre: true,
      titulo: true, papelNombre: true, tamano: true, cantidad: true,
      costoUnit: true, precioUnit: true, ventaTotal: true, costoTotal: true,
    },
  });

  return filas.map((c) => ({
    ...c,
    costoUnit: num(c.costoUnit),
    precioUnit: num(c.precioUnit),
    ventaTotal: num(c.ventaTotal),
    costoTotal: num(c.costoTotal),
  }));
}

/** Detalle completo de una cotización guardada, leído tal cual se congeló. */
export type CotizacionDetalle = {
  id: string;
  numero: number;
  creadaEn: Date;
  estado: EstadoCotizacion;
  clienteNombre: string | null;
  titulo: string;
  descripcion: string | null;
  cantidad: number;
  ancho: number;
  alto: number;
  tamano: string;
  papelNombre: string;
  capacidad: number;
  autor: string | null;
  lineas: LineaCosto[];
  pliegos: number;
  costoTotal: number;
  costoUnit: number;
  diferencial: number;
  margen: number;
  precioUnit: number;
  ventaTotal: number;
  precioML: number;
  tasaBCV: number;
  precioBs: number;
  orden: { id: string; numero: number } | null;
};

export async function obtenerCotizacion(id: string): Promise<CotizacionDetalle | null> {
  const c = await db.cotizacion.findUnique({
    where: { id },
    include: {
      usuario: { select: { nombre: true } },
      orden: { select: { id: true, numero: true } },
    },
  });
  if (!c) return null;

  return {
    id: c.id,
    numero: c.numero,
    creadaEn: c.creadaEn,
    estado: c.estado,
    clienteNombre: c.clienteNombre,
    titulo: c.titulo,
    descripcion: c.descripcion,
    cantidad: c.cantidad,
    ancho: c.ancho,
    alto: c.alto,
    tamano: c.tamano,
    papelNombre: c.papelNombre,
    capacidad: c.capacidad,
    autor: c.usuario?.nombre ?? null,
    lineas: (c.lineas as unknown as LineaCosto[]) ?? [],
    pliegos: num(c.pliegos),
    costoTotal: num(c.costoTotal),
    costoUnit: num(c.costoUnit),
    diferencial: num(c.diferencial),
    margen: num(c.margen),
    precioUnit: num(c.precioUnit),
    ventaTotal: num(c.ventaTotal),
    precioML: num(c.precioML),
    tasaBCV: num(c.tasaBCV),
    precioBs: num(c.precioBs),
    orden: c.orden,
  };
}

export async function cambiarEstadoCotizacion(
  id: string,
  estado: EstadoCotizacion,
): Promise<void> {
  await db.cotizacion.update({ where: { id }, data: { estado } });
}

function whereLista(f: FiltroLista): Prisma.CotizacionWhereInput {
  const where: Prisma.CotizacionWhereInput = {};
  if (f.estado) where.estado = f.estado;
  const q = f.q?.trim();
  if (q) {
    where.OR = [
      { titulo: { contains: q, mode: "insensitive" } },
      { clienteNombre: { contains: q, mode: "insensitive" } },
      { descripcion: { contains: q, mode: "insensitive" } },
      { papelNombre: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export type FilaCsv = {
  creadaEn: Date;
  numero: number;
  estado: EstadoCotizacion;
  clienteNombre: string | null;
  titulo: string;
  descripcion: string | null;
  ancho: number;
  alto: number;
  cantidad: number;
  tamano: string;
  papelNombre: string;
  pliegos: number;
  costoTotal: number;
  costoUnit: number;
  diferencial: number;
  margen: number;
  precioUnit: number;
  ventaTotal: number;
  precioML: number;
  tasaBCV: number;
  precioBs: number;
};

/** Filas completas para exportar a CSV, con Decimals ya en number. */
export async function listarParaCsv(f: FiltroLista): Promise<FilaCsv[]> {
  const filas = await db.cotizacion.findMany({
    where: whereLista(f),
    orderBy: { creadaEn: "desc" },
    select: {
      creadaEn: true, numero: true, estado: true, clienteNombre: true, titulo: true,
      descripcion: true, ancho: true, alto: true, cantidad: true, tamano: true,
      papelNombre: true, pliegos: true, costoTotal: true, costoUnit: true,
      diferencial: true, margen: true, precioUnit: true, ventaTotal: true,
      precioML: true, tasaBCV: true, precioBs: true,
    },
  });

  return filas.map((c) => ({
    ...c,
    pliegos: num(c.pliegos),
    costoTotal: num(c.costoTotal),
    costoUnit: num(c.costoUnit),
    diferencial: num(c.diferencial),
    margen: num(c.margen),
    precioUnit: num(c.precioUnit),
    ventaTotal: num(c.ventaTotal),
    precioML: num(c.precioML),
    tasaBCV: num(c.tasaBCV),
    precioBs: num(c.precioBs),
  }));
}
