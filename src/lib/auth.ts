import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { Rol } from "@prisma/client";
import { db } from "./db";
import { env } from "./env";
import { COOKIE, SESION_DIAS, COOKIE_DIAS, firmarToken, verificarToken } from "./jwt";

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

const DIA_MS = 24 * 60 * 60 * 1000;
/** Ventana de inactividad de la sesión en BD (se desliza con la actividad). */
const MS_INACTIVIDAD = SESION_DIAS * DIA_MS;
/** Vida de la cookie/token firmado. */
const MS_COOKIE = COOKIE_DIAS * DIA_MS;

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

  const ahora = Date.now();
  if (sesion.expiraEn.getTime() < ahora) {
    await db.sesion.delete({ where: { id: sesion.id } }).catch(() => {});
    return null;
  }

  const u = sesion.usuario;
  if (!u.activo) return null;

  // Sesión deslizante: si ya pasó de la mitad de su ventana, se extiende. Así el
  // usuario activo no se desconecta a mitad de trabajo, pero el inactivo caduca
  // ~SESION_DIAS después de su última actividad. Solo escribe una vez por medio
  // ciclo, no en cada request. (Escribir en BD sí se permite en un Server
  // Component; re-emitir la cookie no, por eso la cookie vive más — la BD manda.)
  if (sesion.expiraEn.getTime() - ahora < MS_INACTIVIDAD / 2) {
    await db.sesion
      .update({ where: { id: sesion.id }, data: { expiraEn: new Date(ahora + MS_INACTIVIDAD) } })
      .catch(() => {});
  }

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
  // Cost 12, igual que las claves reales, para que el tiempo no delate usuarios.
  const SEÑUELO = "$2a$12$nSxmROTkGQ1NUo6yYvyU.uCPV4Gmo5XnIwNsEQmeyknGkwRtO6lYu";
  const claveOk = await bcrypt.compare(clave, u?.passwordHash ?? SEÑUELO);

  if (!u || !u.activo || !claveOk) {
    return { ok: false, error: "Correo o clave incorrectos." };
  }

  const token = randomBytes(32).toString("base64url");
  const expiraEn = new Date(Date.now() + MS_INACTIVIDAD);
  await db.sesion.create({ data: { usuarioId: u.id, token, expiraEn } });

  const jwt = await firmarToken({ sid: token, rol: u.rol });
  (await cookies()).set(COOKIE, jwt, {
    httpOnly: true,
    secure: env.esProduccion,
    sameSite: "lax",
    path: "/",
    maxAge: MS_COOKIE / 1000,
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
