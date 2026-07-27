import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import type { ModoCobroGF } from "./calculo-granformato";

/**
 * Catálogo de materiales de GRAN FORMATO (costos base del proveedor tercerizado).
 * Igual que los papeles: no se borran, se desactivan; las cotizaciones viejas
 * los siguen mostrando por su snapshot congelado.
 */

const num = (v: unknown): number => (v == null ? 0 : Number(v));

/** Anchos de rollo "105,137,152" → [105, 137, 152] cm. */
export function parseAnchos(s: string): number[] {
  return (s ?? "")
    .split(/[,;\s]+/)
    .map((x) => Number(x.replace(",", ".")))
    .filter((x) => x > 0)
    .sort((a, b) => a - b);
}

/** Material tal como lo consume la calculadora. */
export type MaterialGFItem = {
  id: string; clave: string; nombre: string; categoria: string;
  costoM2: number; modoCobro: ModoCobroGF; anchos: number[];
  montaje: string; tablaEtq: string;
};

export async function listarMaterialesGF(): Promise<MaterialGFItem[]> {
  const filas = await db.materialGF.findMany({
    where: { activo: true },
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
  });
  return filas.map((m) => ({
    id: m.id, clave: m.clave, nombre: m.nombre, categoria: m.categoria,
    costoM2: num(m.costoM2), modoCobro: m.modoCobro as ModoCobroGF, anchos: parseAnchos(m.anchosRollo),
    montaje: m.montaje, tablaEtq: m.tablaEtq,
  }));
}

/* ─────────────────────────── administración ─────────────────────────── */

export type MaterialGFFila = {
  id: string; clave: string; nombre: string; categoria: string;
  costoM2: number; modoCobro: string; anchosRollo: string;
  montaje: string; tablaEtq: string; activo: boolean;
};

export async function listarMaterialesGFAdmin(): Promise<MaterialGFFila[]> {
  const filas = await db.materialGF.findMany({ orderBy: [{ activo: "desc" }, { categoria: "asc" }, { nombre: "asc" }] });
  return filas.map((m) => ({
    id: m.id, clave: m.clave, nombre: m.nombre, categoria: m.categoria,
    costoM2: num(m.costoM2), modoCobro: m.modoCobro, anchosRollo: m.anchosRollo,
    montaje: m.montaje, tablaEtq: m.tablaEtq, activo: m.activo,
  }));
}

export type DatosMaterialGF = {
  nombre: string; categoria: string; costoM2: number; modoCobro: string;
  anchosRollo: string; montaje: string; tablaEtq: string;
};

function normalizaModo(m: string): string {
  return m === "ancho_rollo" ? "ancho_rollo" : m === "etiqueta" ? "etiqueta" : "mancha";
}

export async function crearMaterialGF(d: DatosMaterialGF): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.materialGF.create({
      data: {
        clave: d.nombre + "-" + Date.now().toString(36),
        nombre: d.nombre, categoria: d.categoria || "Banner",
        costoM2: d.costoM2, modoCobro: normalizaModo(d.modoCobro), anchosRollo: d.anchosRollo,
        montaje: d.montaje, tablaEtq: d.tablaEtq,
      },
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ya existe un material con esa clave." };
    }
    throw e;
  }
}

export async function editarMaterialGF(id: string, d: DatosMaterialGF): Promise<void> {
  await db.materialGF.update({
    where: { id },
    data: {
      nombre: d.nombre || "Material", categoria: d.categoria || "Banner",
      costoM2: d.costoM2, modoCobro: normalizaModo(d.modoCobro), anchosRollo: d.anchosRollo,
      montaje: d.montaje, tablaEtq: d.tablaEtq,
    },
  });
}

export async function alternarMaterialGF(id: string): Promise<void> {
  const m = await db.materialGF.findUnique({ where: { id }, select: { activo: true } });
  if (!m) return;
  await db.materialGF.update({ where: { id }, data: { activo: !m.activo } });
}
