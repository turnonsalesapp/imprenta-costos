/* Auditoría: corre trabajos representativos por cada motor y arma tablas.
 * Puro cálculo con los motores reales del sistema. `npx tsx scripts/auditoria.ts` */
import { calcular, type Config, type Entrada, usd, fmtNum } from "../src/lib/calculo";
import { calcularGF, calcularProductoGF } from "../src/lib/calculo-granformato";
import { calcularPop } from "../src/lib/calculo-personalizado";
import { calcularOffset } from "../src/lib/calculo-offset";
import {
  PAPELES_BASE, ACABADOS_BASE, CONFIG_BASE, MATERIALES_GF_BASE,
  PRODUCTOS_GF_BASE, PRODUCTOS_POP_BASE,
} from "../src/lib/datos-base";

// Config real (semilla) para el motor digital/offset.
const cfg: Config = {
  ...CONFIG_BASE,
  papeles: PAPELES_BASE.map((p) => ({ id: p.id, nombre: p.nombre, hojas: p.hojas, precio: p.precio, med: p.med })),
  acabados: ACABADOS_BASE.map((a) => ({ id: a.id, label: a.label, costo: a.costo, unidad: a.unidad, escala: a.escala, grupo: a.grupo ?? null })),
};
const tasas = { margen: 30, comision: 3, ml: 12, tasaBCV: 473, binCompra: 659.71, binVenta: 658.01, difManual: false, dif: "" as const };

const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n));
const rpad = (s: string, n: number) => s.padStart(n);
const money = (v: number, d = 2) => rpad(usd(v, d), 11);

function tabla(titulo: string, filas: string[][], head: string[]) {
  console.log("\n### " + titulo);
  const ancho = head.map((h, i) => Math.max(h.length, ...filas.map((f) => (f[i] ?? "").length)));
  const line = (cols: string[]) => cols.map((c, i) => (i === 0 ? pad(c, ancho[i]) : rpad(c, ancho[i]))).join("  ");
  console.log(line(head));
  console.log(ancho.map((w) => "-".repeat(w)).join("  "));
  for (const f of filas) console.log(line(f));
}

/* ───────────── 1. DIGITAL (producción propia) ───────────── */
const papelId = (nombre: string) => PAPELES_BASE.find((p) => p.nombre.toLowerCase().includes(nombre.toLowerCase()))?.id ?? PAPELES_BASE[0].id;
const digitales: { nombre: string; ancho: number; alto: number; cant: number; tamano: string; papel: string; acab: string[] }[] = [
  { nombre: "Sticker troquelado 5×5", ancho: 50, alto: 50, cant: 1000, tamano: "1/4 Pliego", papel: "adhesivo", acab: ["impTiro", "troquel"] },
  { nombre: "Tarjeta presentación 9×5", ancho: 90, alto: 50, cant: 1000, tamano: "1/4 Pliego", papel: "glas", acab: ["impTiro", "guillotina"] },
  { nombre: "Volante media carta", ancho: 140, alto: 216, cant: 2000, tamano: "1/2 Pliego", papel: "bond", acab: ["impTiro", "guillotina"] },
  { nombre: "Volante carta full color", ancho: 216, alto: 279, cant: 1000, tamano: "Pliego", papel: "glas", acab: ["impTiro", "guillotina"] },
  { nombre: "Postal 10×15", ancho: 100, alto: 150, cant: 500, tamano: "1/4 Pliego", papel: "glas", acab: ["impTiro", "guillotina"] },
  { nombre: "Etiqueta producto 6×4", ancho: 60, alto: 40, cant: 3000, tamano: "1/4 Pliego", papel: "adhesivo", acab: ["impTiro", "troquel"] },
  { nombre: "Invitación 12×12", ancho: 120, alto: 120, cant: 200, tamano: "1/4 Pliego", papel: "glas", acab: ["impTiro", "guillotina"] },
  { nombre: "Menú A4 laminado", ancho: 210, alto: 297, cant: 100, tamano: "Pliego", papel: "glas", acab: ["impTiro", "lamTiro", "guillotina"] },
  { nombre: "Separador libro 5×18", ancho: 50, alto: 180, cant: 500, tamano: "1/4 Pliego", papel: "glas", acab: ["impTiro", "guillotina"] },
  { nombre: "Flyer cuarto carta", ancho: 108, alto: 140, cant: 5000, tamano: "1/4 Pliego", papel: "bond", acab: ["impTiro", "guillotina"] },
];
{
  const filas = digitales.map((d) => {
    const acabados: Record<string, { on: boolean; q: number }> = {};
    for (const a of d.acab) acabados[a] = { on: true, q: 1 };
    const f: Entrada = { cantidad: d.cant, capacidad: 0, merma: cfg.merma, tamano: d.tamano, papelId: papelId(d.papel), acabados, ...tasas } as unknown as Entrada;
    // capacidad por montaje:
    const { medidaCorte, calcCapacidad } = require("../src/lib/calculo");
    const frac = { "Pliego": 1, "1/2 Pliego": 0.5, "1/4 Pliego": 0.25, "1/8 Pliego": 0.125 }[d.tamano] ?? 0.25;
    const papel = cfg.papeles.find((p) => p.id === f.papelId)!;
    const [W, H] = medidaCorte(papel.med, frac);
    const cap = calcCapacidad(d.ancho, d.alto, W, H, cfg.pinza, cfg.sep).cap;
    const r = calcular({ ...f, capacidad: cap }, cfg);
    return [d.nombre, String(d.cant), String(cap || "—"), fmtNum(r.pliegos, 1), money(r.costoTotal), money(r.costoUnit, 4), money(r.precioUnit, 4), money(r.ventaTotal)];
  });
  tabla("1) DIGITAL (producción propia)", filas, ["Trabajo", "Cant", "Cap", "Cortes", "Costo tot", "Costo u", "Precio u", "Venta tot"]);
}

/* ───────────── 2. OFFSET (producción propia) ───────────── */
const offsets: { nombre: string; ancho: number; alto: number; cant: number; papel: string; colores: number; caras: number; acab: string[] }[] = [
  { nombre: "Volante 1/2 carta 4/0", ancho: 140, alto: 216, cant: 5000, papel: "glas", colores: 4, caras: 1, acab: ["guillotina"] },
  { nombre: "Volante carta 4/4", ancho: 216, alto: 279, cant: 10000, papel: "glas", colores: 4, caras: 2, acab: ["guillotina"] },
  { nombre: "Tarjeta presentación 4/0", ancho: 90, alto: 50, cant: 1000, papel: "glas", colores: 4, caras: 1, acab: ["guillotina"] },
  { nombre: "Afiche carta 4/0", ancho: 216, alto: 279, cant: 2000, papel: "glas", colores: 4, caras: 1, acab: ["guillotina"] },
  { nombre: "Díptico A4 4/4", ancho: 210, alto: 297, cant: 3000, papel: "glas", colores: 4, caras: 2, acab: ["guillotina"] },
  { nombre: "Talonario 1/4 2/0", ancho: 108, alto: 140, cant: 5000, papel: "bond", colores: 2, caras: 1, acab: ["guillotina"] },
  { nombre: "Volante 1/4 1/0 económico", ancho: 108, alto: 140, cant: 10000, papel: "bond", colores: 1, caras: 1, acab: ["guillotina"] },
  { nombre: "Sobre carta 1/0", ancho: 220, alto: 110, cant: 1000, papel: "bond", colores: 1, caras: 1, acab: ["guillotina"] },
  { nombre: "Volante carta 4/0 corto", ancho: 216, alto: 279, cant: 500, papel: "glas", colores: 4, caras: 1, acab: ["guillotina"] },
  { nombre: "Revista pág. interior 4/4", ancho: 210, alto: 297, cant: 20000, papel: "glas", colores: 4, caras: 2, acab: ["guillotina"] },
];
{
  const filas = offsets.map((d) => {
    const acabados: Record<string, { on: boolean; q: number }> = {};
    for (const a of d.acab) acabados[a] = { on: true, q: 1 };
    const papel = cfg.papeles.find((p) => p.id === papelId(d.papel))!;
    const r = calcularOffset({
      papelNombre: papel.nombre, precioPliego: papel.precio / Math.max(1, papel.hojas), medida: papel.med,
      anchoPza: d.ancho, altoPza: d.alto, cantidad: d.cant, merma: cfg.merma, pinza: cfg.pinza, sep: cfg.sep,
      colores: d.colores, coloresPasada: 4, caras: d.caras, costoPlancha: 8, costoArranque: 15, costoMillar: 6,
      acabados, catalogoAcab: cfg.acabados.map((a) => ({ id: a.id, label: a.label, costo: a.costo, unidad: a.unidad, escala: a.escala })), ...tasas,
    });
    return [d.nombre, String(d.cant), `${d.colores}/${d.caras === 2 ? d.colores : 0}`, String(r.cap || "—"), String(r.pliegos), String(r.nPlanchas), money(r.costoTotal), money(r.costoUnit, 4), money(r.precioUnit, 4)];
  });
  tabla("2) OFFSET (producción propia)", filas, ["Trabajo", "Cant", "Col", "Cap", "Plieg", "Planch", "Costo tot", "Costo u", "Precio u"]);
}

/* ───────────── 3. GRAN FORMATO impresión (m²) ───────────── */
const gf = MATERIALES_GF_BASE;
const gfMat = (clave: string) => gf.find((m) => m.clave === clave)!;
const gfJobs: { nombre: string; clave: string; ancho: number; alto: number; cant: number; ojetes: boolean }[] = [
  { nombre: "Banner 13oz 2×1 m", clave: "gf-banner-13oz", ancho: 200, alto: 100, cant: 1, ojetes: true },
  { nombre: "Banner 13oz 3×1 m", clave: "gf-banner-13oz", ancho: 300, alto: 100, cant: 1, ojetes: true },
  { nombre: "Banner blackout 2×1", clave: "gf-banner-blackout", ancho: 200, alto: 100, cant: 1, ojetes: true },
  { nombre: "Banner mesh 4×2", clave: "gf-banner-mesh", ancho: 400, alto: 200, cant: 1, ojetes: true },
  { nombre: "Backlight caja de luz 1×0.5", clave: "gf-banner-backlight", ancho: 100, alto: 50, cant: 2, ojetes: false },
  { nombre: "Vinil estándar 1.5×1", clave: "gf-vinil-estandar", ancho: 150, alto: 100, cant: 1, ojetes: false },
  { nombre: "Vinil microperforado 2×1", clave: "gf-microperforado", ancho: 200, alto: 100, cant: 1, ojetes: false },
  { nombre: "Vinil vidriera 1×2 m", clave: "gf-vinil-estandar", ancho: 100, alto: 200, cant: 1, ojetes: false },
  { nombre: "Banner reciclaje 1×1", clave: "gf-banner-reciclaje", ancho: 100, alto: 100, cant: 5, ojetes: true },
  { nombre: "Vinil holográfico 1×0.5", clave: "gf-holografico", ancho: 100, alto: 50, cant: 1, ojetes: false },
];
{
  const filas = gfJobs.map((d) => {
    const m = gfMat(d.clave);
    const rollo = m.modo === "ancho_rollo" ? Number((m.anchos.split(",")[0] || "0")) : 0;
    const r = calcularGF({
      materialNombre: m.nombre, anchoCm: d.ancho, altoCm: d.alto, cantidad: d.cant,
      costoM2: m.costoM2, modoCobro: m.modo, anchoRolloCm: rollo,
      ojetesAuto: d.ojetes, ojetes: 0, ojeteCosto: 0.8, ojeteCm: 40, ...tasas,
    });
    return [d.nombre, m.modo === "ancho_rollo" ? "rollo" : "mancha", `${d.cant}`, fmtNum(r.areaFactM2, 2), String(r.ojetesTotal), money(r.costoTotal), money(r.precioUnit, 2), money(r.precioM2Venta, 2)];
  });
  tabla("3) GRAN FORMATO impresión (por m²)", filas, ["Trabajo", "Cobro", "Cant", "m²fact", "Ojetes", "Costo tot", "Precio u", "Precio m²"]);
}

/* ───────────── 4. GRAN FORMATO productos terminados ───────────── */
{
  const filas = PRODUCTOS_GF_BASE.slice(0, 10).map((p) => {
    const cant = p.categoria === "Pendón" ? 5 : 1;
    const r = calcularProductoGF({ productoNombre: p.nombre, costoUnit: p.costoUnit, cantidad: cant, ...tasas });
    return [p.nombre, p.categoria, String(cant), money(p.costoUnit), money(r.costoTotal), money(r.precioUnit, 2), money(r.ventaTotal)];
  });
  tabla("4) GRAN FORMATO productos terminados (por unidad)", filas, ["Producto", "Categoría", "Cant", "Costo u", "Costo tot", "Precio u", "Venta tot"]);
}

/* ───────────── 5. PERSONALIZADOS / Material POP ───────────── */
{
  const cants: Record<string, number> = { "escalas": 50, "lineal": 1 };
  const filas = PRODUCTOS_POP_BASE.map((p) => {
    const cant = p.modo === "lineal" ? 1 : 50;
    const r = calcularPop({
      nombre: p.nombre, modo: p.modo, cantidad: cant, escalas: p.escalas,
      largoCm: p.modo === "lineal" ? 100 : 0, precioLineal: p.precioLineal, anchoCm: p.anchoCm, minCm: p.minCm, ...tasas,
    });
    const base = p.modo === "lineal" ? `${money(p.precioLineal)}/m·100cm` : `x${cant} @ ${money(r.costoUnitBase)}`;
    return [p.nombre, p.categoria, p.modo, base, money(r.costoTotal), money(r.precioUnit, 2), money(r.ventaTotal)];
  });
  tabla("5) PERSONALIZADOS / Material POP", filas, ["Producto", "Categoría", "Modo", "Base", "Costo tot", "Precio u", "Venta tot"]);
}

/* ───────────── 6. PROVEEDOR (tercerizado genérico) ───────────── */
import { precioDesdeCosto } from "../src/lib/calculo";
{
  const jobs: { nombre: string; costoTotal: number; cant: number }[] = [
    { nombre: "Encuadernado 100 libros", costoTotal: 250, cant: 100 },
    { nombre: "Sellos de goma x50", costoTotal: 75, cant: 50 },
    { nombre: "Bordado gorras x30", costoTotal: 120, cant: 30 },
    { nombre: "Termo sublimado x20", costoTotal: 90, cant: 20 },
    { nombre: "Franelas DTF x50", costoTotal: 200, cant: 50 },
    { nombre: "Trofeos acrílico x10", costoTotal: 150, cant: 10 },
    { nombre: "Carnets PVC x100", costoTotal: 120, cant: 100 },
    { nombre: "Imán nevera x200", costoTotal: 160, cant: 200 },
    { nombre: "Corte CNC MDF letrero", costoTotal: 80, cant: 1 },
    { nombre: "Cajas plegadizas x500", costoTotal: 400, cant: 500 },
  ];
  const filas = jobs.map((j) => {
    const r = precioDesdeCosto(j.costoTotal, j.cant, tasas);
    return [j.nombre, String(j.cant), money(j.costoTotal), money(r.costoUnit, 4), money(r.precioUnit, 4), money(r.ventaTotal)];
  });
  tabla("6) PROVEEDOR (tercerizado, se parte del costo)", filas, ["Trabajo", "Cant", "Costo tot", "Costo u", "Precio u", "Venta tot"]);
}

console.log("\n(Config: margen 30%, comisión 3%, ML 12%, BCV 473, dif auto ≈ %s)", (((659.71 + 658.01) / 2) / 473).toFixed(4));
