import { describe, it, expect } from "vitest";
import { calcularGF, ojetesPorPerimetro, type EntradaGF } from "./calculo-granformato";

const base: Omit<EntradaGF, "anchoCm" | "altoCm" | "cantidad" | "costoM2" | "modoCobro" | "anchoRolloCm"> = {
  materialNombre: "Banner 13 oz",
  ojetesAuto: true, ojetes: 0, ojeteCosto: 0.8, ojeteCm: 40,
  margen: 30, comision: 0, ml: 12,
  tasaBCV: 473, binCompra: 659.71, binVenta: 658.01, difManual: false, dif: "",
};

describe("gran formato: modo mancha", () => {
  const r = calcularGF({ ...base, anchoCm: 200, altoCm: 100, cantidad: 1, costoM2: 7, modoCobro: "mancha", anchoRolloCm: 0 });

  it("cobra el área impresa (ancho de la pieza × alto)", () => {
    expect(r.areaFactM2).toBeCloseTo(2, 6);        // 2,00 × 1,00 m
    expect(r.lineas.find((l) => l.k === "material")!.monto).toBeCloseTo(14, 6); // 2 m² × $7
  });

  it("calcula los ojetes por el perímetro (cada 40 cm)", () => {
    // perímetro 2×(200+100)=600 cm ÷ 40 = 15
    expect(r.ojetesPorPieza).toBe(15);
    expect(r.ojetesTotal).toBe(15);
    expect(r.lineas.find((l) => l.k === "ojetes")!.monto).toBeCloseTo(12, 6); // 15 × $0,8
  });

  it("suma material + ojetes y aplica la cola de precio", () => {
    expect(r.costoTotal).toBeCloseTo(26, 6); // 14 + 12
    expect(r.precioUnit).toBeGreaterThan(r.costoUnit); // protegido + margen
    expect(r.precioM2Venta).toBeGreaterThan(0);
  });
});

describe("gran formato: modo ancho de rollo", () => {
  const r = calcularGF({
    ...base, anchoCm: 100, altoCm: 50, cantidad: 1, costoM2: 8,
    modoCobro: "ancho_rollo", anchoRolloCm: 137, ojetesAuto: false, ojetes: 0,
  });

  it("cobra el ancho del rollo, no el de la pieza", () => {
    // 1,37 (rollo) × 0,50 = 0,685 m²  (no 1,00 × 0,50)
    expect(r.areaFactM2).toBeCloseTo(0.685, 6);
    expect(r.lineas.find((l) => l.k === "material")!.monto).toBeCloseTo(5.48, 6);
  });
});

describe("gran formato: ojetes por perímetro", () => {
  it("mínimo 4 (esquinas) y redondeo por separación", () => {
    expect(ojetesPorPerimetro(30, 30, 40)).toBe(4);      // perímetro 120/40=3 → mín 4
    expect(ojetesPorPerimetro(200, 100, 40)).toBe(15);   // 600/40
    expect(ojetesPorPerimetro(0, 0, 40)).toBe(0);
  });
});
