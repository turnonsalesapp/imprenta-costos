import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import {
  planificarCrm, planificarProduccion,
  type CrmFlags, type ProdFlags, type Reconciliacion,
} from "./trello";

/**
 * Operaciones de migración inicial: reseteo de datos transaccionales e
 * importación de los tableros de Trello. Se llaman desde la página /migracion
 * (solo ADMIN). El servidor de Railway SÍ alcanza la base, así que todo corre
 * desde el navegador sin terminal.
 */

// ─────────────────────────── reseteo ───────────────────────────

export type Conteos = {
  cotizaciones: number; ordenes: number; piezas: number;
  oportunidades: number; actividades: number; clientes: number;
};

export async function contarTransaccional(): Promise<Conteos> {
  const [cotizaciones, ordenes, piezas, oportunidades, actividades, clientes] = await Promise.all([
    db.cotizacion.count(), db.orden.count(), db.piezaOrden.count(),
    db.prospecto.count(), db.actividad.count(), db.cliente.count(),
  ]);
  return { cotizaciones, ordenes, piezas, oportunidades, actividades, clientes };
}

export type ResultadoReset = { ordenes: number; cotizaciones: number; oportunidades: number; actividades: number };

/** Borra órdenes/piezas/etapas, cotizaciones (cascada), oportunidades y
 *  actividades. Conserva catálogo, config, usuarios, clientes e inventario. */
export async function resetTransaccional(): Promise<ResultadoReset> {
  await db.etapaOrden.deleteMany();
  const piezas = await db.piezaOrden.deleteMany();
  const ordenes = await db.orden.deleteMany();
  const cotizaciones = await db.cotizacion.deleteMany();
  const oportunidades = await db.prospecto.deleteMany();
  const actividades = await db.actividad.deleteMany();
  void piezas;
  return { ordenes: ordenes.count, cotizaciones: cotizaciones.count, oportunidades: oportunidades.count, actividades: actividades.count };
}

// ─────────────────────────── importaciones ───────────────────────────

export type ResultadoImport = {
  recon: Reconciliacion;
  creados: number;
  duplicados: number;
  esperados: number;
};

export async function importarCrm(jsonText: string, flags: CrmFlags): Promise<ResultadoImport> {
  const data = JSON.parse(jsonText);
  const { plan, recon } = planificarCrm(data, flags);
  let creados = 0, duplicados = 0;
  for (const p of plan) {
    const existe = await db.prospecto.findFirst({ where: { nombre: p.nombre }, select: { id: true } });
    if (existe) { duplicados++; continue; }
    await db.prospecto.create({ data: { nombre: p.nombre, detalle: p.detalle, estado: p.estado } });
    creados++;
  }
  return { recon, creados, duplicados, esperados: plan.length };
}

export async function importarProduccion(jsonText: string, flags: ProdFlags): Promise<ResultadoImport> {
  const data = JSON.parse(jsonText);
  const { plan, recon } = planificarProduccion(data, flags);
  let creados = 0, duplicados = 0;
  for (const p of plan) {
    const dup = await db.cotizacion.findFirst({
      where: p.ref ? { refCotizacion: p.ref } : { titulo: p.titulo },
      select: { id: true },
    });
    if (dup) { duplicados++; continue; }
    await db.$transaction(async (tx) => {
      const cot = await tx.cotizacion.create({
        data: {
          estado: "GANADA", tipo: p.tipo as never, titulo: p.titulo,
          cantidad: 1, ancho: 0, alto: 0, tamano: "", papelNombre: "", capacidad: 0,
          entrada: {}, snapshot: {}, lineas: [],
          pliegos: 0, costoTotal: 0, costoUnit: 0, diferencial: 0, margen: 0,
          precioUnit: 0, ventaTotal: 0, precioML: 0, tasaBCV: 0, precioBs: 0,
          refCotizacion: p.ref, notas: p.notas,
        },
        select: { id: true },
      });
      const orden = await tx.orden.create({
        data: {
          cotizacionId: cot.id, estado: p.orden as never, estadoCobro: p.cobro as never,
          items: [] as unknown as Prisma.InputJsonValue,
          fechaFactura: p.cobro !== "NO_FACTURADO" ? new Date() : null,
          fechaCobro: p.cobro === "COBRADO" ? new Date() : null,
          cerradaEn: p.orden === "ENTREGADA" ? new Date() : null,
        },
        select: { id: true },
      });
      await tx.piezaOrden.create({
        data: {
          ordenId: orden.id, carril: p.carril as never, tipo: p.tipo, titulo: p.titulo,
          cantidad: 1, estado: p.pieza as never, orden: 0,
          proveedorNombre: p.carril === "TERCERIZADO" ? "(por definir)" : null,
          snapshot: {} as unknown as Prisma.InputJsonValue,
        },
      });
    });
    creados++;
  }
  return { recon, creados, duplicados, esperados: plan.length };
}
