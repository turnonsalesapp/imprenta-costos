/**
 * Motor de costo de GRAN FORMATO (tercerizado). Puro, sin BD ni UI.
 *
 * A diferencia del digital (costo por corte de pliego), aquí la unidad es el
 * METRO CUADRADO del material. El costo sale del catálogo del proveedor y, como
 * en todo el sistema, se convierte en precio con la MISMA cola de precio
 * (`precioDesdeCosto`): diferencial cambiario → costo/utilidad protegida →
 * margen → comisión. Los precios del catálogo ya vienen a BCV.
 *
 * Dos modos de cobro (el vendedor elige):
 *   mancha      = se cobra el área impresa (ancho de la pieza × alto).
 *   ancho_rollo = se cobra el ancho completo del rollo × alto (se paga el
 *                 desperdicio a lo ancho; típico de viniles).
 */
import {
  precioDesdeCosto, n, fmtNum, usd, type ParamsPrecio, type Precio, type LineaCosto,
} from "./calculo";

export type ModoCobroGF = "mancha" | "ancho_rollo";

export interface EntradaGF extends ParamsPrecio {
  materialNombre?: string;
  anchoCm: number | string;      // ancho de la pieza (cm)
  altoCm: number | string;       // alto de la pieza (cm)
  cantidad: number | string;
  costoM2: number | string;      // costo del material por m²
  modoCobro: ModoCobroGF;
  anchoRolloCm: number | string; // ancho de rollo elegido (modo ancho_rollo)
  ojetesAuto: boolean;
  ojetes: number | string;       // ojetes POR PIEZA (si es manual)
  ojeteCosto: number | string;
  ojeteCm: number | string;      // separación entre ojetes (cm)
}

export interface ResultadoGF extends Precio {
  areaPiezaM2: number;   // área de una pieza (mancha)
  areaCobroM2: number;   // área facturable de una pieza (según el modo)
  areaFactM2: number;    // área facturable total (× cantidad)
  ojetesPorPieza: number;
  ojetesTotal: number;
  precioM2Venta: number; // precio de venta por m² (referencia)
  lineas: LineaCosto[];
}

/** Ojetes por el perímetro de la pieza, uno cada `sepCm`, mínimo 4 (esquinas). */
export function ojetesPorPerimetro(anchoCm: number, altoCm: number, sepCm: number): number {
  const perim = 2 * (anchoCm + altoCm);
  if (perim <= 0 || sepCm <= 0) return 0;
  return Math.max(4, Math.round(perim / sepCm));
}

export function calcularGF(f: EntradaGF): ResultadoGF {
  const anchoCm = Math.max(0, n(f.anchoCm));
  const altoCm = Math.max(0, n(f.altoCm));
  const cant = Math.max(0, Math.round(n(f.cantidad)));
  const costoM2 = Math.max(0, n(f.costoM2));

  // Ancho que se factura: en modo ancho_rollo, el del rollo (nunca menor que la pieza).
  const anchoRollo = n(f.anchoRolloCm);
  const anchoCobroCm =
    f.modoCobro === "ancho_rollo" ? Math.max(anchoCm, anchoRollo > 0 ? anchoRollo : anchoCm) : anchoCm;

  const areaPiezaM2 = (anchoCm * altoCm) / 10000;
  const areaCobroM2 = (anchoCobroCm * altoCm) / 10000;
  const areaFactM2 = areaCobroM2 * cant;
  const costoMaterial = areaFactM2 * costoM2;

  const ojetesPorPieza = f.ojetesAuto
    ? ojetesPorPerimetro(anchoCm, altoCm, n(f.ojeteCm))
    : Math.max(0, Math.round(n(f.ojetes)));
  const ojetesTotal = ojetesPorPieza * cant;
  const costoOjetes = ojetesTotal * Math.max(0, n(f.ojeteCosto));

  const lineas: LineaCosto[] = [];
  if (costoMaterial > 0) {
    const modoTxt = f.modoCobro === "ancho_rollo" ? `ancho ${fmtNum(anchoCobroCm, 0)} cm` : "mancha";
    lineas.push({
      k: "material",
      label: f.materialNombre || "Material",
      detalle: `${fmtNum(areaFactM2, 2)} m² (${modoTxt}) x ${usd(costoM2)}`,
      monto: costoMaterial,
    });
  }
  if (costoOjetes > 0) {
    lineas.push({
      k: "ojetes",
      label: "Ojetes",
      detalle: `${ojetesTotal} x ${usd(n(f.ojeteCosto), 2)}`,
      monto: costoOjetes,
    });
  }

  const costoTotal = lineas.reduce((s, l) => s + l.monto, 0);
  const pr = precioDesdeCosto(costoTotal, cant, f);
  const precioM2Venta = areaFactM2 > 0 ? pr.ventaTotal / areaFactM2 : 0;

  return {
    areaPiezaM2, areaCobroM2, areaFactM2, ojetesPorPieza, ojetesTotal, precioM2Venta, lineas, ...pr,
  };
}
