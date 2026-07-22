import { describe, it, expect } from "vitest";
import { SELECT_PROD } from "./ordenes";
import { puedeVerPrecios } from "./roles";

/**
 * Invariante crítico del sistema: el rol TALLER nunca recibe un precio, costo o
 * margen. Es estructural, no cosmético: la vista de producción se arma con
 * `SELECT_PROD`, que jamás debe seleccionar una columna de dinero.
 *
 * Esta prueba escanea `SELECT_PROD` (sin tocar la base) y falla si alguna vez
 * alguien agrega, por descuido, una columna monetaria a la selección del taller.
 */

/** Columnas de dinero que NUNCA deben viajar a la pantalla del taller. */
const COLUMNAS_PROHIBIDAS = [
  "costoTotal", "costoUnit", "precioUnit", "precioSinCom", "precioCalc",
  "ventaTotal", "precioML", "precioBs", "margen", "diferencial", "comision",
  "costoProt", "utilProt", "utilidad", "gananciaTotal", "precioManual",
  "precioPliego", "precioCorte", "tasaBCV", "binCompra", "binVenta", "precio",
];

/** Junta recursivamente todas las claves que aparecen en un objeto de selección. */
function clavesDe(obj: unknown, acc = new Set<string>()): Set<string> {
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      acc.add(k);
      clavesDe(v, acc);
    }
  }
  return acc;
}

describe("invariante TALLER-sin-precios", () => {
  const claves = clavesDe(SELECT_PROD);

  it("SELECT_PROD no selecciona ninguna columna de dinero", () => {
    const filtradas = COLUMNAS_PROHIBIDAS.filter((c) => claves.has(c));
    expect(filtradas).toEqual([]);
  });

  it("SELECT_PROD sí trae los datos de producción que el taller necesita", () => {
    // Verifica que el escaneo es significativo (no un objeto vacío).
    expect(claves.has("numero")).toBe(true);
    expect(claves.has("etapas")).toBe(true);
    expect(claves.has("papelNombre")).toBe(true);
  });

  it("el rol TALLER no puede ver precios", () => {
    expect(puedeVerPrecios("TALLER")).toBe(false);
    expect(puedeVerPrecios("ADMIN")).toBe(true);
    expect(puedeVerPrecios("VENDEDOR")).toBe(true);
  });
});
