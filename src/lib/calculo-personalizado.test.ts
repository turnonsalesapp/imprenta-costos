import { describe, it, expect } from "vitest";
import { calcularPop, parseEscalas, precioEscala, type EntradaPop } from "./calculo-personalizado";

const tasas = {
  margen: 30, comision: 0, ml: 12,
  tasaBCV: 473, binCompra: 659.71, binVenta: 658.01, difManual: false, dif: "",
};

describe("personalizados: escalas por cantidad", () => {
  it("parsea y ordena los tramos", () => {
    const e = parseEscalas("100:1.5, 1:3.5, 12:2.2, 50:2.1");
    expect(e).toEqual([
      { desde: 1, precio: 3.5 }, { desde: 12, precio: 2.2 },
      { desde: 50, precio: 2.1 }, { desde: 100, precio: 1.5 },
    ]);
  });

  it("elige el tramo más alto que cubre la cantidad", () => {
    const e = parseEscalas("1:3.5,12:2.2,50:2.1,100:1.5");
    expect(precioEscala(e, 5)).toBe(3.5);    // 1..11
    expect(precioEscala(e, 20)).toBe(2.2);   // 12..49
    expect(precioEscala(e, 60)).toBe(2.1);   // 50..99
    expect(precioEscala(e, 150)).toBe(1.5);  // 100+
    expect(precioEscala(e, 0)).toBe(3.5);    // por debajo del primero, cobra el primero
  });

  const base: EntradaPop = {
    nombre: "Chapa prendedor", modo: "escalas",
    escalas: "1:3.5,12:2.2,50:2.1,100:1.5",
    cantidad: 20, largoCm: 0, precioLineal: 0, anchoCm: 0, minCm: 0, ...tasas,
  };

  it("cobra la unidad del tramo × cantidad y aplica la cola de precio", () => {
    const r = calcularPop(base);
    expect(r.costoUnitBase).toBe(2.2);
    expect(r.costoTotal).toBeCloseTo(44, 6); // 2,2 × 20
    expect(r.cant).toBe(20);
    expect(r.precioUnit).toBeGreaterThan(r.costoUnit); // protegido + margen
  });

  it("100+ baja el costo por unidad", () => {
    const r = calcularPop({ ...base, cantidad: 150 });
    expect(r.costoUnitBase).toBe(1.5);
    expect(r.costoTotal).toBeCloseTo(225, 6);
  });
});

describe("personalizados: DTF por metro lineal", () => {
  const base: EntradaPop = {
    nombre: "DTF UV", modo: "lineal", escalas: "",
    cantidad: 1, largoCm: 50, precioLineal: 30, anchoCm: 57, minCm: 30, ...tasas,
  };

  it("cobra el metraje facturable × precio por metro", () => {
    const r = calcularPop(base);
    expect(r.facturableCm).toBe(50);
    expect(r.costoUnitBase).toBeCloseTo(15, 6); // 0,50 m × $30
    expect(r.costoTotal).toBeCloseTo(15, 6);
  });

  it("respeta el mínimo facturable", () => {
    const r = calcularPop({ ...base, largoCm: 20 }); // pedido menor al mínimo (30 cm)
    expect(r.facturableCm).toBe(30);
    expect(r.costoUnitBase).toBeCloseTo(9, 6); // 0,30 m × $30
  });

  it("multiplica por la cantidad de piezas", () => {
    const r = calcularPop({ ...base, cantidad: 3 });
    expect(r.costoTotal).toBeCloseTo(45, 6); // 15 × 3
  });
});
