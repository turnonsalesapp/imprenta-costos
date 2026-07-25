import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";

/**
 * Catálogo de PRODUCTOS TERMINADOS de gran formato (pendones, roll up, arañas,
 * estructuras). Costo FIJO por unidad, del proveedor tercerizado. Como los papeles
 * y materiales: no se borran, se desactivan; las cotizaciones viejas los siguen
 * mostrando por su snapshot congelado.
 */

const num = (v: unknown): number => (v == null ? 0 : Number(v));

/** Producto tal como lo consume la calculadora. */
export type ProductoGFItem = {
  id: string; clave: string; nombre: string; categoria: string; medida: string; costoUnit: number;
};

export async function listarProductosGF(): Promise<ProductoGFItem[]> {
  const filas = await db.productoGF.findMany({
    where: { activo: true },
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
  });
  return filas.map((p) => ({
    id: p.id, clave: p.clave, nombre: p.nombre, categoria: p.categoria,
    medida: p.medida, costoUnit: num(p.costoUnit),
  }));
}

/* ─────────────────────────── administración ─────────────────────────── */

export type ProductoGFFila = {
  id: string; clave: string; nombre: string; categoria: string;
  medida: string; costoUnit: number; activo: boolean;
};

export async function listarProductosGFAdmin(): Promise<ProductoGFFila[]> {
  const filas = await db.productoGF.findMany({ orderBy: [{ activo: "desc" }, { categoria: "asc" }, { nombre: "asc" }] });
  return filas.map((p) => ({
    id: p.id, clave: p.clave, nombre: p.nombre, categoria: p.categoria,
    medida: p.medida, costoUnit: num(p.costoUnit), activo: p.activo,
  }));
}

export type DatosProductoGF = {
  nombre: string; categoria: string; medida: string; costoUnit: number;
};

export async function crearProductoGF(d: DatosProductoGF): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.productoGF.create({
      data: {
        clave: d.nombre + "-" + Date.now().toString(36),
        nombre: d.nombre, categoria: d.categoria || "Pendón",
        medida: d.medida, costoUnit: d.costoUnit,
      },
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ya existe un producto con esa clave." };
    }
    throw e;
  }
}

export async function editarProductoGF(id: string, d: DatosProductoGF): Promise<void> {
  await db.productoGF.update({
    where: { id },
    data: {
      nombre: d.nombre || "Producto", categoria: d.categoria || "Pendón",
      medida: d.medida, costoUnit: d.costoUnit,
    },
  });
}

export async function alternarProductoGF(id: string): Promise<void> {
  const p = await db.productoGF.findUnique({ where: { id }, select: { activo: true } });
  if (!p) return;
  await db.productoGF.update({ where: { id }, data: { activo: !p.activo } });
}
