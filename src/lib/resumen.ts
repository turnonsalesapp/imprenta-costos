import "server-only";
import type { Rol } from "@prisma/client";
import { db } from "./db";
import { cargarConfig } from "./config";
import { puedeVerPrecios } from "./roles";

/**
 * Datos del panel de inicio, ARMADOS SEGÚN EL ROL en el servidor.
 *
 * Para TALLER no se consulta ni se devuelve nada de dinero: la rama de precios
 * ni siquiera llama a `cargarConfig()`. El resultado es un tipo discriminado,
 * así el compilador impide leer `.precios` cuando no existe.
 */

export type ResumenTaller = {
  rol: "TALLER";
  ordenes: OrdenesPorEstado;
};

export type ResumenConPrecios = {
  rol: "ADMIN" | "VENDEDOR";
  papeles: number;
  acabados: number;
  cotizaciones: number;
  ordenes: OrdenesPorEstado;
  precios: {
    tasaBCV: number;
    margen: number;
    /** USD por pliego del papel más económico. */
    pliegoMasBarato: number;
  };
};

export type Resumen = ResumenTaller | ResumenConPrecios;

type OrdenesPorEstado = {
  pendientes: number;
  enProceso: number;
  terminadas: number;
};

async function contarOrdenes(): Promise<OrdenesPorEstado> {
  const [pendientes, enProceso, terminadas] = await Promise.all([
    db.orden.count({ where: { estado: "PENDIENTE" } }),
    db.orden.count({ where: { estado: "EN_PROCESO" } }),
    db.orden.count({ where: { estado: "TERMINADA" } }),
  ]);
  return { pendientes, enProceso, terminadas };
}

export async function cargarResumen(rol: Rol): Promise<Resumen> {
  // TALLER: solo producción. Nada de precios sale de aquí.
  if (!puedeVerPrecios(rol)) {
    return { rol: "TALLER", ordenes: await contarOrdenes() };
  }

  const [papeles, acabados, cotizaciones, ordenes, cfg] = await Promise.all([
    db.papel.count(),
    db.acabado.count(),
    db.cotizacion.count(),
    contarOrdenes(),
    cargarConfig(),
  ]);

  const pliegoMasBarato = cfg.papeles.length
    ? Math.min(...cfg.papeles.map((p) => p.precio / p.hojas))
    : 0;

  return {
    rol: rol as "ADMIN" | "VENDEDOR",
    papeles,
    acabados,
    cotizaciones,
    ordenes,
    precios: { tasaBCV: cfg.tasaBCV, margen: cfg.margen, pliegoMasBarato },
  };
}
