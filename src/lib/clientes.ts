import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";

/** Datos editables de un cliente. */
export type DatosCliente = {
  nombre: string;
  rif?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  notas?: string | null;
};

export type ClienteSimple = { id: string; nombre: string };

export type ClienteContacto = {
  nombre: string; rif: string | null; telefono: string | null;
  email: string | null; direccion: string | null;
};

/** Datos de contacto de un cliente, para la cotización imprimible. */
export async function obtenerClienteContacto(id: string): Promise<ClienteContacto | null> {
  return db.cliente.findUnique({
    where: { id },
    select: { nombre: true, rif: true, telefono: true, email: true, direccion: true },
  });
}

/** Lista corta para selectores (solo activos). */
export async function listarClientesSimple(): Promise<ClienteSimple[]> {
  return db.cliente.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });
}

export type ClienteFila = {
  id: string;
  nombre: string;
  rif: string | null;
  telefono: string | null;
  activo: boolean;
  cotizaciones: number;
};

export async function listarClientes(q?: string): Promise<ClienteFila[]> {
  const where: Prisma.ClienteWhereInput = {};
  const t = q?.trim();
  if (t) {
    where.OR = [
      { nombre: { contains: t, mode: "insensitive" } },
      { rif: { contains: t, mode: "insensitive" } },
      { contacto: { contains: t, mode: "insensitive" } },
    ];
  }

  const filas = await db.cliente.findMany({
    where,
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    select: {
      id: true, nombre: true, rif: true, telefono: true, activo: true,
      _count: { select: { cotizaciones: true } },
    },
  });

  return filas.map((c) => ({
    id: c.id, nombre: c.nombre, rif: c.rif, telefono: c.telefono,
    activo: c.activo, cotizaciones: c._count.cotizaciones,
  }));
}

export async function crearCliente(d: DatosCliente): Promise<string> {
  const c = await db.cliente.create({ data: normalizar(d), select: { id: true } });
  return c.id;
}

export async function editarCliente(id: string, d: DatosCliente): Promise<void> {
  await db.cliente.update({ where: { id }, data: normalizar(d) });
}

export async function alternarActivoCliente(id: string): Promise<void> {
  const c = await db.cliente.findUnique({ where: { id }, select: { activo: true } });
  if (!c) return;
  await db.cliente.update({ where: { id }, data: { activo: !c.activo } });
}

/**
 * Borrado inteligente: solo se elimina un cliente SIN historia (sin cotizaciones
 * ni trabajos). Si tiene histórico, se desactiva, no se borra.
 */
export async function eliminarCliente(id: string): Promise<{ ok: boolean; error?: string }> {
  const c = await db.cliente.findUnique({
    where: { id },
    select: { _count: { select: { cotizaciones: true, trabajos: true } } },
  });
  if (!c) return { ok: false, error: "El cliente no existe." };
  if (c._count.cotizaciones > 0 || c._count.trabajos > 0) {
    return { ok: false, error: "Tiene histórico; desactívalo en vez de borrarlo." };
  }
  await db.cliente.delete({ where: { id } });
  return { ok: true };
}

function normalizar(d: DatosCliente) {
  const limpio = (v: string | null | undefined) => {
    const s = (v ?? "").trim();
    return s === "" ? null : s;
  };
  return {
    nombre: d.nombre.trim(),
    rif: limpio(d.rif),
    contacto: limpio(d.contacto),
    telefono: limpio(d.telefono),
    email: limpio(d.email),
    direccion: limpio(d.direccion),
    notas: limpio(d.notas),
  };
}

/** Ficha del cliente con su histórico. */
export type FichaCliente = {
  id: string;
  nombre: string;
  rif: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
  cotizaciones: {
    id: string; numero: number; creadaEn: Date; titulo: string;
    estado: string; cantidad: number; precioUnit: number; ventaTotal: number;
  }[];
  trabajos: {
    id: string; nombre: string; tamano: string; ancho: number; alto: number;
    papelNombre: string | null; creadoEn: Date;
  }[];
};

export async function obtenerFichaCliente(id: string): Promise<FichaCliente | null> {
  const c = await db.cliente.findUnique({
    where: { id },
    include: {
      cotizaciones: {
        orderBy: { creadaEn: "desc" },
        select: {
          id: true, numero: true, creadaEn: true, titulo: true, estado: true,
          cantidad: true, precioUnit: true, ventaTotal: true,
        },
      },
      trabajos: {
        where: { archivado: false },
        orderBy: { creadoEn: "desc" },
        include: { papel: { select: { nombre: true } } },
      },
    },
  });
  if (!c) return null;

  return {
    id: c.id, nombre: c.nombre, rif: c.rif, contacto: c.contacto,
    telefono: c.telefono, email: c.email, direccion: c.direccion,
    notas: c.notas, activo: c.activo,
    cotizaciones: c.cotizaciones.map((q) => ({
      id: q.id, numero: q.numero, creadaEn: q.creadaEn, titulo: q.titulo,
      estado: q.estado, cantidad: q.cantidad,
      precioUnit: Number(q.precioUnit), ventaTotal: Number(q.ventaTotal),
    })),
    trabajos: c.trabajos.map((t) => ({
      id: t.id, nombre: t.nombre, tamano: t.tamano, ancho: t.ancho, alto: t.alto,
      papelNombre: t.papel?.nombre ?? null, creadoEn: t.creadoEn,
    })),
  };
}
