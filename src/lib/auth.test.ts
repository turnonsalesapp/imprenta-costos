import { describe, it, expect, beforeAll } from "vitest";
import { puedeVerPrecios, puedeAdministrar, esAdmin } from "./roles";

describe("roles: la regla de oro de la Fase 2", () => {
  it("TALLER nunca puede ver precios", () => {
    expect(puedeVerPrecios("TALLER")).toBe(false);
  });

  it("ADMIN y VENDEDOR sí ven precios", () => {
    expect(puedeVerPrecios("ADMIN")).toBe(true);
    expect(puedeVerPrecios("VENDEDOR")).toBe(true);
  });

  it("solo ADMIN administra (variables, papeles, usuarios)", () => {
    expect(puedeAdministrar("ADMIN")).toBe(true);
    expect(puedeAdministrar("VENDEDOR")).toBe(false);
    expect(puedeAdministrar("TALLER")).toBe(false);
    expect(esAdmin("ADMIN")).toBe(true);
    expect(esAdmin("VENDEDOR")).toBe(false);
  });
});

describe("token de sesión: firma y verificación", () => {
  beforeAll(() => {
    // Clave fija para que el test no dependa del entorno.
    process.env.AUTH_SECRET = "clave-de-prueba-suficientemente-larga-1234567890";
  });

  it("un token firmado se verifica y devuelve su carga", async () => {
    const { firmarToken, verificarToken } = await import("./jwt");
    const token = await firmarToken({ sid: "abc123", rol: "TALLER" });
    const payload = await verificarToken(token);
    expect(payload).toEqual({ sid: "abc123", rol: "TALLER" });
  });

  it("un token manipulado no se verifica", async () => {
    const { firmarToken, verificarToken } = await import("./jwt");
    const token = await firmarToken({ sid: "abc123", rol: "VENDEDOR" });
    // Alterar el último carácter invalida la firma.
    const roto = token.slice(0, -1) + (token.at(-1) === "a" ? "b" : "a");
    expect(await verificarToken(roto)).toBeNull();
  });

  it("basura no se verifica", async () => {
    const { verificarToken } = await import("./jwt");
    expect(await verificarToken("no-es-un-token")).toBeNull();
  });
});
