import "server-only";
import { db } from "./db";

/**
 * Proveedores y listas de precios de papel (Fase 3). Se pueden cargar varias
 * listas y comparar; cada papel tiene un proveedor preferido (o el global
 * `predeterminado`), cuyo precio se copia a Papel.precio (precio EFECTIVO) para
 * que el motor de cálculo no cambie.
 */

export const UNIDADES = ["resma", "hoja", "millar"] as const;
export type UnidadPrecio = (typeof UNIDADES)[number];

export const ETIQUETA_UNIDAD: Record<UnidadPrecio, string> = {
  resma: "Resma completa",
  hoja: "Por hoja",
  millar: "Por millar",
};

/**
 * Normaliza un precio a precio de RESMA completa. `hojas` = hojas por resma.
 * Puro y testeable. Es lo que hace comparables las listas entre proveedores.
 */
export function precioAResma(precio: number, unidad: string, hojas: number): number {
  const h = hojas > 0 ? hojas : 1;
  if (unidad === "hoja") return precio * h;
  if (unidad === "millar") return (precio / 1000) * h;
  return precio; // "resma" o desconocido
}

const num = (v: unknown): number => (v == null ? 0 : Number(v));

// ─────────────────────────── proveedores ───────────────────────────

export type ProveedorFila = {
  id: string;
  nombre: string;
  moneda: string;
  contacto: string | null;
  notas: string | null;
  predeterminado: boolean;
  activo: boolean;
  nPrecios: number;
};

export async function listarProveedores(): Promise<ProveedorFila[]> {
  const filas = await db.proveedor.findMany({
    orderBy: [{ predeterminado: "desc" }, { nombre: "asc" }],
    select: {
      id: true, nombre: true, moneda: true, contacto: true, notas: true,
      predeterminado: true, activo: true, _count: { select: { precios: true } },
    },
  });
  return filas.map((p) => ({
    id: p.id, nombre: p.nombre, moneda: p.moneda, contacto: p.contacto,
    notas: p.notas, predeterminado: p.predeterminado, activo: p.activo,
    nPrecios: p._count.precios,
  }));
}

export async function crearProveedor(data: {
  nombre: string; moneda?: string; contacto?: string | null; notas?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const nombre = data.nombre?.trim();
  if (!nombre) return { ok: false, error: "El nombre del proveedor es obligatorio." };
  const existe = await db.proveedor.findUnique({ where: { nombre }, select: { id: true } });
  if (existe) return { ok: false, error: "Ya existe un proveedor con ese nombre." };
  const p = await db.proveedor.create({
    data: {
      nombre,
      moneda: data.moneda?.trim() || "USD",
      contacto: data.contacto?.trim() || null,
      notas: data.notas?.trim() || null,
    },
    select: { id: true },
  });
  return { ok: true, id: p.id };
}

/** Marca un proveedor como el predeterminado global (desmarca los demás). */
export async function marcarPredeterminado(id: string): Promise<void> {
  await db.$transaction([
    db.proveedor.updateMany({ data: { predeterminado: false }, where: { predeterminado: true } }),
    db.proveedor.update({ where: { id }, data: { predeterminado: true } }),
  ]);
}

export async function eliminarProveedor(id: string): Promise<{ ok: boolean; error?: string }> {
  const p = await db.proveedor.findUnique({
    where: { id }, select: { predeterminado: true },
  });
  if (!p) return { ok: false, error: "El proveedor no existe." };
  if (p.predeterminado) return { ok: false, error: "No se puede borrar el proveedor predeterminado." };
  await db.proveedor.delete({ where: { id } });
  return { ok: true };
}

// ─────────────────────────── comparador ───────────────────────────

export type PrecioComparado = {
  proveedorId: string;
  proveedorNombre: string;
  precio: number;       // en su unidad original
  unidad: string;
  precioResma: number;  // normalizado, para comparar
  esPreferido: boolean;
  esMasBarato: boolean;
  vigenteDesde: Date;
};

export type ComparadorPapel = {
  papelId: string;
  clave: string;
  nombre: string;
  hojas: number;
  precioEfectivo: number;      // Papel.precio actual (resma)
  preferidoId: string | null;
  precios: PrecioComparado[];
  ahorroMasBarato: number;     // cuánto se ahorra el más barato vs el efectivo (>=0)
};

/** Comparador: por cada papel, todas las listas de proveedores normalizadas. */
export async function comparadorPapeles(): Promise<ComparadorPapel[]> {
  const papeles = await db.papel.findMany({
    where: { activo: true },
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    select: {
      id: true, clave: true, nombre: true, hojas: true, precio: true,
      proveedorPreferidoId: true,
      preciosProveedor: {
        select: {
          proveedorId: true, precio: true, unidad: true, hojas: true, vigenteDesde: true,
          proveedor: { select: { nombre: true } },
        },
      },
    },
  });

  return papeles.map((p) => {
    const efectivo = num(p.precio);
    const precios = p.preciosProveedor.map((pr) => ({
      proveedorId: pr.proveedorId,
      proveedorNombre: pr.proveedor.nombre,
      precio: num(pr.precio),
      unidad: pr.unidad,
      precioResma: precioAResma(num(pr.precio), pr.unidad, pr.hojas ?? p.hojas),
      esPreferido: pr.proveedorId === p.proveedorPreferidoId,
      esMasBarato: false,
      vigenteDesde: pr.vigenteDesde,
    }));
    // Marca el más barato (si hay al menos uno).
    let min = Infinity;
    for (const pr of precios) if (pr.precioResma < min) min = pr.precioResma;
    for (const pr of precios) pr.esMasBarato = precios.length > 1 && pr.precioResma === min;
    const ahorro = precios.length && isFinite(min) ? Math.max(0, efectivo - min) : 0;
    return {
      papelId: p.id, clave: p.clave, nombre: p.nombre, hojas: p.hojas,
      precioEfectivo: efectivo, preferidoId: p.proveedorPreferidoId,
      precios: precios.sort((a, b) => a.precioResma - b.precioResma),
      ahorroMasBarato: ahorro,
    };
  });
}

/** Fija el proveedor preferido de un papel y copia su precio al precio efectivo. */
export async function fijarPreferido(papelId: string, proveedorId: string): Promise<void> {
  const pr = await db.precioProveedorPapel.findUnique({
    where: { papelId_proveedorId: { papelId, proveedorId } },
    select: { precio: true, unidad: true, hojas: true },
  });
  if (!pr) return;
  const papel = await db.papel.findUnique({ where: { id: papelId }, select: { hojas: true } });
  const resma = precioAResma(num(pr.precio), pr.unidad, pr.hojas ?? papel?.hojas ?? 0);
  await db.papel.update({
    where: { id: papelId },
    data: { proveedorPreferidoId: proveedorId, precio: resma },
  });
}

// ─────────────────────────── importación ───────────────────────────

/** Una fila cruda de la lista de precios (de Excel/CSV). */
export type FilaImport = {
  clave?: string;
  nombre?: string;
  medida?: string;
  hojas?: number;
  precio?: number;
  unidad?: string;
};

export type DiffFila = {
  clave: string;
  nombre: string;
  estado: "sube" | "baja" | "igual" | "nuevo" | "sin_papel";
  precioResma: number;
  anterior: number | null;
};

type PapelRef = { id: string; clave: string; nombre: string; hojas: number };

/**
 * Construye el diff de una importación contra el catálogo y los precios actuales
 * del proveedor. Puro y testeable: no toca la base. Empareja por `clave`.
 */
export function construirDiff(
  filas: FilaImport[],
  papeles: PapelRef[],
  preciosActuales: Map<string, number>, // papelId -> precioResma actual de ESTE proveedor
): DiffFila[] {
  const porClave = new Map(papeles.map((p) => [p.clave.trim().toLowerCase(), p]));
  const out: DiffFila[] = [];
  for (const f of filas) {
    const clave = (f.clave ?? "").trim();
    const precio = Number(f.precio ?? NaN);
    if (!clave || !isFinite(precio)) continue;
    const papel = porClave.get(clave.toLowerCase());
    if (!papel) {
      out.push({ clave, nombre: f.nombre ?? clave, estado: "sin_papel", precioResma: 0, anterior: null });
      continue;
    }
    const hojas = Number(f.hojas ?? papel.hojas) || papel.hojas;
    const resma = precioAResma(precio, f.unidad ?? "resma", hojas);
    const anterior = preciosActuales.get(papel.id) ?? null;
    const estado: DiffFila["estado"] =
      anterior == null ? "nuevo"
      : Math.abs(anterior - resma) < 1e-6 ? "igual"
      : resma > anterior ? "sube" : "baja";
    out.push({ clave: papel.clave, nombre: papel.nombre, estado, precioResma: resma, anterior });
  }
  return out;
}

export type ResultadoImport = {
  ok: boolean;
  error?: string;
  aplicados: number;
  sinPapel: string[];
};

/**
 * Aplica una lista de precios de un proveedor: upsert de PrecioProveedorPapel por
 * papel (emparejado por clave) y, si el proveedor es el preferido de ese papel
 * (o el global predeterminado y el papel no tiene preferido), actualiza el precio
 * efectivo (Papel.precio) para que el motor cotice con la lista nueva.
 */
export async function importarLista(
  proveedorId: string, filas: FilaImport[],
): Promise<ResultadoImport> {
  const prov = await db.proveedor.findUnique({
    where: { id: proveedorId }, select: { id: true, predeterminado: true },
  });
  if (!prov) return { ok: false, error: "El proveedor no existe.", aplicados: 0, sinPapel: [] };

  const papeles = await db.papel.findMany({
    select: { id: true, clave: true, hojas: true, proveedorPreferidoId: true },
  });
  const porClave = new Map(papeles.map((p) => [p.clave.trim().toLowerCase(), p]));

  let aplicados = 0;
  const sinPapel: string[] = [];
  for (const f of filas) {
    const clave = (f.clave ?? "").trim();
    const precio = Number(f.precio ?? NaN);
    if (!clave || !isFinite(precio)) continue;
    const papel = porClave.get(clave.toLowerCase());
    if (!papel) { sinPapel.push(clave); continue; }

    const unidad = (f.unidad ?? "resma").trim() || "resma";
    const hojas = Number(f.hojas ?? papel.hojas) || papel.hojas;

    await db.precioProveedorPapel.upsert({
      where: { papelId_proveedorId: { papelId: papel.id, proveedorId } },
      create: {
        papelId: papel.id, proveedorId, precio, unidad, hojas,
        medida: f.medida?.trim() || null, vigenteDesde: new Date(),
      },
      update: { precio, unidad, hojas, medida: f.medida?.trim() || null, vigenteDesde: new Date() },
    });

    // Actualiza el precio efectivo si este proveedor manda para el papel.
    const mandaEste =
      papel.proveedorPreferidoId === proveedorId ||
      (prov.predeterminado && papel.proveedorPreferidoId == null);
    if (mandaEste) {
      const resma = precioAResma(precio, unidad, hojas);
      await db.papel.update({
        where: { id: papel.id },
        data: {
          precio: resma,
          proveedorPreferidoId: papel.proveedorPreferidoId ?? proveedorId,
        },
      });
    }
    aplicados++;
  }
  return { ok: true, aplicados, sinPapel };
}
