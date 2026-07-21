import { describe, it, expect } from "vitest";
import { PAPELES_BASE, ACABADOS_BASE, FECHA_LISTA_PAPEL } from "./datos-base";
import { MEDIDAS } from "./calculo";

/**
 * Estos son los precios por pliego que aparecen en la hoja original de la
 * imprenta (columna "Pliego", lista del 16 de octubre de 2025).
 *
 * La prueba verifica que precio ÷ hojas dé exactamente eso. Su trabajo es
 * atrapar un error de tipeo en la carga inicial: un cero de más en un precio
 * o un número de hojas equivocado desviaría todas las cotizaciones futuras
 * sin que nadie lo note.
 *
 * Si el proveedor cambia sus precios, NO se toca este archivo: los precios
 * nuevos se cargan desde la pantalla de Variables.
 */
const PRECIO_POR_PLIEGO: Record<string, number> = {
  "Bond 16/56 Gr.-500": 0.09, "Bond 20/75 Gr.-500": 0.11, "Bond 24/90 Gr.-500": 0.13,
  "Bond 120 Gr.-250": 0.19, "Papel Imprenta 45 Gr.-500": 0.05, "Bristol 90/150 Gr.-250": 0.24,
  "Bristol 110/210 Gr.-125": 0.34, "Bristol 240 Gr.-125": 0.38, "C.B. Blanco 55 Gr.-500": 0.14,
  "C.F.B. Colores 50 Gr.-500": 0.15, "C.F. Colores 55 Gr.-500": 0.14, "Glase 80 Gr.-500": 0.12,
  "Glase 90 Gr.-250": 0.13, "Glase 100 Gr.-500": 0.15, "Glase/Mate 115 Gr.-250": 0.16,
  "Mate/Glase 150 Gr.-250": 0.21, "Mate 200 Gr.-100": 0.32, "Glase 200 Gr.-125": 0.28,
  "Mate 250 Gr.-125": 0.39, "Glase 250 Gr.-100": 0.40, "Glase 300 Gr.-100": 0.52,
  "Mate/Glase 350 Gr.-125": 0.47, "Cartón MM (Mitabell) (400 Gr)-1": 0.56,
  "SBS Cal. 0.12 (205 Gr.)-3125": 0.33, "SBS Cal. 0.12 (205 Gr.)-125": 0.34,
  "SBS Cal. 0.16 (260 Gr.)-2300": 0.30, "SBS Cal. 0.16 (260 Gr.)-100": 0.35,
  "SBS Cal. 0.18 (285 Gr.)-2000": 0.45, "SBS Cal. 0.18 (285 Gr.)-100": 0.50,
  "SBS Cal. 0.20 (325 Gr.)-1800": 0.54, "SBS Cal. 0.20 (325 Gr.)-100": 0.60,
  "SBS Cal. 0.22 (350 Gr.)-1700": 0.59, "SBS Cal. 0.22 (350 Gr.)-100": 0.65,
  "SBS Cal. 0.24 (380 Gr.)-1600": 0.60, "SBS Cal. 0.24 (380 Gr.)-100": 0.70,
  "R. Periódico Cal. 0.20 (400 Gr.)-100": 0.60, "Litho 90-250": 0.14,
  "Litho Autoadhesivo-200": 0.65, "Papel Antigrasa (40 Gr.)-500": 0.13,
  "Snowbright Cream (60 Gr.)-500": 0.10, "Snowbright Cream (80 Gr.)-250": 0.14,
  "Kraft 80 Gr.-500": 0.15, "Papel para libros SNOWBRIGHT CREAM (80 Gr.)-250": 0.12,
};

describe("lista de papeles precargada", () => {
  it("trae las 43 referencias de la lista del proveedor", () => {
    expect(PAPELES_BASE).toHaveLength(43);
    expect(FECHA_LISTA_PAPEL).toBe("2025-10-16");
  });

  it("no tiene referencias repetidas", () => {
    const ids = PAPELES_BASE.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada precio por pliego coincide con la hoja original", () => {
    for (const p of PAPELES_BASE) {
      const esperado = PRECIO_POR_PLIEGO[p.id];
      expect(esperado, `"${p.id}" no está en la hoja original`).toBeDefined();
      const calculado = Number((p.precio / p.hojas).toFixed(2));
      expect(calculado, `precio por pliego de "${p.id}"`).toBeCloseTo(esperado, 2);
    }
  });

  it("carga todas las referencias de la hoja, ninguna se quedó fuera", () => {
    for (const id of Object.keys(PRECIO_POR_PLIEGO)) {
      expect(PAPELES_BASE.find((p) => p.id === id), `falta cargar "${id}"`).toBeDefined();
    }
  });

  it("todos tienen hojas y precio positivos y una medida conocida", () => {
    for (const p of PAPELES_BASE) {
      expect(p.hojas, p.id).toBeGreaterThan(0);
      expect(p.precio, p.id).toBeGreaterThan(0);
      expect(MEDIDAS[p.med], `medida de "${p.id}"`).toBeDefined();
    }
  });
});

describe("acabados precargados", () => {
  it("trae los 11 de la hoja VARIABLES más los dos niveles extra de troquel", () => {
    expect(ACABADOS_BASE).toHaveLength(13);
  });

  it("no tiene claves repetidas y usa unidades y escalas válidas", () => {
    const ids = ACABADOS_BASE.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACABADOS_BASE) {
      expect(["pliego", "elemento", "millar", "trabajo"], a.id).toContain(a.unidad);
      expect(["area", "min", "fija"], a.id).toContain(a.escala);
      expect(a.costo, a.id).toBeGreaterThan(0);
    }
  });

  it("conserva las tarifas de la hoja VARIABLES", () => {
    const c = Object.fromEntries(ACABADOS_BASE.map((a) => [a.id, a.costo]));
    expect(c.impTiro).toBe(0.264);
    expect(c.impRetiro).toBe(0.264);
    expect(c.lamTiro).toBe(0.33);
    expect(c.lamRetiro).toBe(0.33);
    expect(c.troqDig).toBe(0.5);
    expect(c.troquelado).toBe(15);
    expect(c.pegado).toBe(0.03);
    expect(c.guillotina).toBe(5);
    expect(c.prueba).toBe(5);
    // Estas dos venían duplicadas y en conflicto en la hoja original.
    // Se resolvieron así; confirmar con el taller.
    expect(c.troquel).toBe(100);   // Troquel Básico (VARIABLES decía 100, la calculadora 50)
    expect(c.acetato).toBe(0.05);  // VARIABLES decía 0,03; el cálculo real usa 0,05
    // Troquel en tres niveles configurables.
    expect(c.troquelMedio).toBe(150);
    expect(c.troquelComplejo).toBe(200);
  });

  it("los tres niveles de troquel comparten el grupo 'troquel'", () => {
    const troqueles = ACABADOS_BASE.filter((a) => a.grupo === "troquel").map((a) => a.id);
    expect(troqueles).toEqual(["troquel", "troquelMedio", "troquelComplejo"]);
  });
});
