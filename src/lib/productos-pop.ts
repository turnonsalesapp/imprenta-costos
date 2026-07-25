import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { parseEscalas, type ModoPop } from "./calculo-personalizado";

/**
 * Catálogo de PERSONALIZADOS / Material POP (costos base del proveedor tercerizado).
 * Como los papeles: no se borran, se desactivan; las cotizaciones viejas los siguen
 * mostrando por su snapshot congelado.
 */

const num = (v: unknown): number => (v == null ? 0 : Number(v));

/** Producto tal como lo consume la calculadora. */
export type ProductoPopItem = {
  id: string; clave: string; nombre: string; categoria: string;
  modo: ModoPop; escalas: string; precioLineal: number;
  anchoCm: number; minCm: number; unidad: string;
};

function normalizaModo(m: string): ModoPop {
  return m === "lineal" ? "lineal" : "escalas";
}

export async function listarProductosPop(): Promise<ProductoPopItem[]> {
  const filas = await db.productoPop.findMany({
    where: { activo: true },
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
  });
  return filas.map((p) => ({
    id: p.id, clave: p.clave, nombre: p.nombre, categoria: p.categoria,
    modo: normalizaModo(p.modo), escalas: p.escalas, precioLineal: num(p.precioLineal),
    anchoCm: p.anchoCm, minCm: p.minCm, unidad: p.unidad,
  }));
}

/* ─────────────────────────── administración ─────────────────────────── */

export type ProductoPopFila = {
  id: string; clave: string; nombre: string; categoria: string;
  modo: string; escalas: string; precioLineal: number;
  anchoCm: number; minCm: number; unidad: string; activo: boolean;
};

export async function listarProductosPopAdmin(): Promise<ProductoPopFila[]> {
  const filas = await db.productoPop.findMany({ orderBy: [{ activo: "desc" }, { categoria: "asc" }, { nombre: "asc" }] });
  return filas.map((p) => ({
    id: p.id, clave: p.clave, nombre: p.nombre, categoria: p.categoria,
    modo: p.modo, escalas: p.escalas, precioLineal: num(p.precioLineal),
    anchoCm: p.anchoCm, minCm: p.minCm, unidad: p.unidad, activo: p.activo,
  }));
}

export type DatosProductoPop = {
  nombre: string; categoria: string; modo: string; escalas: string;
  precioLineal: number; anchoCm: number; minCm: number; unidad: string;
};

/** Normaliza según el modo: escalas limpia los campos lineales y viceversa. */
function saneaDatos(d: DatosProductoPop) {
  const modo = normalizaModo(d.modo);
  if (modo === "lineal") {
    return {
      nombre: d.nombre || "Producto", categoria: d.categoria || "DTF", modo,
      escalas: "", precioLineal: Math.max(0, d.precioLineal),
      anchoCm: Math.max(0, Math.round(d.anchoCm)), minCm: Math.max(0, Math.round(d.minCm)),
      unidad: d.unidad || "metro",
    };
  }
  // escalas: re-serializa lo parseado para guardar limpio y ordenado.
  const escalas = parseEscalas(d.escalas).map((e) => `${e.desde}:${e.precio}`).join(",");
  return {
    nombre: d.nombre || "Producto", categoria: d.categoria || "Chapa", modo,
    escalas, precioLineal: 0, anchoCm: 0, minCm: 0, unidad: d.unidad || "unidad",
  };
}

export async function crearProductoPop(d: DatosProductoPop): Promise<{ ok: boolean; error?: string }> {
  const s = saneaDatos(d);
  if (s.modo === "escalas" && !s.escalas) return { ok: false, error: "Indica al menos un tramo (ej. 1:3.5,12:2.2)." };
  if (s.modo === "lineal" && s.precioLineal <= 0) return { ok: false, error: "Indica el precio por metro lineal." };
  try {
    await db.productoPop.create({
      data: { clave: d.nombre + "-" + Date.now().toString(36), ...s },
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ya existe un producto con esa clave." };
    }
    throw e;
  }
}

export async function editarProductoPop(id: string, d: DatosProductoPop): Promise<void> {
  await db.productoPop.update({ where: { id }, data: saneaDatos(d) });
}

export async function alternarProductoPop(id: string): Promise<void> {
  const p = await db.productoPop.findUnique({ where: { id }, select: { activo: true } });
  if (!p) return;
  await db.productoPop.update({ where: { id }, data: { activo: !p.activo } });
}
