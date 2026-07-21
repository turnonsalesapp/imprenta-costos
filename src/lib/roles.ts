/**
 * Reglas de rol, puras (sin base de datos ni cookies) para poder importarlas
 * desde cualquier lado —servidor o cliente— sin arrastrar dependencias.
 *
 * La regla de oro de la Fase 2 vive aquí: `puedeVerPrecios`. Todo lo que
 * muestre o devuelva un precio, costo o margen tiene que pasar por esta función
 * en el servidor. El rol TALLER nunca la pasa.
 */
import type { Rol } from "@prisma/client";

/** ADMIN y VENDEDOR ven precios; TALLER jamás. */
export function puedeVerPrecios(rol: Rol): boolean {
  return rol !== "TALLER";
}

export function esAdmin(rol: Rol): boolean {
  return rol === "ADMIN";
}

/** ADMIN edita variables, papeles y usuarios. VENDEDOR y TALLER no. */
export function puedeAdministrar(rol: Rol): boolean {
  return rol === "ADMIN";
}

export const ETIQUETA_ROL: Record<Rol, string> = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  TALLER: "Taller",
};

export const DESCRIPCION_ROL: Record<Rol, string> = {
  ADMIN: "Ve costos y márgenes, edita variables, papeles y usuarios.",
  VENDEDOR: "Cotiza y ve precios. No toca las variables del negocio.",
  TALLER: "Solo órdenes de producción. Sin precios ni costos.",
};

export const ROLES: Rol[] = ["ADMIN", "VENDEDOR", "TALLER"];
