import { useState, useEffect, useMemo, Fragment } from "react";
import {
  Calculator, Database, SlidersHorizontal, Save, Trash2, Copy,
  Download, Search, Plus, RotateCcw, Check, AlertTriangle, TrendingDown
} from "lucide-react";

/* ============================ DATOS BASE ============================ */

const K_CFG = "imprenta:config:v1";
const K_COT = "imprenta:cotizaciones:v1";

const TAMANOS = [
  { id: "Pliego", frac: 1 },
  { id: "1/2 Pliego", frac: 0.5 },
  { id: "1/4 Pliego", frac: 0.25 },
  { id: "1/8 Pliego", frac: 0.125 },
];

const MEDIDAS = { "66x96": [660, 960], "68x96": [680, 960], "70x100": [700, 1000] };

const PAPELES_BASE = [
  ["Bond 16/56 Gr.-500", 500, 45, "66x96"],
  ["Bond 20/75 Gr.-500", 500, 53, "66x96"],
  ["Bond 24/90 Gr.-500", 500, 65, "66x96"],
  ["Bond 120 Gr.-250", 250, 47, "66x96"],
  ["Papel Imprenta 45 Gr.-500", 500, 25, "68x96"],
  ["Bristol 90/150 Gr.-250", 250, 60, "66x96"],
  ["Bristol 110/210 Gr.-125", 125, 42, "66x96"],
  ["Bristol 240 Gr.-125", 125, 47, "66x96"],
  ["C.B. Blanco 55 Gr.-500", 500, 70, "66x96"],
  ["C.F.B. Colores 50 Gr.-500", 500, 75, "66x96"],
  ["C.F. Colores 55 Gr.-500", 500, 70, "66x96"],
  ["Glase 80 Gr.-500", 500, 60, "66x96"],
  ["Glase 90 Gr.-250", 250, 33, "66x96"],
  ["Glase 100 Gr.-500", 500, 75, "66x96"],
  ["Glase/Mate 115 Gr.-250", 250, 39, "66x96"],
  ["Mate/Glase 150 Gr.-250", 250, 53, "66x96"],
  ["Mate 200 Gr.-100", 100, 32, "66x96"],
  ["Glase 200 Gr.-125", 125, 35, "66x96"],
  ["Mate 250 Gr.-125", 125, 49, "66x96"],
  ["Glase 250 Gr.-100", 100, 40, "66x96"],
  ["Glase 300 Gr.-100", 100, 52, "66x96"],
  ["Mate/Glase 350 Gr.-125", 125, 59, "66x96"],
  ["Cartón MM (Mitabell) 400 Gr.", 1, 0.56, "70x100"],
  ["SBS Cal. 0.12 (205 Gr.)-3125", 3125, 1026, "70x100"],
  ["SBS Cal. 0.12 (205 Gr.)-125", 125, 42, "70x100"],
  ["SBS Cal. 0.16 (260 Gr.)-2300", 2300, 690, "70x100"],
  ["SBS Cal. 0.16 (260 Gr.)-100", 100, 35, "70x100"],
  ["SBS Cal. 0.18 (285 Gr.)-2000", 2000, 890, "70x100"],
  ["SBS Cal. 0.18 (285 Gr.)-100", 100, 50, "70x100"],
  ["SBS Cal. 0.20 (325 Gr.)-1800", 1800, 972, "70x100"],
  ["SBS Cal. 0.20 (325 Gr.)-100", 100, 60, "70x100"],
  ["SBS Cal. 0.22 (350 Gr.)-1700", 1700, 1003, "70x100"],
  ["SBS Cal. 0.22 (350 Gr.)-100", 100, 65, "70x100"],
  ["SBS Cal. 0.24 (380 Gr.)-1600", 1600, 960, "70x100"],
  ["SBS Cal. 0.24 (380 Gr.)-100", 100, 70, "70x100"],
  ["R. Periódico Cal. 0.20 (400 Gr.)-100", 100, 60, "70x100"],
  ["Litho 90-250", 250, 34, "66x96"],
  ["Litho Autoadhesivo-200", 200, 130, "70x100"],
  ["Papel Antigrasa (40 Gr.)-500", 500, 65, "66x96"],
  ["Snowbright Cream (60 Gr.)-500", 500, 49, "66x96"],
  ["Snowbright Cream (80 Gr.)-250", 250, 34, "66x96"],
  ["Kraft 80 Gr.-500", 500, 75, "70x100"],
  ["Snowbright Cream libros (80 Gr.)-250", 250, 31, "66x96"],
].map(([nombre, hojas, precio, med]) => ({ id: nombre, nombre, hojas, precio, med }));

/* unidad: pliego | elemento | millar | trabajo
   escala: area (x factor de tamano) | min (nunca baja del costo base) | fija */
const ACABADOS_BASE = [
  { id: "impTiro", label: "Impresión Tiro", costo: 0.264, unidad: "pliego", escala: "area" },
  { id: "impRetiro", label: "Impresión Retiro", costo: 0.264, unidad: "pliego", escala: "area" },
  { id: "lamTiro", label: "Laminado Tiro", costo: 0.33, unidad: "pliego", escala: "area" },
  { id: "lamRetiro", label: "Laminado Retiro", costo: 0.33, unidad: "pliego", escala: "area" },
  { id: "troqDig", label: "Troquelado Digital", costo: 0.5, unidad: "pliego", escala: "min" },
  { id: "troquel", label: "Troquel", costo: 100, unidad: "trabajo", escala: "fija" },
  { id: "troquelado", label: "Troquelado", costo: 15, unidad: "millar", escala: "fija" },
  { id: "pegado", label: "Pegado", costo: 0.03, unidad: "elemento", escala: "fija" },
  { id: "acetato", label: "Acetato Dangler", costo: 0.05, unidad: "elemento", escala: "fija" },
  { id: "guillotina", label: "Guillotina", costo: 5, unidad: "trabajo", escala: "fija" },
  { id: "prueba", label: "Prueba de Color", costo: 5, unidad: "trabajo", escala: "fija" },
];

const CFG_BASE = {
  papeles: PAPELES_BASE,
  acabados: ACABADOS_BASE,
  merma: 3,
  margen: 30,
  comision: 0,
  ml: 12,
  tasaBCV: 473,
  binCompra: 659.71,
  binVenta: 658.01,
  pinza: 5,
  sep: 3,
};

/* ============================ UTILIDADES ============================ */

const n = (v) => {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const x = parseFloat(String(v == null ? "" : v).replace(/\s/g, "").replace(",", "."));
  return isFinite(x) ? x : 0;
};

const fmtNum = (v, d = 2) => {
  const x = isFinite(v) ? v : 0;
  const s = Math.abs(x).toFixed(d);
  const [i, f] = s.split(".");
  const ii = i.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (x < 0 ? "-" : "") + ii + (f ? "," + f : "");
};
const usd = (v, d = 2) => "$" + fmtNum(v, d);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function medidaCorte(medKey, frac) {
  let [a, b] = MEDIDAS[medKey] || MEDIDAS["70x100"];
  const cortes = Math.round(Math.log2(1 / frac));
  for (let i = 0; i < cortes; i++) {
    if (b >= a) b = b / 2; else a = a / 2;
  }
  return [Math.round(a), Math.round(b)];
}

function calcCapacidad(w, h, W, H, pinza, sep) {
  if (w <= 0 || h <= 0) return { cap: 0, cols: 0, filas: 0, rot: false };
  const uw = W - 2 * pinza, uh = H - 2 * pinza;
  const fit = (a, b) => ({
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

/* ========================= MOTOR DE CALCULO ========================= */

function calcular(f, cfg) {
  const tam = TAMANOS.find((t) => t.id === f.tamano) || TAMANOS[2];
  const frac = tam.frac;
  const factor = frac / 0.25;

  const papel = cfg.papeles.find((p) => p.id === f.papelId) || null;
  const precioPliego = papel ? n(papel.precio) / Math.max(1, n(papel.hojas)) : 0;
  const precioCorte = precioPliego * frac;

  const cant = Math.max(0, Math.round(n(f.cantidad)));
  const cap = Math.max(1, Math.round(n(f.capacidad)) || 1);
  const merma = n(f.merma) / 100;

  const pliegosBase = cant > 0 ? Math.ceil(cant / cap) : 0;
  const pliegos = pliegosBase * (1 + merma);
  const piezas = pliegos * cap;
  const millares = piezas > 0 ? Math.ceil(piezas / 1000) : 0;

  const lineas = [];
  if (pliegos > 0 && precioCorte > 0) {
    lineas.push({
      k: "papel",
      label: papel ? papel.nombre : "Papel",
      detalle: fmtNum(pliegos, 2) + " cortes x " + usd(precioCorte, 4),
      monto: pliegos * precioCorte,
    });
  }

  for (const a of cfg.acabados) {
    const st = f.acabados[a.id];
    if (!st || !st.on) continue;
    const q = Math.max(0, n(st.q));
    if (q <= 0) continue;
    const base = n(a.costo);
    let unit = base, monto = 0, detalle = "";
    const mult = q !== 1 ? " x " + fmtNum(q, 0) : "";

    if (a.unidad === "pliego") {
      const esc = a.escala === "area" ? factor : a.escala === "min" ? Math.max(1, factor) : 1;
      unit = base * esc;
      monto = pliegos * unit * q;
      detalle = fmtNum(pliegos, 2) + " cortes x " + usd(unit, 4) + mult;
    } else if (a.unidad === "elemento") {
      monto = cant * unit * q;
      detalle = fmtNum(cant, 0) + " pzs x " + usd(unit, 4) + mult;
    } else if (a.unidad === "millar") {
      monto = millares * unit * q;
      detalle = millares + (millares === 1 ? " millar x " : " millares x ") + usd(unit, 2);
    } else {
      monto = unit * q;
      detalle = fmtNum(q, 0) + " x " + usd(unit, 2);
    }
    lineas.push({ k: a.id, label: a.label, detalle, monto });
  }

  const costoTotal = lineas.reduce((s, l) => s + l.monto, 0);
  const costoUnit = cant > 0 ? costoTotal / cant : 0;

  const binProm = (n(f.binCompra) + n(f.binVenta)) / 2;
  const difAuto = n(f.tasaBCV) > 0 ? binProm / n(f.tasaBCV) : 1;
  const dif = f.difManual ? (n(f.dif) || 1) : difAuto;

  const costoProt = costoUnit * dif;
  const m = Math.min(0.95, Math.max(0, n(f.margen) / 100));
  const utilidad = costoProt * (m / (1 - m));
  const utilProt = utilidad * dif;

  let precioUnit = costoProt + utilProt;
  const com = Math.min(0.9, Math.max(0, n(f.comision) / 100));
  const precioSinCom = precioUnit;
  if (com > 0) precioUnit = precioUnit / (1 - com);

  const ventaTotal = precioUnit * cant;
  const precioML = precioUnit * (1 + n(f.ml) / 100);
  const precioBs = precioUnit * n(f.tasaBCV);
  const gananciaTotal = ventaTotal - costoTotal;

  return {
    frac, factor, precioPliego, precioCorte, pliegosBase, pliegos, piezas, millares,
    lineas, costoTotal, costoUnit, binProm, difAuto, dif, costoProt, utilidad,
    utilProt, precioSinCom, precioUnit, ventaTotal, precioML, precioBs,
    gananciaTotal, cant,
  };
}

/* ============================== ESTILOS ============================== */

const CSS = `
.pr{--plate:#E3E7E3;--sheet:#FCFCFB;--ink:#171B19;--rule:#C4CBC5;--soft:#EFF2EF;
--kraft:#767D76;--cyan:#0B8FA8;--mag:#C4177C;--ok:#15794F;
font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;color:var(--ink);
background:var(--plate);min-height:100%;padding:0 0 48px;-webkit-font-smoothing:antialiased}
.pr *{box-sizing:border-box}
.pr button{font-family:inherit;cursor:pointer}
.pr :focus-visible{outline:2px solid var(--cyan);outline-offset:2px}
.mono{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-variant-numeric:tabular-nums}
.wrap{max-width:1180px;margin:0 auto;padding:0 20px}

.hd{background:var(--sheet);border-bottom:1px solid var(--rule);position:sticky;top:0;z-index:20}
.inkbar{display:flex;height:5px}
.inkbar i{flex:1}
.hdin{display:flex;align-items:center;gap:14px;padding:14px 0 0;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:10px}
.brand h1{margin:0;font-size:15px;font-weight:700;letter-spacing:-.2px}
.brand p{margin:2px 0 0;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--kraft)}
.tabs{display:flex;gap:2px;margin-left:auto;align-self:flex-end}
.tab{border:1px solid var(--rule);border-bottom:none;background:var(--soft);color:var(--kraft);
padding:9px 15px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:7px;
border-radius:3px 3px 0 0;position:relative;top:1px}
.tab.on{background:var(--sheet);color:var(--ink);box-shadow:inset 0 3px 0 var(--cyan)}

.grid{display:grid;grid-template-columns:1fr 380px;gap:18px;align-items:start;margin-top:18px}
@media(max-width:900px){.grid{grid-template-columns:1fr}}

.card{background:var(--sheet);border:1px solid var(--rule);border-radius:3px;margin-bottom:14px}
.ch{display:flex;align-items:center;gap:8px;padding:9px 14px;border-bottom:1px solid var(--rule);background:var(--soft);flex-wrap:wrap}
.ch b{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700}
.ch span.mt{margin-left:auto;font-size:10.5px;color:var(--kraft)}
.cb{padding:14px}

.row{display:grid;gap:10px}
.c2{grid-template-columns:1fr 1fr}
.c3{grid-template-columns:1fr 1fr 1fr}
.c4{grid-template-columns:repeat(4,1fr)}
@media(max-width:620px){.c3,.c4{grid-template-columns:1fr 1fr}}

label.fl{display:block;font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;
color:var(--kraft);font-weight:700;margin-bottom:4px}
.in{width:100%;border:1px solid var(--rule);background:#fff;border-radius:2px;padding:7px 9px;
font-size:13px;color:var(--ink);font-family:inherit}
.in:focus{border-color:var(--cyan);outline:none;box-shadow:0 0 0 2px rgba(11,143,168,.15)}
select.in{cursor:pointer}
.hint{font-size:10.5px;color:var(--kraft);margin-top:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.lnk{background:none;border:none;color:var(--cyan);font-size:10.5px;font-weight:700;padding:0;text-decoration:underline}

.acs{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:2px}
@media(max-width:620px){.acs{grid-template-columns:1fr}}
.ac{background:var(--sheet);display:flex;align-items:center;gap:9px;padding:8px 10px}
.ac.on{background:#fff;box-shadow:inset 3px 0 0 var(--cyan)}
.ac .nm{font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ac .un{font-size:9.5px;color:var(--kraft);letter-spacing:.06em}
.ac input[type=text]{width:52px;text-align:right;border:1px solid var(--rule);border-radius:2px;
padding:3px 5px;font-size:11.5px;font-family:ui-monospace,Menlo,monospace}
.chk{width:15px;height:15px;border:1.5px solid var(--kraft);border-radius:2px;background:#fff;
display:flex;align-items:center;justify-content:center;flex:0 0 auto;padding:0;color:#fff}
.chk.on{background:var(--cyan);border-color:var(--cyan)}

.tick{position:sticky;top:82px}
.tk{background:var(--sheet);border:1px solid var(--rule);border-radius:3px 3px 0 0;overflow:hidden}
.tkh{padding:11px 14px;border-bottom:1px dashed var(--rule);display:flex;align-items:baseline;gap:8px}
.tkh b{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase}
.tkh span{margin-left:auto;font-size:10.5px;color:var(--kraft)}
.bar{display:flex;height:9px;background:var(--soft)}
.bar i{transition:width .25s}
.li{display:flex;gap:9px;padding:6px 14px;font-size:12px;align-items:baseline}
.li .d{font-size:10px;color:var(--kraft);display:block;margin-top:1px}
.li .a{margin-left:auto;white-space:nowrap;font-size:12px}
.dot{width:7px;height:7px;border-radius:1px;flex:0 0 auto;position:relative;top:-1px}
.sep{border-top:1px dashed var(--rule);margin:8px 0}
.tot{display:flex;align-items:baseline;padding:5px 14px;font-size:12px}
.tot .a{margin-left:auto}
.tot.big{font-size:13px;font-weight:700}
.price{background:var(--ink);color:#fff;padding:13px 14px}
.price .lb{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#9AA39C}
.price .v{font-size:27px;font-weight:700;letter-spacing:-1px;line-height:1.1;margin-top:2px}
.price .sub{display:flex;gap:14px;margin-top:8px;padding-top:8px;border-top:1px solid #333937;font-size:11px;color:#B9C1BA}
.price .sub b{color:#fff}
.tear{height:10px;background:var(--sheet);border:1px solid var(--rule);border-top:none;border-radius:0 0 3px 3px;
background-image:radial-gradient(circle at 5px 10px,var(--plate) 4px,transparent 4px);background-size:10px 10px}

.btn{border:1px solid var(--ink);background:var(--ink);color:#fff;border-radius:2px;padding:9px 14px;
font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:7px}
.btn:hover{background:#000}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn.g{background:var(--sheet);color:var(--ink);border-color:var(--rule)}
.btn.g:hover{background:var(--soft)}
.btn.sm{padding:5px 9px;font-size:11px}
.btn.dg{border-color:#B33;color:#B33;background:var(--sheet)}
.btn.w{width:100%;margin-top:10px}

table{width:100%;border-collapse:collapse}
th{font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--kraft);text-align:left;
padding:7px 10px;border-bottom:1px solid var(--rule);font-weight:700;white-space:nowrap}
td{padding:8px 10px;border-bottom:1px solid var(--soft);font-size:12px;vertical-align:middle}
tr.rw:hover td{background:var(--soft)}
.ta-r{text-align:right}
.tw{overflow-x:auto}

.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
@media(max-width:700px){.kpis{grid-template-columns:1fr 1fr}}
.kpi{background:var(--sheet);border:1px solid var(--rule);border-radius:3px;padding:11px 13px}
.kpi .l{font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--kraft);font-weight:700}
.kpi .v{font-size:19px;font-weight:700;letter-spacing:-.5px;margin-top:3px}

.empty{text-align:center;padding:44px 20px;color:var(--kraft)}
.empty b{display:block;font-size:13px;color:var(--ink);margin-bottom:5px}
.empty p{margin:0;font-size:12px}
.warn{display:flex;gap:8px;align-items:flex-start;background:#FFF9E6;border:1px solid #E8D48A;
border-radius:2px;padding:9px 11px;font-size:11.5px;line-height:1.45;color:#5C4A00}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:#fff;
padding:10px 18px;border-radius:3px;font-size:12.5px;font-weight:600;z-index:60;
display:flex;align-items:center;gap:8px;box-shadow:0 6px 24px rgba(0,0,0,.25)}
`;

const TINTAS = ["#0B8FA8", "#C4177C", "#C79400", "#171B19", "#5B8C5A", "#8A5FBF", "#C0563B"];

/* ========================== SUBCOMPONENTES ========================== */

function RegMark({ s = 15 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <path d="M12 0v4.5M12 19.5V24M0 12h4.5M19.5 12H24" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function F({ l, children, hint }) {
  return (
    <div>
      <label className="fl">{l}</label>
      {children}
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

function T({ l, v, set, ph, num }) {
  return (
    <F l={l}>
      <input
        className={num ? "in mono" : "in"}
        type="text"
        inputMode={num ? "decimal" : "text"}
        value={v}
        placeholder={ph || ""}
        onChange={(e) => set(e.target.value)}
      />
    </F>
  );
}

function Montaje({ W, H, w, h, info }) {
  if (!info.cap || !w || !h) return null;
  const k = Math.min(150 / W, 118 / H);
  const pw = (info.rot ? h : w) * k, ph = (info.rot ? w : h) * k;
  const cells = [];
  for (let rr = 0; rr < Math.min(info.filas, 40); rr++) {
    for (let cc = 0; cc < Math.min(info.cols, 40); cc++) {
      cells.push(
        <rect key={rr + "-" + cc} x={4 + cc * (pw + 1.4)} y={4 + rr * (ph + 1.4)}
          width={pw} height={ph} fill="rgba(11,143,168,.16)" stroke="#0B8FA8" strokeWidth="0.6" />
      );
    }
  }
  return (
    <svg width={W * k + 8} height={H * k + 8} style={{ maxWidth: "100%" }}>
      <rect x="0.5" y="0.5" width={W * k + 7} height={H * k + 7} fill="#fff" stroke="#C4CBC5" />
      {cells}
    </svg>
  );
}

function Curva({ pts, actual }) {
  if (pts.length < 2) return null;
  const W = 620, H = 128, ml = 8, mr = 8, mt = 12, mb = 24;
  const vals = pts.map((p) => p.precioUnit);
  const max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
  const span = max - min || max || 1;
  const x = (i) => ml + (i * (W - ml - mr)) / (pts.length - 1);
  const y = (v) => mt + (1 - (v - min) / span) * (H - mt - mb) * 0.86;
  const linea = pts.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.precioUnit).toFixed(1)).join(" ");
  const area = linea + " L" + x(pts.length - 1).toFixed(1) + " " + (H - mb) + " L" + ml + " " + (H - mb) + " Z";
  return (
    <svg viewBox={"0 0 " + W + " " + H} width="100%"
      style={{ display: "block", marginTop: 4 }}>
      <line x1={ml} y1={H - mb} x2={W - mr} y2={H - mb} stroke="#C4CBC5" strokeWidth="1" />
      <path d={area} fill="rgba(11,143,168,.10)" />
      <path d={linea} fill="none" stroke="#0B8FA8" strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const on = actual > 0 && p.cant === actual;
        return (
          <g key={p.cant}>
            {on ? <line x1={x(i)} y1={mt} x2={x(i)} y2={H - mb} stroke="#C4177C" strokeWidth="1" strokeDasharray="3 3" /> : null}
            <circle cx={x(i)} cy={y(p.precioUnit)} r={on ? 4.5 : 3}
              fill={on ? "#C4177C" : "#FCFCFB"} stroke={on ? "#C4177C" : "#0B8FA8"} strokeWidth="2" />
            <text x={x(i)} y={y(p.precioUnit) - 9} textAnchor="middle"
              style={{ fontSize: 10.5, fontFamily: "ui-monospace,Menlo,monospace", fill: on ? "#C4177C" : "#171B19", fontWeight: 700 }}>
              {usd(p.precioUnit, p.precioUnit < 1 ? 3 : 2)}
            </text>
            <text x={x(i)} y={H - 8} textAnchor="middle"
              style={{ fontSize: 10, fontFamily: "ui-monospace,Menlo,monospace", fill: "#767D76" }}>
              {fmtNum(p.cant, 0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================ APLICACIÓN ============================ */

export default function App() {
  const [tab, setTab] = useState("calc");
  const [cfg, setCfg] = useState(CFG_BASE);
  const [cots, setCots] = useState([]);
  const [listo, setListo] = useState(false);
  const [toast, setToast] = useState("");
  const [q, setQ] = useState("");
  const [delId, setDelId] = useState(null);
  const [abierta, setAbierta] = useState(null);

  const nuevoForm = (c) => ({
    cliente: "", trabajo: "", descripcion: "",
    ancho: "", alto: "", cantidad: "",
    tamano: "1/4 Pliego", papelId: "",
    capAuto: true, capacidad: "",
    merma: c.merma, margen: c.margen, comision: c.comision, ml: c.ml,
    tasaBCV: c.tasaBCV, binCompra: c.binCompra, binVenta: c.binVenta,
    difManual: false, dif: "",
    acabados: { impTiro: { on: true, q: 1 }, guillotina: { on: true, q: 1 } },
  });

  const [form, setForm] = useState(() => nuevoForm(CFG_BASE));

  const aviso = (m) => { setToast(m); setTimeout(() => setToast(""), 2400); };
  const up = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    (async () => {
      let c = CFG_BASE, list = [];
      try {
        const res = await window.storage.get(K_CFG);
        if (res && res.value) c = { ...CFG_BASE, ...JSON.parse(res.value) };
      } catch (e) { /* primer arranque */ }
      try {
        const res = await window.storage.get(K_COT);
        if (res && res.value) list = JSON.parse(res.value) || [];
      } catch (e) { /* primer arranque */ }
      setCfg(c); setCots(list); setForm(nuevoForm(c)); setListo(true);
    })();
  }, []);

  const guardarCfg = async (c) => {
    setCfg(c);
    try { await window.storage.set(K_CFG, JSON.stringify(c)); }
    catch (e) { aviso("No se pudo guardar la configuración"); }
  };
  const guardarCots = async (list) => {
    setCots(list);
    try { await window.storage.set(K_COT, JSON.stringify(list)); }
    catch (e) { aviso("No se pudo guardar en la base de datos"); }
  };

  const papel = cfg.papeles.find((p) => p.id === form.papelId) || null;
  const frac = (TAMANOS.find((t) => t.id === form.tamano) || TAMANOS[2]).frac;
  const corte = medidaCorte(papel ? papel.med : "70x100", frac);
  const CW = corte[0], CH = corte[1];
  const auto = calcCapacidad(n(form.ancho), n(form.alto), CW, CH, n(cfg.pinza), n(cfg.sep));

  useEffect(() => {
    if (form.capAuto && auto.cap > 0 && String(auto.cap) !== String(form.capacidad)) {
      setForm((f) => ({ ...f, capacidad: auto.cap }));
    }
  }, [auto.cap, form.capAuto]);

  const r = useMemo(() => calcular(form, cfg), [form, cfg]);

  const [escalas, setEscalas] = useState("500, 1000, 3000, 5000, 10000");
  const pts = useMemo(() => {
    const qs = escalas.split(/[,;\s]+/).map((v) => Math.round(n(v)))
      .filter((v) => v > 0).filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a - b).slice(0, 8);
    return qs.map((cant) => {
      const c = calcular({ ...form, cantidad: cant }, cfg);
      return {
        cant, pliegos: c.pliegos, costoTotal: c.costoTotal, costoUnit: c.costoUnit,
        precioUnit: c.precioUnit, ventaTotal: c.ventaTotal, gananciaTotal: c.gananciaTotal,
      };
    });
  }, [escalas, form, cfg]);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return cots;
    return cots.filter((c) =>
      [c.cliente, c.trabajo, c.descripcion].join(" ").toLowerCase().includes(t));
  }, [cots, q]);

  const totalCartera = cots.reduce((s, c) => s + n(c.ventaTotal), 0);
  const gananciaCartera = cots.reduce((s, c) => s + (n(c.ventaTotal) - n(c.costoTotal)), 0);

  const guardar = async () => {
    if (!form.cliente.trim() && !form.trabajo.trim()) { aviso("Falta el cliente o el trabajo"); return; }
    if (r.cant <= 0) { aviso("Indica la cantidad de piezas"); return; }
    const reg = {
      id: uid(), fecha: new Date().toISOString(), estado: "Cotizado",
      cliente: form.cliente || "—", trabajo: form.trabajo || "—", descripcion: form.descripcion,
      medida: n(form.ancho) + "×" + n(form.alto) + " mm", cantidad: r.cant,
      tamano: form.tamano, papel: papel ? papel.nombre : "—", capacidad: n(form.capacidad),
      pliegos: r.pliegos, lineas: r.lineas, costoTotal: r.costoTotal, costoUnit: r.costoUnit,
      dif: r.dif, margen: n(form.margen), precioUnit: r.precioUnit, ventaTotal: r.ventaTotal,
      precioML: r.precioML, tasaBCV: n(form.tasaBCV), precioBs: r.precioBs, form: form,
    };
    await guardarCots([reg].concat(cots));
    aviso("Cotización guardada");
  };

  const cargar = (c) => { setForm({ ...nuevoForm(cfg), ...c.form }); setTab("calc"); aviso("Cotización cargada"); };
  const duplicar = (c) => {
    setForm({ ...nuevoForm(cfg), ...c.form, trabajo: c.trabajo + " (copia)" });
    setTab("calc"); aviso("Copia lista para editar");
  };
  const eliminar = async (id) => {
    await guardarCots(cots.filter((c) => c.id !== id)); setDelId(null); aviso("Cotización eliminada");
  };
  const cambiarEstado = (id, estado) => guardarCots(cots.map((c) => (c.id === id ? { ...c, estado } : c)));

  const exportar = () => {
    const cols = ["Fecha", "Estado", "Cliente", "Trabajo", "Descripción", "Medida", "Cantidad",
      "Tamaño", "Papel", "Cortes", "Costo total USD", "Costo unit USD", "Diferencial",
      "Margen %", "Precio unit USD", "Venta total USD", "Precio MercadoLibre", "Tasa BCV", "Precio unit Bs"];
    const esc = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const num = (v, d) => esc(fmtNum(n(v), d === undefined ? 2 : d));
    const filas = lista.map((c) => [
      esc(new Date(c.fecha).toLocaleDateString("es-VE")), esc(c.estado), esc(c.cliente), esc(c.trabajo),
      esc(c.descripcion), esc(c.medida), num(c.cantidad, 0), esc(c.tamano), esc(c.papel),
      num(c.pliegos), num(c.costoTotal), num(c.costoUnit, 4), num(c.dif, 4), num(c.margen, 0),
      num(c.precioUnit, 4), num(c.ventaTotal), num(c.precioML), num(c.tasaBCV), num(c.precioBs),
    ].join(";"));
    const csv = "\uFEFF" + [cols.map(esc).join(";")].concat(filas).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = "cotizaciones-" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    aviso("Archivo descargado");
  };

  const setAcabado = (id, on, qv) =>
    setForm((f) => ({ ...f, acabados: { ...f.acabados, [id]: { on: on, q: qv } } }));

  if (!listo) {
    return (
      <div className="pr">
        <style>{CSS}</style>
        <div className="wrap"><div className="empty" style={{ paddingTop: 70 }}><b>Abriendo la base de datos…</b></div></div>
      </div>
    );
  }

  return (
    <div className="pr">
      <style>{CSS}</style>

      <header className="hd">
        <div className="inkbar">
          <i style={{ background: "#0B8FA8" }} />
          <i style={{ background: "#C4177C" }} />
          <i style={{ background: "#E0B400" }} />
          <i style={{ background: "#171B19" }} />
        </div>
        <div className="wrap">
          <div className="hdin">
            <div className="brand">
              <span style={{ color: "#0B8FA8" }}><RegMark s={22} /></span>
              <div>
                <h1>Costos y precios de producción</h1>
                <p>{cots.length} cotizaci{cots.length === 1 ? "ón" : "ones"} en base</p>
              </div>
            </div>
            <nav className="tabs">
              <button className={tab === "calc" ? "tab on" : "tab"} onClick={() => setTab("calc")}>
                <Calculator size={13} />Calculadora
              </button>
              <button className={tab === "bd" ? "tab on" : "tab"} onClick={() => setTab("bd")}>
                <Database size={13} />Base de datos
              </button>
              <button className={tab === "cfg" ? "tab on" : "tab"} onClick={() => setTab("cfg")}>
                <SlidersHorizontal size={13} />Variables
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="wrap">
        {tab === "calc" && (
          <div className="grid">
            <div>
              <section className="card">
                <div className="ch"><b>Datos del trabajo</b></div>
                <div className="cb">
                  <div className="row c2">
                    <T l="Cliente" v={form.cliente} set={(v) => up("cliente", v)} ph="Ej. Jugarte Venezuela" />
                    <T l="Trabajo" v={form.trabajo} set={(v) => up("trabajo", v)} ph="Ej. Stickers motivacionales" />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <T l="Descripción" v={form.descripcion} set={(v) => up("descripcion", v)} ph="Ej. Stickers 14×14, 2 hojas" />
                  </div>
                </div>
              </section>

              <section className="card">
                <div className="ch">
                  <b>Formato y material</b>
                  <span className="mt mono">corte de {CW}×{CH} mm</span>
                </div>
                <div className="cb">
                  <div className="row c4">
                    <T l="Ancho (mm)" v={form.ancho} set={(v) => up("ancho", v)} num ph="140" />
                    <T l="Alto (mm)" v={form.alto} set={(v) => up("alto", v)} num ph="140" />
                    <T l="Cantidad" v={form.cantidad} set={(v) => up("cantidad", v)} num ph="3000" />
                    <F l="Tamaño de corte">
                      <select className="in" value={form.tamano} onChange={(e) => up("tamano", e.target.value)}>
                        {TAMANOS.map((t) => <option key={t.id} value={t.id}>{t.id}</option>)}
                      </select>
                    </F>
                  </div>

                  <div className="row c2" style={{ marginTop: 10 }}>
                    <F l="Papel">
                      <select className="in" value={form.papelId} onChange={(e) => up("papelId", e.target.value)}>
                        <option value="">— Selecciona el papel —</option>
                        {cfg.papeles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                      {papel ? (
                        <div className="hint mono">
                          {usd(r.precioPliego, 4)} el pliego · {usd(r.precioCorte, 4)} el corte
                        </div>
                      ) : null}
                    </F>
                    <F l="Merma de papel (%)">
                      <input className="in mono" type="text" inputMode="decimal" value={form.merma}
                        onChange={(e) => up("merma", e.target.value)} />
                      <div className="hint">Error de consumo por trabajo</div>
                    </F>
                  </div>

                  <div className="row c2" style={{ marginTop: 12, alignItems: "start" }}>
                    <F l="Piezas por corte">
                      <input className="in mono" type="text" inputMode="decimal" value={form.capacidad}
                        disabled={form.capAuto}
                        style={form.capAuto ? { background: "#EFF2EF", color: "#767D76" } : undefined}
                        onChange={(e) => up("capacidad", e.target.value)} />
                      <div className="hint">
                        <button className={form.capAuto ? "chk on" : "chk"} style={{ width: 13, height: 13 }}
                          aria-label="Calcular por montaje" onClick={() => up("capAuto", !form.capAuto)}>
                          {form.capAuto ? <Check size={9} strokeWidth={4} /> : null}
                        </button>
                        <span>Calcular por montaje</span>
                        {!form.capAuto && auto.cap > 0 ? (
                          <button className="lnk" onClick={() => up("capacidad", auto.cap)}>usar {auto.cap}</button>
                        ) : null}
                      </div>
                      {auto.cap > 0 ? (
                        <div className="hint mono">
                          {auto.cols}×{auto.filas}{auto.rot ? " rotado" : ""} · pinza {cfg.pinza} mm · sep {cfg.sep} mm
                        </div>
                      ) : null}
                    </F>
                    <div>
                      <label className="fl">Montaje en el corte</label>
                      <Montaje W={CW} H={CH} w={n(form.ancho)} h={n(form.alto)} info={auto} />
                      {auto.cap === 0 && n(form.ancho) > 0 ? (
                        <div className="hint">La pieza no entra en este tamaño de corte.</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>

              <section className="card">
                <div className="ch"><b>Acabados</b><span className="mt">marca lo que lleva el trabajo</span></div>
                <div className="cb">
                  <div className="acs">
                    {cfg.acabados.map((a) => {
                      const st = form.acabados[a.id] || { on: false, q: 1 };
                      const u = a.unidad === "pliego" ? "por corte"
                        : a.unidad === "elemento" ? "por pieza"
                        : a.unidad === "millar" ? "por millar" : "por trabajo";
                      return (
                        <div key={a.id} className={st.on ? "ac on" : "ac"}>
                          <button className={st.on ? "chk on" : "chk"} aria-label={a.label}
                            onClick={() => setAcabado(a.id, !st.on, n(st.q) || 1)}>
                            {st.on ? <Check size={10} strokeWidth={4} /> : null}
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="nm">{a.label}</div>
                            <div className="un mono">{usd(a.costo, n(a.costo) < 1 ? 3 : 2)} {u}</div>
                          </div>
                          {st.on && a.unidad !== "millar" ? (
                            <input type="text" inputMode="decimal" value={st.q}
                              onChange={(e) => setAcabado(a.id, true, e.target.value)} />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="card">
                <div className="ch"><b>Tasas y utilidad</b><span className="mt mono">diferencial {fmtNum(r.dif, 4)}</span></div>
                <div className="cb">
                  <div className="row c3">
                    <T l="Tasa BCV" v={form.tasaBCV} set={(v) => up("tasaBCV", v)} num />
                    <T l="Binance compra" v={form.binCompra} set={(v) => up("binCompra", v)} num />
                    <T l="Binance venta" v={form.binVenta} set={(v) => up("binVenta", v)} num />
                  </div>
                  <div className="hint mono" style={{ marginTop: 6 }}>
                    Promedio {fmtNum(r.binProm, 2)} ÷ BCV {fmtNum(n(form.tasaBCV), 2)} = {fmtNum(r.difAuto, 4)}
                    <button className="lnk" onClick={() => setForm((f) => ({
                      ...f, difManual: !f.difManual, dif: f.difManual ? "" : r.difAuto.toFixed(4),
                    }))}>
                      {form.difManual ? "volver a automático" : "fijar manualmente"}
                    </button>
                  </div>
                  {form.difManual ? (
                    <div style={{ marginTop: 8, maxWidth: 170 }}>
                      <T l="Diferencial fijo" v={form.dif} set={(v) => up("dif", v)} num />
                    </div>
                  ) : null}
                  <div className="row c3" style={{ marginTop: 12 }}>
                    <T l="Margen (%)" v={form.margen} set={(v) => up("margen", v)} num />
                    <T l="Comisión vendedor (%)" v={form.comision} set={(v) => up("comision", v)} num />
                    <T l="Recargo MercadoLibre (%)" v={form.ml} set={(v) => up("ml", v)} num />
                  </div>
                </div>
              </section>
              <section className="card">
                <div className="ch">
                  <b>Comparador por cantidad</b>
                  <span className="mt">mismo trabajo, distintos tirajes</span>
                </div>
                <div className="cb">
                  <F l="Cantidades a comparar" hint="Separadas por coma. Máximo 8.">
                    <input className="in mono" type="text" value={escalas}
                      onChange={(e) => setEscalas(e.target.value)} />
                  </F>

                  {pts.length < 2 || r.precioUnit <= 0 ? (
                    <div className="hint" style={{ marginTop: 10 }}>
                      Elige el papel y al menos dos cantidades para ver la curva.
                    </div>
                  ) : (
                    <>
                      <div style={{ marginTop: 12 }}>
                        <label className="fl">Precio unitario según el tiraje</label>
                        <Curva pts={pts} actual={r.cant} />
                      </div>

                      <div className="tw" style={{ marginTop: 12 }}>
                        <table>
                          <thead>
                            <tr>
                              <th className="ta-r">Cantidad</th>
                              <th className="ta-r">Cortes</th>
                              <th className="ta-r">Costo total</th>
                              <th className="ta-r">Costo unit.</th>
                              <th className="ta-r">Precio unit.</th>
                              <th className="ta-r">Venta total</th>
                              <th className="ta-r">Ganancia</th>
                              <th className="ta-r">vs. {fmtNum(pts[0].cant, 0)}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pts.map((p) => {
                              const on = r.cant > 0 && p.cant === r.cant;
                              const dif = pts[0].precioUnit > 0
                                ? (p.precioUnit / pts[0].precioUnit - 1) * 100 : 0;
                              return (
                                <tr key={p.cant} className="rw"
                                  style={on ? { background: "#FDF0F7", boxShadow: "inset 3px 0 0 #C4177C" } : undefined}>
                                  <td className="ta-r mono">
                                    <b>{fmtNum(p.cant, 0)}</b>
                                    {on ? <span style={{ color: "#C4177C", fontSize: 9.5, marginLeft: 5 }}>ACTUAL</span> : null}
                                  </td>
                                  <td className="ta-r mono" style={{ color: "#767D76" }}>{fmtNum(p.pliegos, 1)}</td>
                                  <td className="ta-r mono" style={{ color: "#767D76" }}>{usd(p.costoTotal)}</td>
                                  <td className="ta-r mono">{usd(p.costoUnit, 4)}</td>
                                  <td className="ta-r mono"><b>{usd(p.precioUnit, 4)}</b></td>
                                  <td className="ta-r mono">{usd(p.ventaTotal)}</td>
                                  <td className="ta-r mono" style={{ color: "#15794F" }}>{usd(p.gananciaTotal)}</td>
                                  <td className="ta-r mono" style={{ color: dif < 0 ? "#15794F" : dif > 0 ? "#B33" : "#767D76" }}>
                                    {dif === 0 ? "—" : (dif > 0 ? "+" : "") + fmtNum(dif, 1) + "%"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {pts.length > 1 && pts[0].precioUnit > 0 ? (
                        <div className="hint" style={{ marginTop: 10, alignItems: "flex-start" }}>
                          <TrendingDown size={13} style={{ color: "#15794F", flex: "0 0 auto", marginTop: 1 }} />
                          <span>
                            Subiendo de <b className="mono">{fmtNum(pts[0].cant, 0)}</b> a{" "}
                            <b className="mono">{fmtNum(pts[pts.length - 1].cant, 0)}</b> piezas, el precio por
                            unidad baja <b className="mono">
                              {fmtNum((1 - pts[pts.length - 1].precioUnit / pts[0].precioUnit) * 100, 1)}%
                            </b>{" "}
                            (de {usd(pts[0].precioUnit, 4)} a {usd(pts[pts.length - 1].precioUnit, 4)}).
                            Los costos fijos del trabajo —troquel, guillotina, prueba de color— se reparten entre más piezas.
                          </span>
                        </div>
                      ) : null}

                      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                        {pts.map((p) => (
                          <button key={p.cant} className="btn g sm"
                            onClick={() => up("cantidad", p.cant)}>
                            Usar {fmtNum(p.cant, 0)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>

            <div className="tick">
              <div className="tk">
                <div className="tkh">
                  <b>Desglose</b>
                  <span className="mono">{fmtNum(r.pliegos, 2)} cortes · {fmtNum(r.piezas, 0)} pzs</span>
                </div>
                <div className="bar">
                  {r.lineas.map((l, i) => (
                    <i key={l.k} style={{
                      width: (r.costoTotal > 0 ? (l.monto / r.costoTotal) * 100 : 0) + "%",
                      background: TINTAS[i % TINTAS.length],
                    }} />
                  ))}
                </div>

                <div style={{ padding: "9px 0 3px" }}>
                  {r.lineas.length === 0 ? (
                    <div className="li" style={{ color: "#767D76" }}>
                      Elige papel, cantidad y acabados para ver el costo.
                    </div>
                  ) : null}
                  {r.lineas.map((l, i) => (
                    <div className="li" key={l.k}>
                      <span className="dot" style={{ background: TINTAS[i % TINTAS.length] }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        {l.label}
                        <span className="d mono">{l.detalle}</span>
                      </span>
                      <span className="a mono">{usd(l.monto)}</span>
                    </div>
                  ))}
                </div>

                <div className="sep" />
                <div className="tot big"><span>Costo total</span><span className="a mono">{usd(r.costoTotal)}</span></div>
                <div className="tot"><span>Costo unitario</span><span className="a mono">{usd(r.costoUnit, 4)}</span></div>
                <div className="sep" />
                <div className="tot" style={{ color: "#767D76" }}>
                  <span>Costo protegido ×{fmtNum(r.dif, 3)}</span>
                  <span className="a mono">{usd(r.costoProt, 4)}</span>
                </div>
                <div className="tot" style={{ color: "#767D76" }}>
                  <span>Utilidad protegida</span><span className="a mono">{usd(r.utilProt, 4)}</span>
                </div>
                {n(form.comision) > 0 ? (
                  <div className="tot" style={{ color: "#767D76" }}>
                    <span>Comisión {fmtNum(n(form.comision), 0)}%</span>
                    <span className="a mono">{usd(r.precioUnit - r.precioSinCom, 4)}</span>
                  </div>
                ) : null}
                <div style={{ height: 10 }} />

                <div className="price">
                  <div className="lb">Precio unitario de venta</div>
                  <div className="v mono">{usd(r.precioUnit, 4)}</div>
                  <div className="sub mono">
                    <span>Venta total <b>{usd(r.ventaTotal)}</b></span>
                    <span>Ganancia <b>{usd(r.gananciaTotal)}</b></span>
                  </div>
                  <div className="sub mono">
                    <span>Bs {fmtNum(r.precioBs, 2)}</span>
                    <span>MercadoLibre {usd(r.precioML, 4)}</span>
                  </div>
                </div>
              </div>
              <div className="tear" />
              <button className="btn w" onClick={guardar}><Save size={14} />Guardar en base de datos</button>
              <button className="btn g w" onClick={() => setForm(nuevoForm(cfg))}><RotateCcw size={13} />Limpiar y empezar otra</button>
            </div>
          </div>
        )}

        {tab === "bd" && (
          <div style={{ marginTop: 18 }}>
            <div className="kpis">
              <div className="kpi"><div className="l">Cotizaciones</div><div className="v mono">{cots.length}</div></div>
              <div className="kpi"><div className="l">Aprobadas</div>
                <div className="v mono">{cots.filter((c) => c.estado === "Aprobado").length}</div></div>
              <div className="kpi"><div className="l">Valor cotizado</div><div className="v mono">{usd(totalCartera)}</div></div>
              <div className="kpi"><div className="l">Ganancia proyectada</div>
                <div className="v mono" style={{ color: "#15794F" }}>{usd(gananciaCartera)}</div></div>
            </div>

            <section className="card">
              <div className="ch">
                <b>Registro de cálculos</b>
                <span className="mt" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Search size={13} style={{ position: "absolute", left: 7, color: "#767D76" }} />
                    <input className="in" style={{ paddingLeft: 25, width: 200, fontSize: 12 }}
                      placeholder="Buscar cliente o trabajo" value={q} onChange={(e) => setQ(e.target.value)} />
                  </span>
                  <button className="btn g sm" onClick={exportar} disabled={lista.length === 0}>
                    <Download size={12} />CSV
                  </button>
                </span>
              </div>

              {lista.length === 0 ? (
                <div className="empty">
                  <b>{cots.length ? "Ningún resultado" : "Todavía no hay cálculos guardados"}</b>
                  <p>{cots.length ? "Prueba con otro cliente o trabajo."
                    : "Calcula un trabajo y guárdalo para construir tu histórico de precios."}</p>
                </div>
              ) : (
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th><th>Cliente</th><th>Trabajo</th><th className="ta-r">Cant.</th>
                        <th className="ta-r">Costo unit.</th><th className="ta-r">Precio unit.</th>
                        <th className="ta-r">Venta total</th><th>Estado</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((c) => (
                        <Fragment key={c.id}>
                          <tr className="rw">
                            <td className="mono" style={{ whiteSpace: "nowrap" }}>
                              {new Date(c.fecha).toLocaleDateString("es-VE")}
                            </td>
                            <td><b>{c.cliente}</b></td>
                            <td>
                              <button className="lnk" style={{ textDecoration: "none", color: "#171B19", fontWeight: 600, fontSize: 12, textAlign: "left" }}
                                onClick={() => setAbierta(abierta === c.id ? null : c.id)}>
                                {c.trabajo}
                              </button>
                              <div style={{ fontSize: 10, color: "#767D76" }}>{c.papel} · {c.tamano}</div>
                            </td>
                            <td className="ta-r mono">{fmtNum(c.cantidad, 0)}</td>
                            <td className="ta-r mono">{usd(c.costoUnit, 4)}</td>
                            <td className="ta-r mono"><b>{usd(c.precioUnit, 4)}</b></td>
                            <td className="ta-r mono">{usd(c.ventaTotal)}</td>
                            <td>
                              <select className="in" style={{ padding: "3px 5px", fontSize: 11, width: 108 }}
                                value={c.estado} onChange={(e) => cambiarEstado(c.id, e.target.value)}>
                                <option>Cotizado</option><option>Aprobado</option><option>Rechazado</option>
                              </select>
                            </td>
                            <td>
                              <span style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                                <button className="btn g sm" title="Cargar en la calculadora" onClick={() => cargar(c)}>
                                  <Calculator size={12} />
                                </button>
                                <button className="btn g sm" title="Duplicar" onClick={() => duplicar(c)}>
                                  <Copy size={12} />
                                </button>
                                {delId === c.id ? (
                                  <button className="btn dg sm" onClick={() => eliminar(c.id)}>Confirmar</button>
                                ) : (
                                  <button className="btn g sm" title="Eliminar" onClick={() => setDelId(c.id)}>
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </span>
                            </td>
                          </tr>
                          {abierta === c.id ? (
                            <tr>
                              <td colSpan={9} style={{ background: "#EFF2EF", padding: "12px 14px" }}>
                                <div className="row c2" style={{ fontSize: 11.5 }}>
                                  <div>
                                    <div className="fl">Desglose de costos</div>
                                    {(c.lineas || []).map((l) => (
                                      <div key={l.k} style={{ display: "flex", gap: 10, padding: "2px 0" }}>
                                        <span style={{ flex: 1 }}>{l.label}{" "}
                                          <span className="mono" style={{ color: "#767D76" }}>{l.detalle}</span>
                                        </span>
                                        <span className="mono">{usd(l.monto)}</span>
                                      </div>
                                    ))}
                                    <div style={{ display: "flex", borderTop: "1px solid #C4CBC5", marginTop: 4, paddingTop: 4, fontWeight: 700 }}>
                                      <span style={{ flex: 1 }}>Costo total</span>
                                      <span className="mono">{usd(c.costoTotal)}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="fl">Condiciones del cálculo</div>
                                    <div>{c.descripcion || "Sin descripción"}</div>
                                    <div className="mono" style={{ color: "#767D76", marginTop: 5, lineHeight: 1.7 }}>
                                      {c.medida} · {fmtNum(c.capacidad, 0)} pzs por corte · {fmtNum(c.pliegos, 2)} cortes<br />
                                      Margen {fmtNum(c.margen, 0)}% · diferencial {fmtNum(c.dif, 4)} · BCV {fmtNum(c.tasaBCV, 2)}<br />
                                      Precio en Bs {fmtNum(c.precioBs, 2)} · MercadoLibre {usd(c.precioML, 4)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {tab === "cfg" && (
          <div style={{ marginTop: 18, maxWidth: 920 }}>
            <section className="card">
              <div className="ch"><b>Valores por defecto</b><span className="mt">se aplican a cada trabajo nuevo</span></div>
              <div className="cb">
                <div className="row c4">
                  {[["merma", "Merma papel (%)"], ["margen", "Margen (%)"],
                    ["comision", "Comisión vend. (%)"], ["ml", "MercadoLibre (%)"]].map((par) => (
                    <F key={par[0]} l={par[1]}>
                      <input className="in mono" type="text" inputMode="decimal" value={cfg[par[0]]}
                        onChange={(e) => guardarCfg({ ...cfg, [par[0]]: e.target.value })} />
                    </F>
                  ))}
                </div>
                <div className="row c3" style={{ marginTop: 10 }}>
                  {[["tasaBCV", "Tasa BCV"], ["binCompra", "Binance compra"], ["binVenta", "Binance venta"]].map((par) => (
                    <F key={par[0]} l={par[1]}>
                      <input className="in mono" type="text" inputMode="decimal" value={cfg[par[0]]}
                        onChange={(e) => guardarCfg({ ...cfg, [par[0]]: e.target.value })} />
                    </F>
                  ))}
                </div>
                <div className="row c2" style={{ marginTop: 10, maxWidth: 400 }}>
                  {[["pinza", "Pinza / margen no imprimible (mm)"], ["sep", "Separación entre piezas (mm)"]].map((par) => (
                    <F key={par[0]} l={par[1]}>
                      <input className="in mono" type="text" inputMode="decimal" value={cfg[par[0]]}
                        onChange={(e) => guardarCfg({ ...cfg, [par[0]]: e.target.value })} />
                    </F>
                  ))}
                </div>
              </div>
            </section>

            <section className="card">
              <div className="ch"><b>Costos de acabados</b><span className="mt">tarifa base para 1/4 de pliego</span></div>
              <div className="cb">
                <div className="warn" style={{ marginBottom: 12 }}>
                  <AlertTriangle size={14} style={{ flex: "0 0 auto", marginTop: 1 }} />
                  <span>
                    Tu hoja traía dos cifras distintas para lo mismo: el <b>troquel</b> a $100 en Variables
                    y a $50 en la calculadora, y el <b>acetato dangler</b> a $0,03 en Variables y a $0,05 en
                    el cálculo real. Aquí quedaron $100 y $0,05. Corrígelos si el bueno es el otro.
                  </span>
                </div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Acabado</th>
                        <th style={{ width: 110 }}>Costo USD</th>
                        <th style={{ width: 130 }}>Se cobra</th>
                        <th style={{ width: 165 }}>Al cambiar de tamaño</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cfg.acabados.map((a, i) => (
                        <tr key={a.id}>
                          <td>
                            <input className="in" style={{ fontSize: 12 }} value={a.label}
                              onChange={(e) => {
                                const l = cfg.acabados.slice();
                                l[i] = { ...a, label: e.target.value };
                                guardarCfg({ ...cfg, acabados: l });
                              }} />
                          </td>
                          <td>
                            <input className="in mono" style={{ fontSize: 12, textAlign: "right" }} value={a.costo}
                              onChange={(e) => {
                                const l = cfg.acabados.slice();
                                l[i] = { ...a, costo: e.target.value };
                                guardarCfg({ ...cfg, acabados: l });
                              }} />
                          </td>
                          <td>
                            <select className="in" style={{ fontSize: 11.5 }} value={a.unidad}
                              onChange={(e) => {
                                const l = cfg.acabados.slice();
                                l[i] = { ...a, unidad: e.target.value };
                                guardarCfg({ ...cfg, acabados: l });
                              }}>
                              <option value="pliego">Por corte</option>
                              <option value="elemento">Por pieza</option>
                              <option value="millar">Por millar</option>
                              <option value="trabajo">Por trabajo</option>
                            </select>
                          </td>
                          <td>
                            <select className="in" style={{ fontSize: 11.5 }} value={a.escala}
                              disabled={a.unidad !== "pliego"}
                              onChange={(e) => {
                                const l = cfg.acabados.slice();
                                l[i] = { ...a, escala: e.target.value };
                                guardarCfg({ ...cfg, acabados: l });
                              }}>
                              <option value="area">Sube y baja con el área</option>
                              <option value="min">Sube, pero nunca baja</option>
                              <option value="fija">Siempre igual</option>
                            </select>
                          </td>
                          <td>
                            <button className="btn g sm" title="Eliminar"
                              onClick={() => guardarCfg({ ...cfg, acabados: cfg.acabados.filter((x) => x.id !== a.id) })}>
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn g sm" style={{ marginTop: 10 }}
                  onClick={() => guardarCfg({
                    ...cfg,
                    acabados: cfg.acabados.concat([{ id: uid(), label: "Nuevo acabado", costo: 0, unidad: "pliego", escala: "area" }]),
                  })}>
                  <Plus size={12} />Agregar acabado
                </button>
              </div>
            </section>

            <section className="card">
              <div className="ch"><b>Lista de papeles</b><span className="mt">{cfg.papeles.length} referencias</span></div>
              <div style={{ padding: "0 14px", maxHeight: 470, overflowY: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Referencia</th>
                      <th style={{ width: 105 }}>Medida</th>
                      <th style={{ width: 90 }}>Hojas</th>
                      <th style={{ width: 100 }}>Precio resma</th>
                      <th className="ta-r" style={{ width: 90 }}>Por pliego</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cfg.papeles.map((p, i) => (
                      <tr key={p.id}>
                        <td>
                          <input className="in" style={{ fontSize: 12 }} value={p.nombre}
                            onChange={(e) => {
                              const l = cfg.papeles.slice();
                              l[i] = { ...p, nombre: e.target.value };
                              guardarCfg({ ...cfg, papeles: l });
                            }} />
                        </td>
                        <td>
                          <select className="in" style={{ fontSize: 11.5 }} value={p.med}
                            onChange={(e) => {
                              const l = cfg.papeles.slice();
                              l[i] = { ...p, med: e.target.value };
                              guardarCfg({ ...cfg, papeles: l });
                            }}>
                            {Object.keys(MEDIDAS).map((m) => <option key={m} value={m}>{m} cm</option>)}
                          </select>
                        </td>
                        <td>
                          <input className="in mono" style={{ fontSize: 12, textAlign: "right" }} value={p.hojas}
                            onChange={(e) => {
                              const l = cfg.papeles.slice();
                              l[i] = { ...p, hojas: e.target.value };
                              guardarCfg({ ...cfg, papeles: l });
                            }} />
                        </td>
                        <td>
                          <input className="in mono" style={{ fontSize: 12, textAlign: "right" }} value={p.precio}
                            onChange={(e) => {
                              const l = cfg.papeles.slice();
                              l[i] = { ...p, precio: e.target.value };
                              guardarCfg({ ...cfg, papeles: l });
                            }} />
                        </td>
                        <td className="ta-r mono" style={{ color: "#767D76" }}>
                          {usd(n(p.precio) / Math.max(1, n(p.hojas)), 4)}
                        </td>
                        <td>
                          <button className="btn g sm" title="Eliminar"
                            onClick={() => guardarCfg({ ...cfg, papeles: cfg.papeles.filter((x) => x.id !== p.id) })}>
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="cb" style={{ borderTop: "1px solid #C4CBC5", display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn g sm"
                  onClick={() => guardarCfg({
                    ...cfg,
                    papeles: [{ id: uid(), nombre: "Nuevo papel", hojas: 500, precio: 0, med: "70x100" }].concat(cfg.papeles),
                  })}>
                  <Plus size={12} />Agregar papel
                </button>
                <button className={delId === "reset" ? "btn dg sm" : "btn g sm"} style={{ marginLeft: "auto" }}
                  onClick={() => {
                    if (delId === "reset") { guardarCfg(CFG_BASE); setDelId(null); aviso("Variables restauradas"); }
                    else setDelId("reset");
                  }}>
                  <RotateCcw size={12} />
                  {delId === "reset" ? "Confirmar: se pierden tus cambios" : "Restaurar valores originales"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      {toast ? <div className="toast"><Check size={14} />{toast}</div> : null}
    </div>
  );
}
