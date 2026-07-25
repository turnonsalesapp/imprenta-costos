/**
 * Motor de costo de PERSONALIZADOS / Material POP (tercerizado). Puro, sin BD ni UI.
 *
 * Cubre chapas, llaveros, bolígrafos, DTF, sublimación y corte láser. El costo
 * sale del catálogo del proveedor y pasa por la MISMA cola de precio del sistema
 * (`precioDesdeCosto`): diferencial → costo/utilidad protegida → margen → comisión.
 *
 * Dos formas de costo del proveedor:
 *   escalas = precio por unidad según el volumen (1-11, 12-49, 50-99, 100+…)
 *   lineal  = precio por metro lineal con ancho fijo y un mínimo (DTF UV).
 */
import {
  precioDesdeCosto, n, fmtNum, usd, type ParamsPrecio, type Precio, type LineaCosto,
} from "./calculo";

export type ModoPop = "escalas" | "lineal";

export type Escala = { desde: number; precio: number };

/** "1:3.5,12:2.2,50:2.1,100:1.5" → [{desde,precio}] ordenado por `desde`. */
export function parseEscalas(s: string): Escala[] {
  return (s ?? "")
    .split(/[,;]+/)
    .map((par) => {
      const [d, pr] = par.split(":").map((x) => Number((x ?? "").trim().replace(",", ".")));
      return { desde: d, precio: pr };
    })
    .filter((e) => e.desde > 0 && Number.isFinite(e.precio) && e.precio >= 0)
    .sort((a, b) => a.desde - b.desde);
}

/** Precio por unidad para la cantidad dada (la escala más alta cuyo `desde` ≤ cant). */
export function precioEscala(escalas: Escala[], cant: number): number {
  if (!escalas.length) return 0;
  let precio = escalas[0].precio; // por debajo del primer tramo se cobra el primero
  for (const e of escalas) if (cant >= e.desde) precio = e.precio;
  return precio;
}

export interface EntradaPop extends ParamsPrecio {
  nombre?: string;
  modo: ModoPop;
  cantidad: number | string;
  escalas: string;              // modo escalas
  largoCm: number | string;     // modo lineal
  precioLineal: number | string;
  anchoCm: number | string;
  minCm: number | string;
}

export interface ResultadoPop extends Precio {
  costoUnitBase: number; // costo unitario del proveedor (antes del margen)
  facturableCm: number;  // largo facturable (modo lineal)
  lineas: LineaCosto[];
  escalas: Escala[];
}

export function calcularPop(f: EntradaPop): ResultadoPop {
  const escalas = parseEscalas(f.escalas);

  if (f.modo === "lineal") {
    const largo = Math.max(0, n(f.largoCm));
    const min = Math.max(0, n(f.minCm));
    const facturableCm = Math.max(largo, min);
    const metros = facturableCm / 100;
    const costoUnitBase = metros * Math.max(0, n(f.precioLineal)); // costo de una pieza (su metraje)
    const cant = Math.max(1, Math.round(n(f.cantidad)) || 1);
    const costoTotal = costoUnitBase * cant;

    const lineas: LineaCosto[] = [];
    if (costoTotal > 0) {
      const anchoTxt = n(f.anchoCm) > 0 ? `ancho ${fmtNum(n(f.anchoCm), 0)} cm · ` : "";
      lineas.push({
        k: "lineal",
        label: f.nombre || "DTF",
        detalle: `${fmtNum(facturableCm, 0)} cm × ${cant} · ${anchoTxt}${usd(n(f.precioLineal))}/m`,
        monto: costoTotal,
      });
    }
    const pr = precioDesdeCosto(costoTotal, cant, f);
    return { costoUnitBase, facturableCm, lineas, escalas, ...pr };
  }

  // modo escalas
  const cant = Math.max(0, Math.round(n(f.cantidad)));
  const costoUnitBase = precioEscala(escalas, cant);
  const costoTotal = costoUnitBase * cant;

  const lineas: LineaCosto[] = [];
  if (costoTotal > 0) {
    lineas.push({
      k: "producto",
      label: f.nombre || "Producto",
      detalle: `${cant} x ${usd(costoUnitBase)}`,
      monto: costoTotal,
    });
  }
  const pr = precioDesdeCosto(costoTotal, cant, f);
  return { costoUnitBase, facturableCm: 0, lineas, escalas, ...pr };
}
