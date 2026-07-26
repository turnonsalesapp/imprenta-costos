import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";

/**
 * Equipos del taller (prensas offset, etc.). Como los papeles: no se borran, se
 * desactivan. En offset, el equipo elegido define los colores por pasada y los
 * costos de corrida (millar) y arranque.
 */

const num = (v: unknown): number => (v == null ? 0 : Number(v));

export type EquipoItem = {
  id: string; clave: string; nombre: string;
  coloresPasada: number; costoMillar: number; costoArranque: number;
};

export async function listarEquipos(): Promise<EquipoItem[]> {
  const filas = await db.equipo.findMany({ where: { activo: true }, orderBy: [{ nombre: "asc" }] });
  return filas.map((e) => ({
    id: e.id, clave: e.clave, nombre: e.nombre,
    coloresPasada: e.coloresPasada, costoMillar: num(e.costoMillar), costoArranque: num(e.costoArranque),
  }));
}

/* ─────────────────────────── administración ─────────────────────────── */

export type EquipoFila = EquipoItem & { activo: boolean };

export async function listarEquiposAdmin(): Promise<EquipoFila[]> {
  const filas = await db.equipo.findMany({ orderBy: [{ activo: "desc" }, { nombre: "asc" }] });
  return filas.map((e) => ({
    id: e.id, clave: e.clave, nombre: e.nombre,
    coloresPasada: e.coloresPasada, costoMillar: num(e.costoMillar), costoArranque: num(e.costoArranque),
    activo: e.activo,
  }));
}

export type DatosEquipo = {
  nombre: string; coloresPasada: number; costoMillar: number; costoArranque: number;
};

function sanea(d: DatosEquipo) {
  return {
    nombre: d.nombre || "Equipo",
    coloresPasada: Math.max(1, Math.round(d.coloresPasada) || 1),
    costoMillar: Math.max(0, d.costoMillar),
    costoArranque: Math.max(0, d.costoArranque),
  };
}

export async function crearEquipo(d: DatosEquipo): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.equipo.create({ data: { clave: d.nombre + "-" + Date.now().toString(36), ...sanea(d) } });
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ya existe un equipo con esa clave." };
    }
    throw e;
  }
}

export async function editarEquipo(id: string, d: DatosEquipo): Promise<void> {
  await db.equipo.update({ where: { id }, data: sanea(d) });
}

export async function alternarEquipo(id: string): Promise<void> {
  const e = await db.equipo.findUnique({ where: { id }, select: { activo: true } });
  if (!e) return;
  await db.equipo.update({ where: { id }, data: { activo: !e.activo } });
}
