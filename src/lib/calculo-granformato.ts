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

export type ModoCobroGF = "mancha" | "ancho_rollo" | "etiqueta";

/** Tabla de rendimiento de etiquetas: "3x3:660,4x4:510" → [{tam,uds}]. */
export type RendEtiqueta = { tam: string; uds: number };
export function parseTablaEtq(s: string): RendEtiqueta[] {
  return (s ?? "")
    .split(/[,;]+/)
    .map((par) => {
      const [tam, uds] = par.split(":");
      return { tam: (tam ?? "").trim(), uds: Math.max(0, Math.round(n(uds))) };
    })
    .filter((e) => e.tam && e.uds > 0);
}

/** Área de un montaje "125x70" (cm) en m². */
export function areaMontajeM2(montaje: string): number {
  const [w, h] = (montaje ?? "").split(/[x×]/i).map((v) => n(v));
  return w > 0 && h > 0 ? (w * h) / 10000 : 0;
}

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
  montajes: number;      // láminas de montaje (modo etiqueta)
  lineas: LineaCosto[];
}

/**
 * Etiquetas / stickers: se imprimen en LÁMINAS de montaje (ej. 125×70 cm) y cada
 * lámina rinde N etiquetas según su tamaño (3×3 → 660, etc.). El costo es el área
 * de las láminas necesarias × el costo por m². El precio se reparte entre las
 * etiquetas pedidas.
 */
export interface EntradaEtiquetaGF extends ParamsPrecio {
  materialNombre?: string;
  tamano: string;                  // "4x4"
  cantidad: number | string;       // etiquetas pedidas
  costoM2: number | string;
  montaje: string;                 // "125x70" (cm)
  unidadesMontaje: number | string; // etiquetas por lámina, para el tamaño elegido
}

export function calcularEtiquetaGF(f: EntradaEtiquetaGF): ResultadoGF {
  const cant = Math.max(0, Math.round(n(f.cantidad)));
  const uds = Math.max(1, Math.round(n(f.unidadesMontaje)) || 1);
  const costoM2 = Math.max(0, n(f.costoM2));
  const montajeM2 = areaMontajeM2(f.montaje);

  const montajes = cant > 0 ? Math.ceil(cant / uds) : 0;
  const areaFactM2 = montajes * montajeM2;
  const costoMaterial = areaFactM2 * costoM2;

  const lineas: LineaCosto[] = [];
  if (costoMaterial > 0) {
    lineas.push({
      k: "material",
      label: f.materialNombre || "Etiqueta",
      detalle: `${montajes} montaje${montajes !== 1 ? "s" : ""} (${uds} uds ${f.tamano}) · ${fmtNum(areaFactM2, 2)} m² x ${usd(costoM2)}`,
      monto: costoMaterial,
    });
  }

  const pr = precioDesdeCosto(costoMaterial, cant, f);
  const precioM2Venta = areaFactM2 > 0 ? pr.ventaTotal / areaFactM2 : 0;
  return {
    areaPiezaM2: 0, areaCobroM2: 0, areaFactM2,
    ojetesPorPieza: 0, ojetesTotal: 0, precioM2Venta, montajes, lineas, ...pr,
  };
}

/**
 * Producto terminado de gran formato: costo FIJO por unidad (del catálogo), sin
 * cálculo por m². Se cobra por pieza y pasa por la misma cola de precio. Devuelve
 * un ResultadoGF con las medidas de área/ojetes en cero (no aplican).
 */
export interface EntradaProductoGF extends ParamsPrecio {
  productoNombre?: string;
  costoUnit: number | string;
  cantidad: number | string;
}

export function calcularProductoGF(f: EntradaProductoGF): ResultadoGF {
  const cant = Math.max(0, Math.round(n(f.cantidad)));
  const costoUnit = Math.max(0, n(f.costoUnit));
  const costoTotal = costoUnit * cant;

  const lineas: LineaCosto[] = [];
  if (costoTotal > 0) {
    lineas.push({
      k: "producto",
      label: f.productoNombre || "Producto terminado",
      detalle: `${cant} x ${usd(costoUnit)}`,
      monto: costoTotal,
    });
  }

  const pr = precioDesdeCosto(costoTotal, cant, f);
  return {
    areaPiezaM2: 0, areaCobroM2: 0, areaFactM2: 0,
    ojetesPorPieza: 0, ojetesTotal: 0, precioM2Venta: 0, montajes: 0, lineas, ...pr,
  };
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
    areaPiezaM2, areaCobroM2, areaFactM2, ojetesPorPieza, ojetesTotal, precioM2Venta, montajes: 0, lineas, ...pr,
  };
}
