"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type Rol } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { ROLES, TIPOS_COTIZACION, esAdmin, esSuperAdmin, rolesAsignables } from "@/lib/roles";
import { registrar } from "@/lib/auditoria";

export type EstadoCrear = { error: string | null; ok: boolean };

const esquemaCrear = z.object({
  nombre: z.string().trim().min(1, "El nombre no puede ir vacío."),
  email: z.string().trim().toLowerCase().email("Ese correo no es válido."),
  clave: z.string().min(6, "La clave debe tener al menos 6 caracteres."),
  rol: z.enum(["SUPERADMIN", "ADMIN", "VENDEDOR", "TALLER"]),
});

export async function crearUsuario(
  _prev: EstadoCrear,
  formData: FormData,
): Promise<EstadoCrear> {
  const admin = await requireRol("ADMIN");

  const parsed = esquemaCrear.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    clave: formData.get("clave"),
    rol: formData.get("rol"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { nombre, email, clave, rol } = parsed.data;
  // Solo un SUPERADMIN puede crear otro SUPERADMIN (evita escalada de un ADMIN).
  if (!rolesAsignables(admin.rol).includes(rol)) {
    return { ok: false, error: "No puedes asignar ese rol." };
  }
  try {
    await db.usuario.create({
      data: { nombre, email, rol, passwordHash: await bcrypt.hash(clave, 12) },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ya existe un usuario con ese correo." };
    }
    throw e;
  }

  revalidatePath("/usuarios");
  return { ok: true, error: null };
}

export async function cambiarRol(formData: FormData): Promise<void> {
  const admin = await requireRol("ADMIN");

  const id = String(formData.get("id") ?? "");
  const nuevo = String(formData.get("rol") ?? "") as Rol;
  if (!ROLES.includes(nuevo)) return;

  // Un admin no puede quitarse a sí mismo el poder de administrar y quedar sin
  // acceso (vale para ADMIN y SUPERADMIN).
  if (id === admin.id && !esAdmin(nuevo)) return;

  // Solo un SUPERADMIN puede otorgar SUPERADMIN, o cambiarle el rol a alguien que
  // ya es SUPERADMIN. Un ADMIN no toca superadministradores ni escala a ese nivel.
  const objetivo = await db.usuario.findUnique({ where: { id }, select: { rol: true } });
  if (!objetivo) return;
  if (!esSuperAdmin(admin.rol) && (nuevo === "SUPERADMIN" || objetivo.rol === "SUPERADMIN")) return;

  await db.usuario.update({ where: { id }, data: { rol: nuevo } });
  await registrar({
    actorId: admin.id, actorNombre: admin.nombre,
    accion: "usuario.rol", entidad: id, detalle: `Rol → ${nuevo}`,
  });
  revalidatePath("/usuarios");
}

/**
 * Ajusta el intérprete de IA para un usuario concreto: "heredar" (sigue al
 * sistema), "si" (siempre activo) o "no" (siempre apagado).
 */
export async function cambiarInterpretar(formData: FormData): Promise<void> {
  const admin = await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  const v = String(formData.get("valor") ?? "");
  if (!id) return;
  const interpretarIA = v === "si" ? true : v === "no" ? false : null;
  await db.usuario.update({ where: { id }, data: { interpretarIA } });
  await registrar({
    actorId: admin.id, actorNombre: admin.nombre,
    accion: "usuario.interpretarIA", entidad: id,
    detalle: `Interpretar IA → ${interpretarIA === null ? "según el sistema" : interpretarIA ? "activado" : "desactivado"}`,
  });
  revalidatePath("/usuarios");
}

/**
 * Ajusta los permisos de cotización de un usuario: qué tipos puede cotizar y si
 * puede eliminar. Si no marca ningún tipo, no puede cotizar. (El ADMIN no se
 * toca: siempre puede todo.)
 */
export async function cambiarPermisos(formData: FormData): Promise<void> {
  const admin = await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const u = await db.usuario.findUnique({ where: { id }, select: { rol: true } });
  if (!u || esAdmin(u.rol)) return; // ADMIN/SUPERADMIN siempre pueden todo; no se configura

  const tipos = formData.getAll("tipos").map(String).filter((t) => TIPOS_COTIZACION.includes(t as never));
  const puedeEliminar = formData.get("eliminar") === "on";
  const puedeCotizar = tipos.length > 0;

  await db.usuario.update({
    where: { id },
    data: { puedeCotizar, tiposCotizar: tipos, puedeEliminar },
  });
  await registrar({
    actorId: admin.id, actorNombre: admin.nombre,
    accion: "usuario.permisos", entidad: id,
    detalle: `Cotizar: ${puedeCotizar ? (tipos.join(", ") || "todos") : "ninguno"} · Eliminar: ${puedeEliminar ? "sí" : "no"}`,
  });
  revalidatePath("/usuarios");
}

/** Define si un usuario ve la estructura de costos (no solo el precio). Cualquier
 *  rol; se define por usuario. */
export async function cambiarEstructura(formData: FormData): Promise<void> {
  const admin = await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const verEstructura = formData.get("ver") === "on";
  await db.usuario.update({ where: { id }, data: { verEstructura } });
  await registrar({
    actorId: admin.id, actorNombre: admin.nombre,
    accion: "usuario.estructura", entidad: id,
    detalle: `Ver estructura de costos: ${verEstructura ? "sí" : "no (solo precio)"}`,
  });
  revalidatePath("/usuarios");
}

export async function alternarActivo(formData: FormData): Promise<void> {
  const admin = await requireRol("ADMIN");

  const id = String(formData.get("id") ?? "");
  // Nadie se desactiva a sí mismo (evita quedar fuera del sistema).
  if (id === admin.id) return;

  const u = await db.usuario.findUnique({ where: { id }, select: { activo: true, rol: true } });
  if (!u) return;
  // Un ADMIN no puede desactivar a un SUPERADMIN; solo otro SUPERADMIN.
  if (esSuperAdmin(u.rol) && !esSuperAdmin(admin.rol)) return;

  await db.usuario.update({ where: { id }, data: { activo: !u.activo } });

  // Al desactivar, cortamos sus sesiones abiertas de una vez.
  if (u.activo) await db.sesion.deleteMany({ where: { usuarioId: id } });

  await registrar({
    actorId: admin.id, actorNombre: admin.nombre,
    accion: "usuario.activo", entidad: id, detalle: u.activo ? "Desactivado" : "Activado",
  });
  revalidatePath("/usuarios");
}
