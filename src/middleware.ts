import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verificarToken } from "@/lib/jwt";

/**
 * Primera barrera de acceso. Verifica —barato, sin tocar la base— que la
 * petición traiga un token de sesión firmado y vigente. Es la red de seguridad;
 * la verdad de fondo (sesión no revocada, usuario activo, rol) la comprueba
 * `getUsuario()` en cada página o ruta con acceso a la base.
 *
 * Todo queda protegido salvo /login, el login mismo y el health check.
 *
 * IMPORTANTE — no redirigir /login → / desde aquí. El token firmado vive más que
 * la sesión en la base (COOKIE_DIAS 30 vs SESION_DIAS 7). Si expira la sesión
 * pero el token aún es válido, el middleware creería «logueado» y mandaría de
 * /login a /, mientras que la página / (que sí consulta la base con getUsuario)
 * rebota a /login: bucle de redirección infinito («sitio caído»). Por eso la
 * decisión de «ya está logueado» la toma SOLO la página /login vía getUsuario,
 * que es la fuente de verdad y sabe si la sesión sigue viva.
 */

const PAGINAS_PUBLICAS = new Set(["/login"]);

function esPublica(pathname: string): boolean {
  if (PAGINAS_PUBLICAS.has(pathname)) return true;
  if (pathname === "/api/health") return true;
  if (pathname === "/api/tasas/refresh") return true; // se protege con token propio
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE)?.value;
  const payload = token ? await verificarToken(token) : null;

  // Las públicas pasan siempre. Ojo: NO redirigir /login → / aquí (ver cabecera):
  // eso provoca el bucle si el token vive más que la sesión. La página /login
  // ya manda al inicio a quien tenga sesión REAL (getUsuario).
  if (esPublica(pathname)) {
    return NextResponse.next();
  }

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Todo menos los estáticos de Next y los archivos con extensión (imágenes, etc.).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|woff2?)$).*)",
  ],
};
