import { describe, it, expect } from "vitest";
import { calcular, comparar, calcCapacidad, medidaCorte, n, fmtNum } from "./calculo";
import type { Config, Entrada } from "./calculo";
import { PAPELES_BASE, ACABADOS_BASE, CONFIG_BASE } from "./datos-base";

const cfg: Config = { ...CONFIG_BASE, comision: 0, papeles: PAPELES_BASE, acabados: ACABADOS_BASE };

/**
 * Caso de referencia: Jugarte Venezuela, 3.000 stickers de 14×14 cm,
 * Litho Autoadhesivo, 1/4 de pliego, 4 piezas por corte.
 * Los valores esperados salen de la hoja de cálculo original de la imprenta.
 * Si algún día un cambio rompe esta prueba, el cambio está mal.
 */
const jugarte: Entrada = {
  cantidad: 3000, capacidad: 4, merma: 3, tamano: "1/4 Pliego",
  papelId: "Litho Autoadhesivo-200",
  tasaBCV: 473, binCompra: 659.71, binVenta: 658.01, difManual: false, dif: "",
  margen: 30, comision: 0, ml: 12,
  acabados: {
    impTiro: { on: true, q: 1 },
    troquelado: { on: true, q: 1 },
    pegado: { on: true, q: 2 },
    acetato: { on: true, q: 1 },
    guillotina: { on: true, q: 1 },
  },
};

describe("caso real Jugarte (3.000 stickers)", () => {
  const r = calcular(jugarte, cfg);

  it("consume 772,5 cortes con 3% de merma", () => {
    expect(r.pliegosBase).toBe(750);
    expect(r.pliegos).toBeCloseTo(772.5, 4);
  });

  it("cobra cada línea como la hoja original", () => {
    const m = Object.fromEntries(r.lineas.map((l) => [l.k, l.monto]));
    expect(m.papel).toBeCloseTo(125.53, 2);
    expect(m.impTiro).toBeCloseTo(203.94, 2);
    expect(m.troquelado).toBeCloseTo(60, 2);   // 4 millares × $15
    expect(m.pegado).toBeCloseTo(180, 2);      // 3.000 pzs × $0,03 × 2
    expect(m.acetato).toBeCloseTo(150, 2);     // 3.000 pzs × $0,05
    expect(m.guillotina).toBeCloseTo(5, 2);
  });

  it("llega al costo y al precio esperados", () => {
    expect(r.costoTotal).toBeCloseTo(724.47, 2);
    expect(r.costoUnit).toBeCloseTo(0.2415, 4);
    expect(r.dif).toBeCloseTo(1.3929, 4);
    expect(r.costoProt).toBeCloseTo(0.3364, 4);
    expect(r.utilProt).toBeCloseTo(0.2008, 4);
    expect(r.precioUnit).toBeCloseTo(0.5372, 4);
    expect(r.ventaTotal).toBeCloseTo(1611.58, 1);
    expect(r.precioML * 3000).toBeCloseTo(1804.97, 1);
  });
});

describe("escalado por tamaño de corte", () => {
  it("la impresión se referencia a 1/4 de pliego", () => {
    const imp = (tamano: string) =>
      calcular({ ...jugarte, tamano }, cfg).lineas.find((l) => l.k === "impTiro")!;
    expect(imp("Pliego").detalle).toContain("$1,0560");
    expect(imp("1/2 Pliego").detalle).toContain("$0,5280");
    expect(imp("1/4 Pliego").detalle).toContain("$0,2640");
    expect(imp("1/8 Pliego").detalle).toContain("$0,1320");
  });

  it("el troquelado digital sube pero nunca baja de su tarifa base", () => {
    const troq = (tamano: string) =>
      calcular({ ...jugarte, tamano, acabados: { troqDig: { on: true, q: 1 } } }, cfg)
        .lineas.find((l) => l.k === "troqDig")!;
    expect(troq("Pliego").detalle).toContain("$2,0000");
    expect(troq("1/8 Pliego").detalle).toContain("$0,5000"); // no baja
  });
});

describe("comparador por tiraje", () => {
  const conFijos: Entrada = {
    ...jugarte,
    acabados: {
      impTiro: { on: true, q: 1 },
      troquel: { on: true, q: 1 },     // $100 fijos
      guillotina: { on: true, q: 1 },
      prueba: { on: true, q: 1 },
    },
  };
  const pts = comparar(conFijos, cfg, [10000, 500, 3000, 1000, 5000]);

  it("devuelve las cantidades ordenadas de menor a mayor", () => {
    expect(pts.map((p) => p.cantidad)).toEqual([500, 1000, 3000, 5000, 10000]);
  });

  it("el precio unitario baja al subir el tiraje", () => {
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].precioUnit).toBeLessThan(pts[i - 1].precioUnit);
    }
  });

  it("diluye los costos fijos: de 500 a 10.000 baja más de la mitad", () => {
    const caida = 1 - pts[pts.length - 1].precioUnit / pts[0].precioUnit;
    expect(caida).toBeGreaterThan(0.5);
  });
});

describe("comisión del vendedor", () => {
  it("se descuenta del precio, no se suma al costo", () => {
    const sin = calcular({ ...jugarte, comision: 0 }, cfg).precioUnit;
    const con = calcular({ ...jugarte, comision: 3 }, cfg).precioUnit;
    expect(con).toBeCloseTo(sin / 0.97, 6);
  });
});

describe("montaje sobre el pliego", () => {
  it("parte el pliego por el lado más largo", () => {
    expect(medidaCorte("70x100", 1)).toEqual([700, 1000]);
    expect(medidaCorte("70x100", 0.25)).toEqual([350, 500]);
    expect(medidaCorte("66x96", 0.125)).toEqual([330, 240]);
  });

  it("cuenta las piezas descontando pinza y separación", () => {
    expect(calcCapacidad(140, 140, 350, 500, 5, 3)).toEqual({ cap: 6, cols: 2, filas: 3, rot: false });
  });

  it("prueba la pieza rotada y se queda con el mejor montaje", () => {
    const r = calcCapacidad(300, 100, 350, 500, 5, 3);
    expect(r.cap).toBeGreaterThan(0);
  });

  it("devuelve 0 si la pieza no entra", () => {
    expect(calcCapacidad(900, 900, 350, 500, 5, 3).cap).toBe(0);
  });
});

describe("entradas incompletas o sucias", () => {
  const vacio: Entrada = {
    cantidad: "", capacidad: "", merma: 3, tamano: "1/4 Pliego", papelId: "",
    acabados: {}, margen: 30, comision: 0, ml: 12,
    tasaBCV: 0, binCompra: 0, binVenta: 0,
  };

  it("nunca produce NaN ni divide entre cero", () => {
    const r = calcular(vacio, cfg);
    for (const v of [r.costoTotal, r.costoUnit, r.precioUnit, r.ventaTotal, r.precioBs]) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBe(0);
    }
    expect(r.dif).toBe(1);
  });

  it("acepta la coma decimal venezolana", () => {
    expect(n("0,264")).toBe(0.264);
    expect(n("1.234")).toBe(1.234);
    expect(n(null)).toBe(0);
    expect(n("hola")).toBe(0);
  });

  it("formatea a la venezolana: miles con punto, decimales con coma", () => {
    expect(fmtNum(1611.5765, 2)).toBe("1.611,58");
    expect(fmtNum(-0.2415, 4)).toBe("-0,2415");
  });

  it("topa el margen para que no se dispare al infinito", () => {
    const r = calcular({ ...jugarte, margen: 150 }, cfg);
    expect(Number.isFinite(r.precioUnit)).toBe(true);
  });
});
