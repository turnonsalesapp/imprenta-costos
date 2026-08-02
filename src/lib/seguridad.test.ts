import { describe, it, expect } from "vitest";
import { SELECT_PROD, SELECT_PIEZA_TABLERO, proyeccionProd, carrilDe } from "./ordenes";
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

  it("el tablero de producción por pieza tampoco selecciona dinero", () => {
    const clavesPieza = clavesDe(SELECT_PIEZA_TABLERO);
    const filtradas = COLUMNAS_PROHIBIDAS.filter((c) => clavesPieza.has(c));
    expect(filtradas).toEqual([]);
    // Y sí trae lo que el tablero necesita.
    expect(clavesPieza.has("estado")).toBe(true);
    expect(clavesPieza.has("carril")).toBe(true);
  });
});

describe("carril de producción por pieza", () => {
  it("propia y offset van al taller (INTERNO)", () => {
    expect(carrilDe("PROPIA")).toBe("INTERNO");
    expect(carrilDe("OFFSET")).toBe("INTERNO");
  });

  it("gran formato, proveedor y personalizado van a compras (TERCERIZADO)", () => {
    expect(carrilDe("GRAN_FORMATO")).toBe("TERCERIZADO");
    expect(carrilDe("PROVEEDOR")).toBe("TERCERIZADO");
    expect(carrilDe("PERSONALIZADO")).toBe("TERCERIZADO");
  });
});

describe("proyección de producción sin precios (Orden.items)", () => {
  it("descarta cualquier campo de dinero del ítem de la cotización", () => {
    // Ítem congelado con dinero (como vive en Cotizacion.items).
    const conDinero = [{
      titulo: "Volantes", descripcion: "media carta", cantidad: 3000,
      ancho: 215, alto: 140, tamano: "1/4 Pliego", papelNombre: "Glasé",
      capacidad: 4, pliegos: 772.5,
      lineas: [{ k: "papel", label: "Glasé" }, { k: "impTiro", label: "Impresión Tiro" }],
      // dinero que NUNCA debe llegar al taller:
      costoTotal: 679.47, costoUnit: 0.2265, precioUnit: 0.5, ventaTotal: 1511,
      margen: 30, diferencial: 1.39, precioBs: 100, precioML: 0.6, tasaBCV: 473,
    }];
    const [p] = proyeccionProd(conDinero as unknown as Parameters<typeof proyeccionProd>[0]);
    const claves = Object.keys(p);
    for (const money of ["costoTotal", "costoUnit", "precioUnit", "ventaTotal", "margen",
      "diferencial", "precioBs", "precioML", "tasaBCV"]) {
      expect(claves).not.toContain(money);
    }
    expect(p.papelNombre).toBe("Glasé");
    expect(p.acabados).toEqual(["Impresión Tiro"]); // la línea de papel no es acabado
  });
});
