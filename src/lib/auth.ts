import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { Rol } from "@prisma/client";
import { db } from "./db";
import { COOKIE, SESION_DIAS, firmarToken, verificarToken } from "./jwt";

/**
 * Autenticación y sesiones, del lado del servidor.
 *
 * `getUsuario()` es la fuente de verdad: no confía solo en el token firmado,
 * sino que comprueba contra la tabla `Sesion` que la sesión exista, no esté
 * vencida y que el usuario siga activo. Así "cerrar sesión" o desactivar a
 * alguien surte efecto de inmediato aunque su token aún no haya expirado.
 */

export type Sesion = {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
};

const MS_SESION = SESION_DIAS * 24 * 60 * 60 * 1000;

/** Usuario de la petición actual, o `null` si no hay sesión válida. */
export async function getUsuario(): Promise<Sesion | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const payload = await verificarToken(token);
  if (!payload) return null;

  const sesion = await db.sesion.findUnique({
    where: { token: payload.sid },
    include: { usuario: true },
  });
  if (!sesion) return null;

  if (sesion.expiraEn.getTime() < Date.now()) {
    await db.sesion.delete({ where: { id: sesion.id } }).catch(() => {});
    return null;
  }

  const u = sesion.usuario;
  if (!u.activo) return null;

  return { id: u.id, email: u.email, nombre: u.nombre, rol: u.rol };
}

/** Igual que `getUsuario` pero redirige a /login si no hay sesión. Para páginas. */
export async function requireUsuario(): Promise<Sesion> {
  const u = await getUsuario();
  if (!u) redirect("/login");
  return u;
}

/** Exige uno de los roles dados; si no, manda al inicio. Para páginas. */
export async function requireRol(...roles: Rol[]): Promise<Sesion> {
  const u = await requireUsuario();
  if (!roles.includes(u.rol)) redirect("/");
  return u;
}

/**
 * Verifica credenciales y abre sesión (crea la fila `Sesion` y pone la cookie).
 * No revela si falló el email o la clave: siempre el mismo mensaje.
 */
export async function iniciarSesion(
  email: string,
  clave: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const correo = email.trim().toLowerCase();
  const u = await db.usuario.findUnique({ where: { email: correo } });

  // Se compara igual aunque el usuario no exista o esté inactivo, para no
  // filtrar por tiempo de respuesta cuáles correos están registrados. El
  // señuelo es un hash bcrypt VÁLIDO (de una clave al azar) para que `compare`
  // haga el trabajo real y devuelva false, en vez de fallar por formato.
  const SEÑUELO = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
  const claveOk = await bcrypt.compare(clave, u?.passwordHash ?? SEÑUELO);

  if (!u || !u.activo || !claveOk) {
    return { ok: false, error: "Correo o clave incorrectos." };
  }

  const token = randomBytes(32).toString("base64url");
  const expiraEn = new Date(Date.now() + MS_SESION);
  await db.sesion.create({ data: { usuarioId: u.id, token, expiraEn } });

  const jwt = await firmarToken({ sid: token, rol: u.rol });
  (await cookies()).set(COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MS_SESION / 1000,
  });

  return { ok: true };
}

/** Cierra la sesión actual: borra su fila `Sesion` y limpia la cookie. */
export async function cerrarSesion(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const payload = await verificarToken(token);
    if (payload) await db.sesion.deleteMany({ where: { token: payload.sid } });
  }
  jar.delete(COOKIE);
}
