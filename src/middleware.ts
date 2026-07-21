import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verificarToken } from "@/lib/jwt";

/**
 * Primera barrera de acceso. Verifica —barato, sin tocar la base— que la
 * petición traiga un token de sesión firmado y vigente. Es la red de seguridad;
 * la verdad de fondo (sesión no revocada, usuario activo, rol) la comprueba
 * `getUsuario()` en cada página o ruta con acceso a la base.
 *
 * Todo queda protegido salvo /login, el login mismo y el health check.
 */

const PAGINAS_PUBLICAS = new Set(["/login"]);

function esPublica(pathname: string): boolean {
  if (PAGINAS_PUBLICAS.has(pathname)) return true;
  if (pathname === "/api/health") return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE)?.value;
  const payload = token ? await verificarToken(token) : null;

  if (esPublica(pathname)) {
    // Ya autenticado entrando a /login: mándalo al inicio.
    if (pathname === "/login" && payload) {
      return NextResponse.redirect(new URL("/", req.url));
    }
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
