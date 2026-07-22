/**
 * Firma y verificación del token de sesión con `jose`.
 *
 * Este módulo es deliberadamente "edge-safe": solo depende de `jose`, sin
 * Prisma ni `next/headers`. Así el middleware —que corre en el runtime Edge—
 * puede importarlo para verificar la firma sin arrastrar la base de datos.
 *
 * La verdad de fondo (que la sesión no fue revocada y el usuario sigue activo)
 * se comprueba en el servidor con `getUsuario()` de `auth.ts`, contra la tabla
 * `Sesion`. Aquí solo validamos que el token esté firmado por nosotros y vigente.
 */
import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

export const COOKIE = "imp_sesion";
/** Ventana de INACTIVIDAD: la sesión en BD vence si no hay actividad en tantos días. */
export const SESION_DIAS = 7;
/** Vida del token/cookie firmado (proof). Más largo que la ventana de inactividad
 *  porque la BD es la autoridad real: una sesión inactiva se corta en BD aunque
 *  el token siga siendo válido. Permite deslizar la sesión sin re-emitir cookie. */
export const COOKIE_DIAS = 30;

export type TokenPayload = {
  /** token aleatorio que identifica la fila de `Sesion`. */
  sid: string;
  /** rol, para que el middleware decida sin tocar la base. */
  rol: string;
};

function clave(): Uint8Array {
  // `env.authSecret` lanza un error claro si falta AUTH_SECRET.
  return new TextEncoder().encode(env.authSecret);
}

export async function firmarToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_DIAS}d`)
    .sign(clave());
}

export async function verificarToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, clave());
    if (typeof payload.sid === "string" && typeof payload.rol === "string") {
      return { sid: payload.sid, rol: payload.rol };
    }
    return null;
  } catch {
    return null;
  }
}
