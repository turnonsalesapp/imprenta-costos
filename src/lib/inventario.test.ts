import { describe, it, expect } from "vitest";
import { planConsumo } from "./inventario";

/**
 * El descuento de inventario debe tratar CADA ítem por separado: su propio papel
 * por (sus pliegos × fracción de su tamaño). El bug anterior usaba las columnas
 * agregadas de nivel cotización (un solo papel, pliegos sumados, tamaño "Varios"
 * → fracción 0.25), lo que descontaba mal cuando los ítems diferían.
 */

describe("planConsumo (descuento de inventario multi-ítem)", () => {
  it("descuenta cada ítem por su propio papel y tamaño", () => {
    const plan = planConsumo({
      items: [
        { entrada: { papelId: "A" }, tamano: "1/4 Pliego", pliegos: 100 }, // 100 × 0.25 = 25
        { entrada: { papelId: "B" }, tamano: "1/2 Pliego", pliegos: 40 },  // 40 × 0.5  = 20
      ],
      entrada: { papelId: "A" }, tamano: "Varios", pliegos: 140, // agregados: se ignoran si hay items
    });
    const m = new Map(plan);
    expect(m.get("A")).toBeCloseTo(25, 6);
    expect(m.get("B")).toBeCloseTo(20, 6);
    expect(plan.length).toBe(2);
  });

  it("suma cuando dos ítems usan el mismo papel", () => {
    const plan = planConsumo({
      items: [
        { entrada: { papelId: "A" }, tamano: "1/4 Pliego", pliegos: 100 }, // 25
        { entrada: { papelId: "A" }, tamano: "1/4 Pliego", pliegos: 60 },  // 15
      ],
      entrada: { papelId: "A" }, tamano: "Varios", pliegos: 160,
    });
    expect(new Map(plan).get("A")).toBeCloseTo(40, 6);
    expect(plan.length).toBe(1);
  });

  it("cotización vieja sin items usa las columnas de nivel cotización", () => {
    const plan = planConsumo({
      items: null,
      entrada: { papelId: "C" }, tamano: "Pliego", pliegos: 10, // 10 × 1 = 10
    });
    expect(new Map(plan).get("C")).toBeCloseTo(10, 6);
  });

  it("ignora ítems sin papel o sin consumo", () => {
    const plan = planConsumo({
      items: [
        { entrada: { papelId: "A" }, tamano: "1/4 Pliego", pliegos: 0 },   // 0 → fuera
        { entrada: {}, tamano: "1/4 Pliego", pliegos: 100 },               // sin papel → fuera
        { entrada: { papelId: "D" }, tamano: "1/8 Pliego", pliegos: 80 },  // 80 × 0.125 = 10
      ],
      entrada: null, tamano: "Varios", pliegos: 0,
    });
    expect(plan).toEqual([["D", 10]]);
  });
});
