/**
 * Motor de cálculo de costos y precios de imprenta.
 *
 * Módulo puro: no depende de React, de la base de datos ni del navegador.
 * Toda la aplicación (UI, API, PDF, órdenes) debe calcular a través de aquí.
 *
 * Verificado contra el trabajo real de Jugarte Venezuela (3.000 stickers):
 * 772,5 cortes · $679,47 costo · $0,2265 unitario · diferencial 1,3929 ·
 * $0,5038 precio unitario · $1.511,47 venta. Ver calculo.test.ts.
 * (El troquelado se cobra por millar de cortes, no de piezas.)
 */

export type Unidad = "pliego" | "elemento" | "millar" | "trabajo";
export type Escala = "area" | "min" | "fija";
export type MedidaKey = "66x96" | "68x96" | "70x100";

export interface Papel {
  id: string;
  nombre: string;
  hojas: number;   // hojas por resma / paquete
  precio: number;  // precio USD de la resma completa
  med: MedidaKey;
}

export interface Acabado {
  id: string;      // clave estable, p. ej. "impTiro"
  label: string;
  costo: number;   // tarifa base, referida a 1/4 de pliego
  unidad: Unidad;
  escala: Escala;  // solo aplica cuando unidad === "pliego"
  /**
   * Acabados que comparten `grupo` son mutuamente excluyentes en la
   * calculadora (se eligen con un selector, no con casillas). Ej.: los tres
   * niveles de troquel. El motor lo ignora: cada acabado se cobra igual.
   */
  grupo?: string | null;
}

export interface Config {
  papeles: Papel[];
  acabados: Acabado[];
  merma: number;      // % de error de consumo de papel
  margen: number;     // % de margen sobre el precio
  comision: number;   // % de comisión del vendedor
  ml: number;         // % de recargo para MercadoLibre
  tasaBCV: number;
  binCompra: number;
  binVenta: number;
  pinza: number;      // mm no imprimibles en cada borde
  sep: number;        // mm de separación entre piezas
}

/** Estado de un acabado dentro de un trabajo: activo y cuántas veces se cobra. */
export interface AcabadoSel { on: boolean; q: number | string }

export interface Entrada {
  cantidad: number | string;
  capacidad: number | string;   // piezas por corte
  merma: number | string;
  tamano: string;               // "Pliego" | "1/2 Pliego" | "1/4 Pliego" | "1/8 Pliego"
  papelId: string;
  acabados: Record<string, AcabadoSel>;
  margen: number | string;
  comision: number | string;
  ml: number | string;
  tasaBCV: number | string;
  binCompra: number | string;
  binVenta: number | string;
  difManual?: boolean;
  dif?: number | string;
}

export interface LineaCosto {
  k: string;
  label: string;
  detalle: string;
  monto: number;
}

/** Parámetros de precio (diferencial, margen, comisión) — comunes a todo cálculo. */
export interface ParamsPrecio {
  margen: number | string;
  comision: number | string;
  ml: number | string;
  tasaBCV: number | string;
  binCompra: number | string;
  binVenta: number | string;
  difManual?: boolean;
  dif?: number | string;
}

/** Resultado de precio a partir de un costo. */
export interface Precio {
  costoTotal: number; costoUnit: number;
  binProm: number; difAuto: number; dif: number;
  costoProt: number; utilidad: number; utilProt: number;
  precioSinCom: number; precioUnit: number;
  ventaTotal: number; precioML: number; precioBs: number;
  gananciaTotal: number; cant: number;
}

export interface Resultado extends Precio {
  frac: number; factor: number;
  precioPliego: number; precioCorte: number;
  pliegosBase: number; pliegos: number; piezas: number; millares: number;
  lineas: LineaCosto[];
}

export const TAMANOS = [
  { id: "Pliego", frac: 1 },
  { id: "1/2 Pliego", frac: 0.5 },
  { id: "1/4 Pliego", frac: 0.25 },
  { id: "1/8 Pliego", frac: 0.125 },
] as const;

export const MEDIDAS: Record<MedidaKey, [number, number]> = {
  "66x96": [660, 960],
  "68x96": [680, 960],
  "70x100": [700, 1000],
};

/* ------------------------------- formato ------------------------------- */

/** Parsea números aceptando coma decimal (formato venezolano). Nunca devuelve NaN. */
export function n(v: unknown): number {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const x = parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return isFinite(x) ? x : 0;
}

/** Formato es-VE: miles con punto, decimales con coma. */
export function fmtNum(v: number, d = 2): string {
  const x = isFinite(v) ? v : 0;
  const [i, f] = Math.abs(x).toFixed(d).split(".");
  const ii = i.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (x < 0 ? "-" : "") + ii + (f ? "," + f : "");
}

export const usd = (v: number, d = 2) => "$" + fmtNum(v, d);
export const bs = (v: number, d = 2) => fmtNum(v, d) + " Bs";

/* ------------------------------- montaje ------------------------------- */

/** Dimensiones en mm del corte, partiendo el pliego por el lado más largo. */
export function medidaCorte(medKey: string, frac: number): [number, number] {
  let [a, b] = MEDIDAS[medKey as MedidaKey] ?? MEDIDAS["70x100"];
  const cortes = Math.round(Math.log2(1 / frac));
  for (let i = 0; i < cortes; i++) {
    if (b >= a) b = b / 2; else a = a / 2;
  }
  return [Math.round(a), Math.round(b)];
}

export interface Montaje { cap: number; cols: number; filas: number; rot: boolean }

/** Cuántas piezas de w×h caben en un corte de W×H, probando las dos orientaciones. */
export function calcCapacidad(
  w: number, h: number, W: number, H: number, pinza: number, sep: number,
): Montaje {
  if (w <= 0 || h <= 0) return { cap: 0, cols: 0, filas: 0, rot: false };
  const uw = W - 2 * pinza, uh = H - 2 * pinza;
  const fit = (a: number, b: number) => ({
    c: Math.floor((uw + sep) / (a + sep)),
    f: Math.floor((uh + sep) / (b + sep)),
  });
  const A = fit(w, h), B = fit(h, w);
  const ca = Math.max(0, A.c) * Math.max(0, A.f);
  const cb = Math.max(0, B.c) * Math.max(0, B.f);
  return cb > ca
    ? { cap: cb, cols: B.c, filas: B.f, rot: true }
    : { cap: ca, cols: A.c, filas: A.f, rot: false };
}

/* --------------------------- motor de cálculo --------------------------- */

/**
 * Precio de venta a partir de un costo total. Aplica el diferencial cambiario
 * (dos veces: al costo y a la utilidad), el margen sobre el precio y la
 * comisión del vendedor. Lo usan tanto `calcular()` (costo de papel + acabados)
 * como las cotizaciones de proveedor (costo que da un tercero).
 */
export function precioDesdeCosto(costoTotal: number, cant: number, p: ParamsPrecio): Precio {
  const costoUnit = cant > 0 ? costoTotal / cant : 0;

  // Diferencial cambiario: promedio Binance sobre tasa BCV.
  const binProm = (n(p.binCompra) + n(p.binVenta)) / 2;
  const difAuto = n(p.tasaBCV) > 0 ? binProm / n(p.tasaBCV) : 1;
  const dif = p.difManual ? (n(p.dif) || 1) : difAuto;

  const costoProt = costoUnit * dif;
  const m = Math.min(0.95, Math.max(0, n(p.margen) / 100));
  const utilidad = costoProt * (m / (1 - m)); // margen sobre precio, no sobre costo
  const utilProt = utilidad * dif;

  const precioSinCom = costoProt + utilProt;
  const com = Math.min(0.9, Math.max(0, n(p.comision) / 100));
  const precioUnit = com > 0 ? precioSinCom / (1 - com) : precioSinCom;

  const ventaTotal = precioUnit * cant;
  const precioML = precioUnit * (1 + n(p.ml) / 100);
  const precioBs = precioUnit * n(p.tasaBCV);
  const gananciaTotal = ventaTotal - costoTotal;

  return {
    costoTotal, costoUnit, binProm, difAuto, dif, costoProt, utilidad, utilProt,
    precioSinCom, precioUnit, ventaTotal, precioML, precioBs, gananciaTotal, cant,
  };
}

export function calcular(f: Entrada, cfg: Config): Resultado {
  const tam = TAMANOS.find((t) => t.id === f.tamano) ?? TAMANOS[2];
  const frac = tam.frac;
  const factor = frac / 0.25; // las tarifas están referidas a 1/4 de pliego

  const papel = cfg.papeles.find((p) => p.id === f.papelId) ?? null;
  const precioPliego = papel ? n(papel.precio) / Math.max(1, n(papel.hojas)) : 0;
  const precioCorte = precioPliego * frac;

  const cant = Math.max(0, Math.round(n(f.cantidad)));
  const cap = Math.max(1, Math.round(n(f.capacidad)) || 1);
  const merma = n(f.merma) / 100;

  const pliegosBase = cant > 0 ? Math.ceil(cant / cap) : 0;
  const pliegos = pliegosBase * (1 + merma);
  const piezas = pliegos * cap;
  // La unidad "millar" (troquelado) se cobra por millar de CORTES de papel,
  // no de piezas: el troquel procesa el pliego, no cada pieza suelta.
  const millares = pliegos > 0 ? Math.ceil(pliegos / 1000) : 0;

  const lineas: LineaCosto[] = [];
  if (pliegos > 0 && precioCorte > 0) {
    lineas.push({
      k: "papel",
      label: papel ? papel.nombre : "Papel",
      detalle: `${fmtNum(pliegos, 2)} cortes x ${usd(precioCorte, 4)}`,
      monto: pliegos * precioCorte,
    });
  }

  for (const a of cfg.acabados) {
    const st = f.acabados?.[a.id];
    if (!st || !st.on) continue;
    const q = Math.max(0, n(st.q));
    if (q <= 0) continue;

    const base = n(a.costo);
    const mult = q !== 1 ? ` x ${fmtNum(q, 0)}` : "";
    let unit = base, monto = 0, detalle = "";

    if (a.unidad === "pliego") {
      const esc = a.escala === "area" ? factor : a.escala === "min" ? Math.max(1, factor) : 1;
      unit = base * esc;
      monto = pliegos * unit * q;
      detalle = `${fmtNum(pliegos, 2)} cortes x ${usd(unit, 4)}${mult}`;
    } else if (a.unidad === "elemento") {
      monto = cant * unit * q;
      detalle = `${fmtNum(cant, 0)} pzs x ${usd(unit, 4)}${mult}`;
    } else if (a.unidad === "millar") {
      monto = millares * unit * q;
      detalle = `${millares} ${millares === 1 ? "millar de cortes" : "millares de cortes"} x ${usd(unit, 2)}`;
    } else {
      monto = unit * q;
      detalle = `${fmtNum(q, 0)} x ${usd(unit, 2)}`;
    }
    lineas.push({ k: a.id, label: a.label, detalle, monto });
  }

  const costoTotal = lineas.reduce((s, l) => s + l.monto, 0);
  const pr = precioDesdeCosto(costoTotal, cant, f);

  return {
    frac, factor, precioPliego, precioCorte, pliegosBase, pliegos, piezas, millares,
    lineas, ...pr,
  };
}

/** Compara el mismo trabajo a distintos tirajes. */
export function comparar(f: Entrada, cfg: Config, cantidades: number[]) {
  return cantidades
    .filter((c) => c > 0)
    .sort((a, b) => a - b)
    .map((cantidad) => ({ cantidad, ...calcular({ ...f, cantidad }, cfg) }));
}
