import { describe, it, expect } from "vitest";
import {
  esAdmin, esSuperAdmin, puedeAdministrar, puedeVerPrecios,
  puedeEliminarCotizaciones, puedeBorrarDelHilo, rolesAsignables, ROLES,
} from "./roles";

/**
 * SUPERADMIN es superconjunto de ADMIN: todo lo que puede un ADMIN lo puede un
 * SUPERADMIN, y además puede otorgar/quitar SUPERADMIN. Estas reglas son puras
 * (sin base ni sesión), así que se prueban directas.
 */
describe("rol SUPERADMIN ⊇ ADMIN", () => {
  it("esAdmin incluye ADMIN y SUPERADMIN, no VENDEDOR/TALLER", () => {
    expect(esAdmin("SUPERADMIN")).toBe(true);
    expect(esAdmin("ADMIN")).toBe(true);
    expect(esAdmin("VENDEDOR")).toBe(false);
    expect(esAdmin("TALLER")).toBe(false);
  });

  it("esSuperAdmin es exclusivo de SUPERADMIN", () => {
    expect(esSuperAdmin("SUPERADMIN")).toBe(true);
    expect(esSuperAdmin("ADMIN")).toBe(false);
  });

  it("SUPERADMIN administra y ve precios como ADMIN", () => {
    expect(puedeAdministrar("SUPERADMIN")).toBe(true);
    expect(puedeVerPrecios("SUPERADMIN")).toBe(true);
  });

  it("SUPERADMIN elimina cotizaciones y borra del hilo como ADMIN", () => {
    const u = { rol: "SUPERADMIN" as const, puedeCotizar: false, tiposCotizar: [], puedeEliminar: false };
    expect(puedeEliminarCotizaciones(u)).toBe(true);
    expect(puedeBorrarDelHilo({ id: "x", rol: "SUPERADMIN" }, "otro")).toBe(true);
  });
});

describe("quién puede asignar el rol SUPERADMIN", () => {
  it("solo un SUPERADMIN puede asignar SUPERADMIN", () => {
    expect(rolesAsignables("SUPERADMIN")).toContain("SUPERADMIN");
    expect(rolesAsignables("ADMIN")).not.toContain("SUPERADMIN");
    expect(rolesAsignables("ADMIN")).toEqual(["ADMIN", "VENDEDOR", "TALLER"]);
  });

  it("ROLES incluye los cuatro roles", () => {
    expect(ROLES).toEqual(["SUPERADMIN", "ADMIN", "VENDEDOR", "TALLER"]);
  });
});
