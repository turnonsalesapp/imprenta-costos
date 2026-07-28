import { describe, it, expect } from "vitest";
import { calcularOffset, type EntradaOffset } from "./calculo-offset";

const tasas = {
  margen: 30, comision: 0, ml: 12,
  tasaBCV: 473, binCompra: 659.71, binVenta: 658.01, difManual: false, dif: "",
};

const base: EntradaOffset = {
  papelNombre: "Glasé 150g", precioPliego: 0.5, medida: "70x100", tamano: "Pliego",
  anchoPza: 350, altoPza: 500, cantidad: 1000, merma: 3,
  pinza: 5, sep: 3, colores: 4, coloresPasada: 4, caras: 1,
  costoPlancha: 8, costoArranque: 15, costoMillar: 6, costoTinta: 0,
  acabados: {}, catalogoAcab: [], ...tasas,
};

describe("offset: producción propia", () => {
  const r = calcularOffset(base);

  it("monta en el pliego completo y redondea a pliegos enteros con merma", () => {
    expect(r.cap).toBe(2);           // 2 piezas 350×500 en 70×100
    expect(r.pliegosBase).toBe(500); // 1000 / 2
    expect(r.pliegos).toBe(515);     // 500 × 1,03 → ceil
    expect(r.millaresImp).toBe(1);   // ceil(515/1000)
  });

  it("hace una plancha por color y por cara", () => {
    expect(r.nPlanchas).toBe(4);     // 4 colores × 1 cara
    expect(r.lineas.find((l) => l.k === "planchas")!.monto).toBeCloseTo(32, 6); // 4 × $8
  });

  it("suma papel + planchas + arranque + impresión", () => {
    expect(r.lineas.find((l) => l.k === "papel")!.monto).toBeCloseTo(257.5, 6);   // 515 × $0,5
    expect(r.lineas.find((l) => l.k === "arranque")!.monto).toBeCloseTo(15, 6);   // 1 cara × $15
    expect(r.lineas.find((l) => l.k === "impresion")!.monto).toBeCloseTo(6, 6);   // 1 millar × $6 × 1 cara
    expect(r.costoTotal).toBeCloseTo(310.5, 6); // 257,5 + 32 + 15 + 6
    expect(r.precioUnit).toBeGreaterThan(r.costoUnit); // protegido + margen
  });

  it("tiro y retiro duplica planchas y agrega la segunda cara", () => {
    const r2 = calcularOffset({ ...base, caras: 2 });
    expect(r2.nPlanchas).toBe(8);                                                  // 4 × 2 caras
    expect(r2.lineas.find((l) => l.k === "planchas")!.monto).toBeCloseTo(64, 6);
    expect(r2.lineas.find((l) => l.k === "arranque")!.monto).toBeCloseTo(30, 6);   // 2 caras × $15
    expect(r2.lineas.find((l) => l.k === "impresion")!.monto).toBeCloseTo(12, 6);  // 1 millar × $6 × 2
  });

  it("una prensa 4 colores imprime el 4/0 en una pasada", () => {
    expect(r.pasadas).toBe(1);
    expect(r.lineas.find((l) => l.k === "impresion")!.monto).toBeCloseTo(6, 6); // 1 millar × $6 × 1 pasada × 1 cara
  });

  it("una prensa de 1 color imprime el 4/0 en 4 pasadas (impresión ×4)", () => {
    const r1 = calcularOffset({ ...base, coloresPasada: 1 });
    expect(r1.pasadas).toBe(4);
    expect(r1.nPlanchas).toBe(4); // las planchas no cambian: una por color
    expect(r1.lineas.find((l) => l.k === "impresion")!.monto).toBeCloseTo(24, 6); // 1 millar × $6 × 4 pasadas
  });

  it("una prensa de 2 colores imprime el 4/0 en 2 pasadas", () => {
    const r2 = calcularOffset({ ...base, coloresPasada: 2 });
    expect(r2.pasadas).toBe(2);
    expect(r2.lineas.find((l) => l.k === "impresion")!.monto).toBeCloseTo(12, 6);
  });

  it("cobra el consumo de tinta por color y por cara", () => {
    const rt = calcularOffset({ ...base, costoTinta: 2 });
    // 1 millar (515 pliegos) × $2 × 4 colores × 1 cara
    expect(rt.lineas.find((l) => l.k === "tinta")!.monto).toBeCloseTo(8, 6);
    const rt2 = calcularOffset({ ...base, costoTinta: 2, caras: 2 });
    expect(rt2.lineas.find((l) => l.k === "tinta")!.monto).toBeCloseTo(16, 6); // ×2 caras
  });

  it("monta en el tamaño de corte elegido y cobra el papel por fracción", () => {
    const rc = calcularOffset({ ...base, tamano: "1/4 Pliego", anchoPza: 100, altoPza: 150 });
    expect(rc.frac).toBe(0.25);
    expect(rc.cap).toBeGreaterThan(0);
    // papel: precio del corte = pliego × 0,25
    const papel = rc.lineas.find((l) => l.k === "papel")!;
    expect(papel.monto).toBeCloseTo(rc.pliegos * 0.5 * 0.25, 6);
  });

  it("aplica acabados por pliego con el factor del pliego completo", () => {
    const r3 = calcularOffset({
      ...base,
      catalogoAcab: [{ id: "barniz", label: "Barniz", costo: 0.1, unidad: "pliego", escala: "area" }],
      acabados: { barniz: { on: true, q: 1 } },
    });
    // 515 pliegos × ($0,1 × factor 4) = 515 × 0,4 = 206
    expect(r3.lineas.find((l) => l.k === "barniz")!.monto).toBeCloseTo(206, 6);
  });
});
