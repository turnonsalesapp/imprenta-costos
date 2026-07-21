import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";

/**
 * Variables del negocio, papeles y acabados (pantalla de ADMIN).
 *
 * Dos cosas importantes:
 *  - Cada vez que cambia una tasa (BCV / Binance) se registra una fila en `Tasa`,
 *    para saber con qué cambio se cotizó cada cosa.
 *  - Papeles y acabados NO se borran: se desactivan. Las cotizaciones viejas los
 *    siguen mostrando por su `snapshot`; desactivar solo los saca de la próxima
 *    cotización.
 */

const num = (v: unknown): number => (v == null ? 0 : Number(v));

/* ─────────────────────────── configuración ─────────────────────────── */

export type DatosConfig = {
  merma: number; margen: number; comision: number; ml: number;
  tasaBCV: number; binCompra: number; binVenta: number;
  pinza: number; sep: number; margenMin: number;
};

export async function obtenerConfig(): Promise<DatosConfig> {
  const c = await db.config.findUnique({ where: { id: "global" } });
  return {
    merma: num(c?.merma), margen: num(c?.margen), comision: num(c?.comision),
    ml: num(c?.ml), tasaBCV: num(c?.tasaBCV), binCompra: num(c?.binCompra),
    binVenta: num(c?.binVenta), pinza: num(c?.pinza), sep: num(c?.sep),
    margenMin: c ? num(c.margenMin) : 15,
  };
}

export type DatosMembrete = {
  empresaNombre: string | null;
  empresaRif: string | null;
  empresaTelefono: string | null;
  empresaDireccion: string | null;
};

export async function obtenerMembrete(): Promise<DatosMembrete> {
  const c = await db.config.findUnique({ where: { id: "global" } });
  return {
    empresaNombre: c?.empresaNombre ?? null,
    empresaRif: c?.empresaRif ?? null,
    empresaTelefono: c?.empresaTelefono ?? null,
    empresaDireccion: c?.empresaDireccion ?? null,
  };
}

export async function actualizarMembrete(d: DatosMembrete): Promise<void> {
  const limpio = (v: string | null) => (v && v.trim() ? v.trim() : null);
  await db.config.update({
    where: { id: "global" },
    data: {
      empresaNombre: limpio(d.empresaNombre),
      empresaRif: limpio(d.empresaRif),
      empresaTelefono: limpio(d.empresaTelefono),
      empresaDireccion: limpio(d.empresaDireccion),
    },
  });
}

export async function actualizarConfig(d: DatosConfig): Promise<void> {
  const actual = await db.config.findUnique({ where: { id: "global" } });

  await db.config.upsert({
    where: { id: "global" },
    update: d,
    create: { id: "global", ...d },
  });

  // Registrar la tasa si cambió alguna de las tres.
  const cambioTasa =
    !actual ||
    num(actual.tasaBCV) !== d.tasaBCV ||
    num(actual.binCompra) !== d.binCompra ||
    num(actual.binVenta) !== d.binVenta;
  if (cambioTasa) {
    await db.tasa.create({
      data: { bcv: d.tasaBCV, binCompra: d.binCompra, binVenta: d.binVenta },
    });
  }
}

export type FilaTasa = { fecha: Date; bcv: number; binCompra: number; binVenta: number };

export async function historicoTasas(limite = 10): Promise<FilaTasa[]> {
  const filas = await db.tasa.findMany({ orderBy: { fecha: "desc" }, take: limite });
  return filas.map((t) => ({
    fecha: t.fecha, bcv: num(t.bcv), binCompra: num(t.binCompra), binVenta: num(t.binVenta),
  }));
}

/* ───────────────────────────── papeles ───────────────────────────── */

export type PapelFila = {
  id: string; clave: string; nombre: string; medida: string;
  hojas: number; precio: number; activo: boolean;
};

export async function listarPapeles(): Promise<PapelFila[]> {
  const filas = await db.papel.findMany({ orderBy: [{ activo: "desc" }, { nombre: "asc" }] });
  return filas.map((p) => ({
    id: p.id, clave: p.clave, nombre: p.nombre, medida: p.medida,
    hojas: p.hojas, precio: num(p.precio), activo: p.activo,
  }));
}

export type DatosPapel = { nombre: string; medida: string; hojas: number; precio: number };

export async function crearPapel(d: DatosPapel): Promise<{ ok: boolean; error?: string }> {
  try {
    // La clave (estable, la usa el motor) arranca igual al nombre.
    await db.papel.create({ data: { ...d, clave: d.nombre } });
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ya existe un papel con ese nombre." };
    }
    throw e;
  }
}

export async function editarPapel(id: string, d: DatosPapel): Promise<void> {
  // No se toca la clave, para no romper la referencia del motor.
  await db.papel.update({ where: { id }, data: d });
}

export async function alternarPapel(id: string): Promise<void> {
  const p = await db.papel.findUnique({ where: { id }, select: { activo: true } });
  if (!p) return;
  await db.papel.update({ where: { id }, data: { activo: !p.activo } });
}

/* ───────────────────────────── acabados ───────────────────────────── */

export type AcabadoFila = {
  id: string; clave: string; label: string; costo: number;
  unidad: string; escala: string; orden: number; activo: boolean; grupo: string | null;
};

export async function listarAcabados(): Promise<AcabadoFila[]> {
  const filas = await db.acabado.findMany({ orderBy: [{ activo: "desc" }, { orden: "asc" }] });
  return filas.map((a) => ({
    id: a.id, clave: a.clave, label: a.label, costo: num(a.costo),
    unidad: a.unidad, escala: a.escala, orden: a.orden, activo: a.activo, grupo: a.grupo,
  }));
}

export type DatosAcabado = {
  label: string; costo: number; unidad: string; escala: string; orden: number;
  grupo?: string | null;
};

function slug(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "acabado";
}

export async function crearAcabado(d: DatosAcabado): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.acabado.create({ data: { ...d, clave: slug(d.label) + "-" + Date.now().toString(36) } });
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ese acabado ya existe." };
    }
    throw e;
  }
}

export async function editarAcabado(id: string, d: DatosAcabado): Promise<void> {
  await db.acabado.update({ where: { id }, data: d });
}

export async function alternarAcabado(id: string): Promise<void> {
  const a = await db.acabado.findUnique({ where: { id }, select: { activo: true } });
  if (!a) return;
  await db.acabado.update({ where: { id }, data: { activo: !a.activo } });
}
