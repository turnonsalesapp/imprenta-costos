/**
 * Reglas de rol, puras (sin base de datos ni cookies) para poder importarlas
 * desde cualquier lado —servidor o cliente— sin arrastrar dependencias.
 *
 * La regla de oro de la Fase 2 vive aquí: `puedeVerPrecios`. Todo lo que
 * muestre o devuelva un precio, costo o margen tiene que pasar por esta función
 * en el servidor. El rol TALLER nunca la pasa.
 */
import type { Rol, TipoCotizacion } from "@prisma/client";

/** ADMIN y VENDEDOR ven precios; TALLER jamás. */
export function puedeVerPrecios(rol: Rol): boolean {
  return rol !== "TALLER";
}

/**
 * ¿Ve la ESTRUCTURA de costos (costo, margen y desglose), no solo el precio?
 * Se define por usuario (`verEstructura`), independiente del rol. Requiere además
 * ver precios (TALLER nunca). `verEstructura` ausente = true (comportamiento
 * histórico). Todo lo que muestre costo/margen/desglose en el servidor pasa por aquí.
 */
export function puedeVerEstructura(u: { rol: Rol; verEstructura?: boolean }): boolean {
  return puedeVerPrecios(u.rol) && u.verEstructura !== false;
}

/** SUPERADMIN es el techo: además de administrar, purga la bitácora. */
export function esSuperAdmin(rol: Rol): boolean {
  return rol === "SUPERADMIN";
}

/** SUPERADMIN es superconjunto de ADMIN: todo lo que puede un ADMIN, lo puede
 *  también un SUPERADMIN. Toda comprobación de «es administrador» pasa por aquí. */
export function esAdmin(rol: Rol): boolean {
  return rol === "ADMIN" || rol === "SUPERADMIN";
}

/** ADMIN (y SUPERADMIN) editan variables, papeles y usuarios. VENDEDOR y TALLER no. */
export function puedeAdministrar(rol: Rol): boolean {
  return esAdmin(rol);
}

export const ETIQUETA_ROL: Record<Rol, string> = {
  SUPERADMIN: "Superadministrador",
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  TALLER: "Taller",
};

export const DESCRIPCION_ROL: Record<Rol, string> = {
  SUPERADMIN: "Todo lo del administrador y, además, purga la bitácora por rango de fechas.",
  ADMIN: "Ve costos y márgenes, edita variables, papeles y usuarios.",
  VENDEDOR: "Cotiza y ve precios. No toca las variables del negocio.",
  TALLER: "Solo órdenes de producción. Sin precios ni costos.",
};

export const ROLES: Rol[] = ["SUPERADMIN", "ADMIN", "VENDEDOR", "TALLER"];

/**
 * Roles que un usuario puede ASIGNAR a otros. Solo un SUPERADMIN puede otorgar o
 * quitar el rol SUPERADMIN; un ADMIN gestiona ADMIN/VENDEDOR/TALLER pero no puede
 * crear superadministradores ni escalar a ese nivel.
 */
export function rolesAsignables(actorRol: Rol): Rol[] {
  return esSuperAdmin(actorRol) ? ROLES : ROLES.filter((r) => r !== "SUPERADMIN");
}

/* ─────────────────── permisos de cotización (por usuario) ─────────────────── */

/** Tipos de ítem cotizables (MIXTA es un contenedor, no un tipo que se elige). */
export const TIPOS_COTIZACION: TipoCotizacion[] = [
  "PROPIA", "OFFSET", "PROVEEDOR", "GRAN_FORMATO", "PERSONALIZADO",
];

export const ETIQUETA_TIPO_COTIZACION: Record<string, string> = {
  PROPIA: "Digital", OFFSET: "Offset", PROVEEDOR: "Proveedor",
  GRAN_FORMATO: "Gran formato", PERSONALIZADO: "Personalizado", MIXTA: "Mixta",
};

/** Lo mínimo que necesitan las funciones de permiso (subconjunto de Sesion/Usuario). */
export type PermisosUsuario = {
  rol: Rol;
  puedeCotizar: boolean;
  tiposCotizar: string[];
  puedeEliminar: boolean;
};

/**
 * Tipos de ítem que el usuario puede cotizar.
 *   ADMIN  → todos siempre.
 *   TALLER → ninguno (no ve precios).
 *   VENDEDOR → si `puedeCotizar`; lista `tiposCotizar` (vacía = todos).
 */
export function tiposQuePuedeCotizar(u: PermisosUsuario): TipoCotizacion[] {
  if (u.rol === "TALLER") return [];
  if (esAdmin(u.rol)) return TIPOS_COTIZACION;
  if (!u.puedeCotizar) return [];
  return u.tiposCotizar.length
    ? TIPOS_COTIZACION.filter((t) => u.tiposCotizar.includes(t))
    : TIPOS_COTIZACION;
}

export function puedeCotizarTipo(u: PermisosUsuario, tipo: TipoCotizacion): boolean {
  return tiposQuePuedeCotizar(u).includes(tipo);
}

/** ¿Puede cotizar algo (al menos un tipo)? */
export function puedeCotizar(u: PermisosUsuario): boolean {
  return tiposQuePuedeCotizar(u).length > 0;
}

/** ¿Puede eliminar cotizaciones? ADMIN/SUPERADMIN siempre; VENDEDOR si tiene el permiso. */
export function puedeEliminarCotizaciones(u: PermisosUsuario): boolean {
  return esAdmin(u.rol) || (u.rol !== "TALLER" && u.puedeEliminar);
}

/* ─────────────────── hilo del trabajo (comentarios/adjuntos) ─────────────────── */

/**
 * ¿Puede borrar un elemento del hilo (comentario o adjunto)? Solo su autor o un
 * ADMIN. Pura, sin base ni sesión, para poder probarla y reusarla. `autorId`
 * null (autor desconocido/borrado) solo lo puede borrar ADMIN.
 */
export function puedeBorrarDelHilo(
  u: { id: string; rol: Rol },
  autorId: string | null,
): boolean {
  return esAdmin(u.rol) || (autorId != null && autorId === u.id);
}
