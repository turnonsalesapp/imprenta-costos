import "server-only";
import type { Rol } from "@prisma/client";
import { db } from "./db";
import { cargarConfig } from "./config";
import { puedeVerPrecios, puedeVerEstructura } from "./roles";

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
  /** Si además de precios ve la estructura de costos (margen, costo por pliego). */
  verEstructura: boolean;
  papeles: number;
  acabados: number;
  cotizaciones: number;
  ordenes: OrdenesPorEstado;
  precios: {
    tasaBCV: number;
    /** Margen por defecto: es estructura de costos → null si no la ve. */
    margen: number | null;
    /** USD por pliego del papel más económico: es un costo → null si no lo ve. */
    pliegoMasBarato: number | null;
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

export async function cargarResumen(u: { rol: Rol; verEstructura?: boolean }): Promise<Resumen> {
  // TALLER: solo producción. Nada de precios sale de aquí.
  if (!puedeVerPrecios(u.rol)) {
    return { rol: "TALLER", ordenes: await contarOrdenes() };
  }

  // ¿Ve la estructura de costos (margen, costo por pliego)? Si no, se omiten en
  // el servidor: los campos viajan en null, no como número oculto en el cliente.
  const verEstructura = puedeVerEstructura(u);

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
    rol: u.rol as "ADMIN" | "VENDEDOR",
    verEstructura,
    papeles,
    acabados,
    cotizaciones,
    ordenes,
    precios: {
      tasaBCV: cfg.tasaBCV,
      margen: verEstructura ? cfg.margen : null,
      pliegoMasBarato: verEstructura ? pliegoMasBarato : null,
    },
  };
}
