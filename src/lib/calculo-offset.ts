/**
 * Motor de costo de OFFSET (producción propia). Puro, sin BD ni UI.
 *
 * El offset es "digital + planchas + arranque + tiraje por millar": se monta el
 * arte en el PLIEGO COMPLETO, se hace una plancha por color y por cara, hay un
 * costo de arranque (makeready) y la impresión se cobra por millar de pliegos.
 * El papel y los acabados se calculan igual que en digital, y todo pasa por la
 * MISMA cola de precio (`precioDesdeCosto`).
 */
import {
  precioDesdeCosto, calcCapacidad, medidaCorte, TAMANOS, n, fmtNum, usd,
  type Unidad, type Escala, type AcabadoSel,
  type ParamsPrecio, type Precio, type LineaCosto,
} from "./calculo";

export interface OffsetAcab {
  id: string; label: string; costo: number; unidad: Unidad; escala: Escala;
}

export interface EntradaOffset extends ParamsPrecio {
  papelNombre?: string;
  precioPliego: number | string;   // costo de un pliego completo
  medida: string;                  // clave de medida del pliego (66x96…)
  tamano: string;                  // tamaño de corte que imprime la prensa (Pliego | 1/2 | 1/4)
  anchoPza: number | string;       // pieza en mm
  altoPza: number | string;
  capacidadManual?: number | string; // override de piezas por corte
  cantidad: number | string;
  merma: number | string;
  pinza: number | string;
  sep: number | string;
  colores: number | string;        // colores por cara (1..4+)
  coloresPasada: number | string;  // colores que imprime la prensa por pasada
  caras: number | string;          // 1 (tiro) | 2 (tiro y retiro)
  costoPlancha: number | string;   // costo de la plancha del tamaño elegido
  costoArranque: number | string;  // por cara
  costoMillar: number | string;    // por millar de pliegos, por pasada
  costoTinta: number | string;     // por millar de pliegos, por color
  acabados: Record<string, AcabadoSel>;
  catalogoAcab: OffsetAcab[];
}

export interface ResultadoOffset extends Precio {
  cap: number; capAuto: number; cols: number; filas: number; rot: boolean;
  corteW: number; corteH: number; frac: number;
  pliegosBase: number; pliegos: number; millaresImp: number;
  colores: number; caras: number; nPlanchas: number; pasadas: number;
  lineas: LineaCosto[];
}

export function calcularOffset(f: EntradaOffset): ResultadoOffset {
  const frac = (TAMANOS.find((t) => t.id === f.tamano) ?? TAMANOS[0]).frac; // por defecto pliego completo
  const [W, H] = medidaCorte(f.medida, frac);
  const w = Math.max(0, n(f.anchoPza));
  const h = Math.max(0, n(f.altoPza));
  const mont = calcCapacidad(w, h, W, H, n(f.pinza), n(f.sep));
  const capAuto = mont.cap;
  const cap = Math.max(1, Math.round(n(f.capacidadManual)) || capAuto || 1);

  const cant = Math.max(0, Math.round(n(f.cantidad)));
  const merma = n(f.merma) / 100;
  const pliegosBase = cant > 0 ? Math.ceil(cant / cap) : 0;
  const pliegos = pliegosBase > 0 ? Math.ceil(pliegosBase * (1 + merma)) : 0; // cortes enteros
  const millaresImp = pliegos > 0 ? Math.ceil(pliegos / 1000) : 0;
  const millaresCortes = millaresImp; // acabados por millar: sobre los cortes

  const caras = n(f.caras) >= 2 ? 2 : 1;
  const colores = Math.max(0, Math.round(n(f.colores)));
  const nPlanchas = colores * caras;
  // Pasadas por cara: una prensa de N colores imprime hasta N colores por pasada.
  const coloresPasada = Math.max(1, Math.round(n(f.coloresPasada)) || 1);
  const pasadas = colores > 0 ? Math.ceil(colores / coloresPasada) : 0;

  const lineas: LineaCosto[] = [];

  // Papel: el corte cuesta una fracción del pliego completo.
  const precioPliego = n(f.precioPliego);
  const precioCorte = precioPliego * frac;
  if (pliegos > 0 && precioCorte > 0) {
    lineas.push({
      k: "papel", label: f.papelNombre || "Papel",
      detalle: `${fmtNum(pliegos, 0)} ${f.tamano} x ${usd(precioCorte, 4)}`,
      monto: pliegos * precioCorte,
    });
  }

  const cPlancha = n(f.costoPlancha);
  if (nPlanchas > 0 && cPlancha > 0) {
    lineas.push({
      k: "planchas", label: "Planchas",
      detalle: `${nPlanchas} (${colores} color${colores !== 1 ? "es" : ""} × ${caras} cara${caras !== 1 ? "s" : ""}) x ${usd(cPlancha, 2)}`,
      monto: nPlanchas * cPlancha,
    });
  }

  const cArr = n(f.costoArranque);
  if (cArr > 0 && pliegos > 0) {
    lineas.push({
      k: "arranque", label: "Arranque / montaje",
      detalle: `${caras} cara${caras !== 1 ? "s" : ""} x ${usd(cArr, 2)}`,
      monto: cArr * caras,
    });
  }

  const cMillar = n(f.costoMillar);
  const impresion = millaresImp * cMillar * pasadas * caras;
  if (impresion > 0) {
    const pasTxt = pasadas !== 1 ? ` × ${pasadas} pasadas` : "";
    lineas.push({
      k: "impresion", label: "Impresión",
      detalle: `${millaresImp} millar${millaresImp !== 1 ? "es" : ""} × ${caras} cara${caras !== 1 ? "s" : ""}${pasTxt} x ${usd(cMillar, 2)}`,
      monto: impresion,
    });
  }

  // Tinta: se consume por color, por cara y por millar de cortes impresos.
  const cTinta = n(f.costoTinta);
  const tinta = millaresImp * cTinta * colores * caras;
  if (tinta > 0) {
    lineas.push({
      k: "tinta", label: "Tinta",
      detalle: `${millaresImp} millar${millaresImp !== 1 ? "es" : ""} × ${colores} color${colores !== 1 ? "es" : ""} × ${caras} cara${caras !== 1 ? "s" : ""} x ${usd(cTinta, 2)}`,
      monto: tinta,
    });
  }

  // Acabados — como en digital: las tarifas están referidas a 1/4 de pliego.
  const factor = frac / 0.25;
  for (const a of f.catalogoAcab) {
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
      detalle = `${fmtNum(pliegos, 0)} ${f.tamano} x ${usd(unit, 4)}${mult}`;
    } else if (a.unidad === "elemento") {
      monto = cant * unit * q;
      detalle = `${fmtNum(cant, 0)} pzs x ${usd(unit, 4)}${mult}`;
    } else if (a.unidad === "millar") {
      monto = millaresCortes * unit * q;
      detalle = `${millaresCortes} ${millaresCortes === 1 ? "millar" : "millares"} x ${usd(unit, 2)}`;
    } else {
      monto = unit * q;
      detalle = `${fmtNum(q, 0)} x ${usd(unit, 2)}`;
    }
    lineas.push({ k: a.id, label: a.label, detalle, monto });
  }

  const costoTotal = lineas.reduce((s, l) => s + l.monto, 0);
  const pr = precioDesdeCosto(costoTotal, cant, f);

  return {
    cap, capAuto, cols: mont.cols, filas: mont.filas, rot: mont.rot,
    corteW: W, corteH: H, frac, pliegosBase, pliegos, millaresImp,
    colores, caras, nPlanchas, pasadas, lineas, ...pr,
  };
}
