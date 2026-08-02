import { describe, it, expect } from "vitest";
import { precioAResma, construirDiff, type FilaImport } from "./proveedores";

describe("normalización de precio a resma", () => {
  it("resma se queda igual", () => {
    expect(precioAResma(20, "resma", 500)).toBe(20);
  });
  it("por hoja multiplica por las hojas de la resma", () => {
    expect(precioAResma(0.04, "hoja", 500)).toBeCloseTo(20, 6);
  });
  it("por millar normaliza a la resma", () => {
    expect(precioAResma(40, "millar", 500)).toBeCloseTo(20, 6);
  });
  it("hojas inválidas no dividen por cero", () => {
    expect(precioAResma(5, "hoja", 0)).toBe(5);
  });
});

describe("diff de importación de lista de precios", () => {
  const papeles = [
    { id: "p1", clave: "Glase-115", nombre: "Glasé 115", hojas: 500 },
    { id: "p2", clave: "Bond-75", nombre: "Bond 75", hojas: 500 },
  ];

  it("clasifica sube/baja/igual/nuevo y detecta papeles inexistentes", () => {
    const filas: FilaImport[] = [
      { clave: "Glase-115", precio: 25, unidad: "resma" },      // sube (antes 20)
      { clave: "Bond-75", precio: 18, unidad: "resma" },        // nuevo (sin precio previo)
      { clave: "No-Existe", precio: 10, unidad: "resma" },      // sin papel
    ];
    const actuales = new Map<string, number>([["p1", 20]]);
    const diff = construirDiff(filas, papeles, actuales);

    const g = diff.find((d) => d.clave === "Glase-115")!;
    expect(g.estado).toBe("sube");
    expect(g.precioResma).toBe(25);
    expect(g.anterior).toBe(20);

    expect(diff.find((d) => d.clave === "Bond-75")!.estado).toBe("nuevo");
    expect(diff.find((d) => d.clave === "No-Existe")!.estado).toBe("sin_papel");
  });

  it("empareja por clave sin importar mayúsculas/espacios y normaliza la unidad", () => {
    const filas: FilaImport[] = [{ clave: "  glase-115 ", precio: 0.04, unidad: "hoja" }];
    const diff = construirDiff(filas, papeles, new Map([["p1", 20]]));
    expect(diff).toHaveLength(1);
    expect(diff[0].estado).toBe("igual"); // 0.04 * 500 = 20
    expect(diff[0].precioResma).toBeCloseTo(20, 6);
  });

  it("ignora filas sin clave o sin precio válido", () => {
    const filas: FilaImport[] = [
      { clave: "", precio: 10 },
      { clave: "Glase-115", precio: NaN },
    ];
    expect(construirDiff(filas, papeles, new Map())).toEqual([]);
  });
});
