"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type Rol } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRol } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { registrarAuditoria } from "@/lib/auditoria";

export type EstadoCrear = { error: string | null; ok: boolean };

const esquemaCrear = z.object({
  nombre: z.string().trim().min(1, "El nombre no puede ir vacío."),
  email: z.string().trim().toLowerCase().email("Ese correo no es válido."),
  clave: z.string().min(6, "La clave debe tener al menos 6 caracteres."),
  rol: z.enum(["ADMIN", "VENDEDOR", "TALLER"]),
});

export async function crearUsuario(
  _prev: EstadoCrear,
  formData: FormData,
): Promise<EstadoCrear> {
  await requireRol("ADMIN");

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
  try {
    await db.usuario.create({
      data: { nombre, email, rol, passwordHash: await bcrypt.hash(clave, 10) },
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
  const rol = String(formData.get("rol") ?? "");
  if (!ROLES.includes(rol as Rol)) return;

  // Un admin no puede quitarse a sí mismo el rol de admin y quedar sin acceso.
  if (id === admin.id && rol !== "ADMIN") return;

  await db.usuario.update({ where: { id }, data: { rol: rol as Rol } });
  await registrarAuditoria({
    actorId: admin.id, actorNombre: admin.nombre,
    accion: "usuario.rol", entidad: id, detalle: `Rol → ${rol}`,
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
  await registrarAuditoria({
    actorId: admin.id, actorNombre: admin.nombre,
    accion: "usuario.interpretarIA", entidad: id,
    detalle: `Interpretar IA → ${interpretarIA === null ? "según el sistema" : interpretarIA ? "activado" : "desactivado"}`,
  });
  revalidatePath("/usuarios");
}

export async function alternarActivo(formData: FormData): Promise<void> {
  const admin = await requireRol("ADMIN");

  const id = String(formData.get("id") ?? "");
  // Nadie se desactiva a sí mismo (evita quedar fuera del sistema).
  if (id === admin.id) return;

  const u = await db.usuario.findUnique({ where: { id }, select: { activo: true } });
  if (!u) return;

  await db.usuario.update({ where: { id }, data: { activo: !u.activo } });

  // Al desactivar, cortamos sus sesiones abiertas de una vez.
  if (u.activo) await db.sesion.deleteMany({ where: { usuarioId: id } });

  await registrarAuditoria({
    actorId: admin.id, actorNombre: admin.nombre,
    accion: "usuario.activo", entidad: id, detalle: u.activo ? "Desactivado" : "Activado",
  });
  revalidatePath("/usuarios");
}
