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

export const COOKIE = "imp_sesion";
export const SESION_DIAS = 7;

export type TokenPayload = {
  /** token aleatorio que identifica la fila de `Sesion`. */
  sid: string;
  /** rol, para que el middleware decida sin tocar la base. */
  rol: string;
};

function clave(): Uint8Array {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto) {
    // En producción AUTH_SECRET siempre está; este fallback solo evita que un
    // arranque mal configurado reviente con un error opaco.
    throw new Error("Falta AUTH_SECRET en el entorno.");
  }
  return new TextEncoder().encode(secreto);
}

export async function firmarToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESION_DIAS}d`)
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
