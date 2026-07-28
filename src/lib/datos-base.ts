import type { Papel, Acabado, Config } from "./calculo";

/**
 * Datos iniciales tomados de la hoja de cálculo original de la imprenta.
 *
 * Precios de papel: lista referencial del proveedor vigente al 16 de octubre
 * de 2025, en USD por resma o paquete completo. Los 43 fueron verificados
 * contra la columna "Pliego" de la hoja original (ver datos-base.test.ts).
 *
 * Esto es SOLO LA CARGA INICIAL. Se aplica una vez con `npm run db:seed`.
 * A partir de ahí los precios viven en la base de datos y se actualizan desde
 * la pantalla de Variables, sin tocar este archivo. Cuando el proveedor mande
 * una lista nueva, se cargan ahí — no aquí.
 */

/** Fecha de la lista de precios de papel cargada abajo. */
export const FECHA_LISTA_PAPEL = "2025-10-16";

export const PAPELES_BASE: Papel[] = [
  { id: "Bond 16/56 Gr.-500", nombre: "Bond 16/56 Gr.-500", hojas: 500, precio: 45, med: "66x96" },
  { id: "Bond 20/75 Gr.-500", nombre: "Bond 20/75 Gr.-500", hojas: 500, precio: 53, med: "66x96" },
  { id: "Bond 24/90 Gr.-500", nombre: "Bond 24/90 Gr.-500", hojas: 500, precio: 65, med: "66x96" },
  { id: "Bond 120 Gr.-250", nombre: "Bond 120 Gr.-250", hojas: 250, precio: 47, med: "66x96" },
  { id: "Papel Imprenta 45 Gr.-500", nombre: "Papel Imprenta 45 Gr.-500", hojas: 500, precio: 25, med: "68x96" },
  { id: "Bristol 90/150 Gr.-250", nombre: "Bristol 90/150 Gr.-250", hojas: 250, precio: 60, med: "66x96" },
  { id: "Bristol 110/210 Gr.-125", nombre: "Bristol 110/210 Gr.-125", hojas: 125, precio: 42, med: "66x96" },
  { id: "Bristol 240 Gr.-125", nombre: "Bristol 240 Gr.-125", hojas: 125, precio: 47, med: "66x96" },
  { id: "C.B. Blanco 55 Gr.-500", nombre: "C.B. Blanco 55 Gr.-500", hojas: 500, precio: 70, med: "66x96" },
  { id: "C.F.B. Colores 50 Gr.-500", nombre: "C.F.B. Colores 50 Gr.-500", hojas: 500, precio: 75, med: "66x96" },
  { id: "C.F. Colores 55 Gr.-500", nombre: "C.F. Colores 55 Gr.-500", hojas: 500, precio: 70, med: "66x96" },
  { id: "Glase 80 Gr.-500", nombre: "Glase 80 Gr.-500", hojas: 500, precio: 60, med: "66x96" },
  { id: "Glase 90 Gr.-250", nombre: "Glase 90 Gr.-250", hojas: 250, precio: 33, med: "66x96" },
  { id: "Glase 100 Gr.-500", nombre: "Glase 100 Gr.-500", hojas: 500, precio: 75, med: "66x96" },
  { id: "Glase/Mate 115 Gr.-250", nombre: "Glase/Mate 115 Gr.-250", hojas: 250, precio: 39, med: "66x96" },
  { id: "Mate/Glase 150 Gr.-250", nombre: "Mate/Glase 150 Gr.-250", hojas: 250, precio: 53, med: "66x96" },
  { id: "Mate 200 Gr.-100", nombre: "Mate 200 Gr.-100", hojas: 100, precio: 32, med: "66x96" },
  { id: "Glase 200 Gr.-125", nombre: "Glase 200 Gr.-125", hojas: 125, precio: 35, med: "66x96" },
  { id: "Mate 250 Gr.-125", nombre: "Mate 250 Gr.-125", hojas: 125, precio: 49, med: "66x96" },
  { id: "Glase 250 Gr.-100", nombre: "Glase 250 Gr.-100", hojas: 100, precio: 40, med: "66x96" },
  { id: "Glase 300 Gr.-100", nombre: "Glase 300 Gr.-100", hojas: 100, precio: 52, med: "66x96" },
  { id: "Mate/Glase 350 Gr.-125", nombre: "Mate/Glase 350 Gr.-125", hojas: 125, precio: 59, med: "66x96" },
  { id: "Cartón MM (Mitabell) (400 Gr)-1", nombre: "Cartón MM (Mitabell) (400 Gr)-1", hojas: 1, precio: 0.56, med: "70x100" },
  { id: "SBS Cal. 0.12 (205 Gr.)-3125", nombre: "SBS Cal. 0.12 (205 Gr.)-3125", hojas: 3125, precio: 1026, med: "70x100" },
  { id: "SBS Cal. 0.12 (205 Gr.)-125", nombre: "SBS Cal. 0.12 (205 Gr.)-125", hojas: 125, precio: 42, med: "70x100" },
  { id: "SBS Cal. 0.16 (260 Gr.)-2300", nombre: "SBS Cal. 0.16 (260 Gr.)-2300", hojas: 2300, precio: 690, med: "70x100" },
  { id: "SBS Cal. 0.16 (260 Gr.)-100", nombre: "SBS Cal. 0.16 (260 Gr.)-100", hojas: 100, precio: 35, med: "70x100" },
  { id: "SBS Cal. 0.18 (285 Gr.)-2000", nombre: "SBS Cal. 0.18 (285 Gr.)-2000", hojas: 2000, precio: 890, med: "70x100" },
  { id: "SBS Cal. 0.18 (285 Gr.)-100", nombre: "SBS Cal. 0.18 (285 Gr.)-100", hojas: 100, precio: 50, med: "70x100" },
  { id: "SBS Cal. 0.20 (325 Gr.)-1800", nombre: "SBS Cal. 0.20 (325 Gr.)-1800", hojas: 1800, precio: 972, med: "70x100" },
  { id: "SBS Cal. 0.20 (325 Gr.)-100", nombre: "SBS Cal. 0.20 (325 Gr.)-100", hojas: 100, precio: 60, med: "70x100" },
  { id: "SBS Cal. 0.22 (350 Gr.)-1700", nombre: "SBS Cal. 0.22 (350 Gr.)-1700", hojas: 1700, precio: 1003, med: "70x100" },
  { id: "SBS Cal. 0.22 (350 Gr.)-100", nombre: "SBS Cal. 0.22 (350 Gr.)-100", hojas: 100, precio: 65, med: "70x100" },
  { id: "SBS Cal. 0.24 (380 Gr.)-1600", nombre: "SBS Cal. 0.24 (380 Gr.)-1600", hojas: 1600, precio: 960, med: "70x100" },
  { id: "SBS Cal. 0.24 (380 Gr.)-100", nombre: "SBS Cal. 0.24 (380 Gr.)-100", hojas: 100, precio: 70, med: "70x100" },
  { id: "R. Periódico Cal. 0.20 (400 Gr.)-100", nombre: "R. Periódico Cal. 0.20 (400 Gr.)-100", hojas: 100, precio: 60, med: "70x100" },
  { id: "Litho 90-250", nombre: "Litho 90-250", hojas: 250, precio: 34, med: "66x96" },
  { id: "Litho Autoadhesivo-200", nombre: "Litho Autoadhesivo-200", hojas: 200, precio: 130, med: "70x100" },
  { id: "Papel Antigrasa (40 Gr.)-500", nombre: "Papel Antigrasa (40 Gr.)-500", hojas: 500, precio: 65, med: "66x96" },
  { id: "Snowbright Cream (60 Gr.)-500", nombre: "Snowbright Cream (60 Gr.)-500", hojas: 500, precio: 49, med: "66x96" },
  { id: "Snowbright Cream (80 Gr.)-250", nombre: "Snowbright Cream (80 Gr.)-250", hojas: 250, precio: 34, med: "66x96" },
  { id: "Kraft 80 Gr.-500", nombre: "Kraft 80 Gr.-500", hojas: 500, precio: 75, med: "70x100" },
  { id: "Papel para libros SNOWBRIGHT CREAM (80 Gr.)-250", nombre: "Papel para libros SNOWBRIGHT CREAM (80 Gr.)-250", hojas: 250, precio: 31, med: "66x96" },
];

/**
 * unidad -> cómo se cobra:
 *   pliego   = por cada corte procesado
 *   elemento = por cada pieza terminada
 *   millar   = por cada mil CORTES de papel (troquelado; se redondea hacia arriba)
 *   trabajo  = una sola vez, sin importar el tiraje
 *
 * escala -> qué pasa con la tarifa al cambiar de tamaño de corte
 * (solo aplica a unidad "pliego"; la tarifa base es para 1/4 de pliego):
 *   area = sube y baja proporcional al área
 *   min  = sube con el área pero nunca baja de la tarifa base
 *   fija = siempre igual
 *
 * OJO — dos cifras venían en conflicto en la hoja original:
 *   troquel: $100 en VARIABLES vs $50 en la calculadora  -> quedó $100
 *   acetato: $0,03 en VARIABLES vs $0,05 en el cálculo real -> quedó $0,05
 * Confirmar con el taller y corregir aquí o desde la pantalla de Variables.
 */
export const ACABADOS_BASE: Acabado[] = [
  { id: "impTiro", label: "Impresión Tiro", costo: 0.264, unidad: "pliego", escala: "area" },
  { id: "impRetiro", label: "Impresión Retiro", costo: 0.264, unidad: "pliego", escala: "area" },
  { id: "lamTiro", label: "Laminado Tiro", costo: 0.33, unidad: "pliego", escala: "area" },
  { id: "lamRetiro", label: "Laminado Retiro", costo: 0.33, unidad: "pliego", escala: "area" },
  { id: "troqDig", label: "Troquelado Digital", costo: 0.5, unidad: "pliego", escala: "min" },
  { id: "troquel", label: "Troquel Básico", costo: 100, unidad: "trabajo", escala: "fija", grupo: "troquel" },
  { id: "troquelMedio", label: "Troquel Medio", costo: 150, unidad: "trabajo", escala: "fija", grupo: "troquel" },
  { id: "troquelComplejo", label: "Troquel Complejo", costo: 200, unidad: "trabajo", escala: "fija", grupo: "troquel" },
  { id: "troquelado", label: "Troquelado", costo: 15, unidad: "millar", escala: "fija" },
  { id: "pegado", label: "Pegado", costo: 0.03, unidad: "elemento", escala: "fija" },
  { id: "acetato", label: "Acetato Dangler", costo: 0.05, unidad: "elemento", escala: "fija" },
  { id: "guillotina", label: "Guillotina", costo: 5, unidad: "trabajo", escala: "fija" },
  { id: "prueba", label: "Prueba de Color", costo: 5, unidad: "trabajo", escala: "fija" },
  // Acabados de OFFSET (costos propios del proceso, distintos al digital).
  // Estimados PYME; ajustar en Variables con los costos reales del taller.
  { id: "off-guillotina", label: "Guillotina / refilado", costo: 8, unidad: "trabajo", escala: "fija", modulo: "offset" },
  { id: "off-laminado", label: "Laminado", costo: 0.4, unidad: "pliego", escala: "area", modulo: "offset" },
  { id: "off-barniz", label: "Barniz UV", costo: 0.2, unidad: "pliego", escala: "area", modulo: "offset" },
  { id: "off-barniz-lito", label: "Barniz Litográfico", costo: 0.12, unidad: "pliego", escala: "area", modulo: "offset" },
  { id: "off-doblez", label: "Doblez / plegado", costo: 8, unidad: "millar", escala: "fija", modulo: "offset" },
  { id: "off-engrapado", label: "Engrapado (caballete)", costo: 0.05, unidad: "elemento", escala: "fija", modulo: "offset" },
  { id: "off-numerado", label: "Numeración", costo: 10, unidad: "millar", escala: "fija", modulo: "offset" },
  { id: "off-pegado-acetato", label: "Pegado de Acetato", costo: 0.05, unidad: "elemento", escala: "fija", modulo: "offset" },
  { id: "off-pegado-caja", label: "Pegado de Caja", costo: 0.1, unidad: "elemento", escala: "fija", modulo: "offset" },
  { id: "off-encuadernado", label: "Encuadernado", costo: 20, unidad: "trabajo", escala: "fija", modulo: "offset" },
];

/**
 * Materiales de GRAN FORMATO, tomados del catálogo de revendedores del proveedor
 * (Digital Print 2025). Son COSTOS base por m² a BCV; el sistema les aplica el
 * margen con la misma cola de precio. `modo` es el valor por defecto del cobro:
 *   mancha      = se cobra el área impresa (ancho de la pieza × alto)
 *   ancho_rollo = se cobra el ancho completo del rollo × alto
 * `anchos` son los anchos de rollo disponibles en cm.
 */
export type MaterialGFBase = {
  clave: string; nombre: string; categoria: string;
  costoM2: number; modo: "mancha" | "ancho_rollo" | "etiqueta"; anchos: string;
  montaje?: string; tabla?: string; // solo modo etiqueta
};

// Rendimientos de etiquetas por lámina de montaje (del catálogo Digital Print).
const ETQ_A = { montaje: "125x70", tabla: "3x3:660,4x4:510,5x5:310,6x6:220,7x7:170" };
const ETQ_B = { montaje: "115x70", tabla: "3x3:600,4x4:450,5x5:280,6x6:190,7x7:160" };
const ETQ_C = { montaje: "50x90", tabla: "4x4:252,5x5:153,6x6:112,7x7:84" };

// Catálogo completo de Digital Print (revendedores 2025), precios a BCV por m².
// Banners: se cobra la mancha. Viniles: se cobra el ancho del rollo.
export const MATERIALES_GF_BASE: MaterialGFBase[] = [
  // ── Banners (mancha) ──
  { clave: "gf-banner-13oz", nombre: "Banner 13 oz", categoria: "Banner", costoM2: 7, modo: "mancha", anchos: "" },
  { clave: "gf-banner-reciclaje", nombre: "Banner Reciclaje", categoria: "Banner", costoM2: 6, modo: "mancha", anchos: "" },
  { clave: "gf-banner-backlight", nombre: "Banner Backlight", categoria: "Banner", costoM2: 8, modo: "mancha", anchos: "" },
  { clave: "gf-banner-blackout", nombre: "Banner Blackout", categoria: "Banner", costoM2: 8, modo: "mancha", anchos: "" },
  { clave: "gf-banner-mesh", nombre: "Banner Mesh", categoria: "Banner", costoM2: 10, modo: "mancha", anchos: "320" },
  // ── Banner laminado (mancha) ──
  { clave: "gf-banner-13oz-lam", nombre: "Banner 13 oz laminado", categoria: "Banner laminado", costoM2: 14, modo: "mancha", anchos: "137,152" },
  { clave: "gf-banner-blackout-lam", nombre: "Banner Blackout laminado", categoria: "Banner laminado", costoM2: 15, modo: "mancha", anchos: "137,152" },
  // ── Viniles (ancho de rollo) ──
  { clave: "gf-vinil-estandar", nombre: "Vinil Estándar 140gr", categoria: "Vinil", costoM2: 7, modo: "ancho_rollo", anchos: "105,137,152" },
  { clave: "gf-vinil-blackout", nombre: "Vinil Blackout", categoria: "Vinil", costoM2: 8, modo: "ancho_rollo", anchos: "137" },
  { clave: "gf-vinil-matte", nombre: "Vinil Matte", categoria: "Vinil", costoM2: 8, modo: "ancho_rollo", anchos: "137" },
  { clave: "gf-clear", nombre: "Clear Brillante", categoria: "Vinil", costoM2: 8, modo: "ancho_rollo", anchos: "137" },
  { clave: "gf-microperforado", nombre: "Vinil Microperforado", categoria: "Vinil", costoM2: 11, modo: "ancho_rollo", anchos: "137" },
  { clave: "gf-holografico", nombre: "Vinil Holográfico", categoria: "Vinil", costoM2: 13, modo: "ancho_rollo", anchos: "127" },
  // ── Vinil laminado (ancho de rollo) ──
  { clave: "gf-vinil-140-lam", nombre: "Vinil 140gr laminado", categoria: "Vinil laminado", costoM2: 14, modo: "ancho_rollo", anchos: "137,152" },
  { clave: "gf-vinil-blackout-lam", nombre: "Vinil Blackout laminado", categoria: "Vinil laminado", costoM2: 14, modo: "ancho_rollo", anchos: "137" },
  // ── Banners UV (mancha) — base, y Premium con/sin reserva de blanco ──
  { clave: "gf-banner-13oz-uv", nombre: "Banner 13 oz UV", categoria: "Banner UV", costoM2: 15, modo: "mancha", anchos: "" },
  { clave: "gf-banner-13oz-uv-sr", nombre: "Banner 13 oz UV Premium (sin reserva)", categoria: "Banner UV", costoM2: 22, modo: "mancha", anchos: "" },
  { clave: "gf-banner-13oz-uv-cr", nombre: "Banner 13 oz UV Premium (con reserva)", categoria: "Banner UV", costoM2: 26, modo: "mancha", anchos: "" },
  { clave: "gf-banner-blackout-uv", nombre: "Banner Blackout UV", categoria: "Banner UV", costoM2: 16, modo: "mancha", anchos: "" },
  { clave: "gf-banner-blackout-uv-sr", nombre: "Banner Blackout UV Premium (sin reserva)", categoria: "Banner UV", costoM2: 23, modo: "mancha", anchos: "" },
  { clave: "gf-banner-blackout-uv-cr", nombre: "Banner Blackout UV Premium (con reserva)", categoria: "Banner UV", costoM2: 30, modo: "mancha", anchos: "" },
  { clave: "gf-banner-backlight-uv", nombre: "Banner Backlight UV", categoria: "Banner UV", costoM2: 18, modo: "mancha", anchos: "90,115,140,160,180" },
  { clave: "gf-banner-backlight-uv-sr", nombre: "Banner Backlight UV Premium (sin reserva)", categoria: "Banner UV", costoM2: 24, modo: "mancha", anchos: "90,115,140,160,180" },
  { clave: "gf-banner-backlight-uv-cr", nombre: "Banner Backlight UV Premium (con reserva)", categoria: "Banner UV", costoM2: 32, modo: "mancha", anchos: "90,115,140,160,180" },
  // ── Viniles UV Premium (ancho de rollo) — con/sin reserva de blanco ──
  { clave: "gf-vinil-estandar-uv", nombre: "Vinil Estándar UV (sin reserva)", categoria: "Vinil UV", costoM2: 18, modo: "ancho_rollo", anchos: "137,152" },
  { clave: "gf-vinil-estandar-uv-cr", nombre: "Vinil Estándar UV (con reserva)", categoria: "Vinil UV", costoM2: 24, modo: "ancho_rollo", anchos: "137,152" },
  { clave: "gf-vinil-matte-uv", nombre: "Vinil Matte UV (sin reserva)", categoria: "Vinil UV", costoM2: 18, modo: "ancho_rollo", anchos: "137" },
  { clave: "gf-vinil-matte-uv-cr", nombre: "Vinil Matte UV (con reserva)", categoria: "Vinil UV", costoM2: 24, modo: "ancho_rollo", anchos: "137" },
  { clave: "gf-clear-uv", nombre: "Clear UV (sin reserva)", categoria: "Vinil UV", costoM2: 18, modo: "ancho_rollo", anchos: "137" },
  { clave: "gf-clear-uv-cr", nombre: "Clear UV (con reserva)", categoria: "Vinil UV", costoM2: 24, modo: "ancho_rollo", anchos: "137" },
  { clave: "gf-microperforado-uv", nombre: "Vinil Microperforado UV (sin reserva)", categoria: "Vinil UV", costoM2: 22, modo: "ancho_rollo", anchos: "137" },
  { clave: "gf-holografico-uv", nombre: "Vinil Holográfico UV (sin reserva)", categoria: "Vinil UV", costoM2: 22, modo: "ancho_rollo", anchos: "127" },
  { clave: "gf-holografico-uv-cr", nombre: "Vinil Holográfico UV (con reserva)", categoria: "Vinil UV", costoM2: 30, modo: "ancho_rollo", anchos: "127" },
  // ── Etiquetas / stickers (por lámina de montaje; se elige tamaño y cantidad) ──
  { clave: "gf-etq-estandar", nombre: "Etiqueta Vinil Estándar 140gr", categoria: "Etiqueta", costoM2: 12, modo: "etiqueta", anchos: "", ...ETQ_A },
  { clave: "gf-etq-estandar-lam", nombre: "Etiqueta Vinil Estándar laminado", categoria: "Etiqueta", costoM2: 16, modo: "etiqueta", anchos: "", ...ETQ_A },
  { clave: "gf-etq-matte", nombre: "Etiqueta Vinil Matte / Blackout", categoria: "Etiqueta", costoM2: 13, modo: "etiqueta", anchos: "", ...ETQ_A },
  { clave: "gf-etq-matte-lam", nombre: "Etiqueta Vinil Matte / Blackout laminado", categoria: "Etiqueta", costoM2: 17, modo: "etiqueta", anchos: "", ...ETQ_A },
  { clave: "gf-etq-clear", nombre: "Etiqueta Vinil Clear Brillante", categoria: "Etiqueta", costoM2: 13, modo: "etiqueta", anchos: "", ...ETQ_A },
  { clave: "gf-etq-clear-lam", nombre: "Etiqueta Vinil Clear laminado", categoria: "Etiqueta", costoM2: 17, modo: "etiqueta", anchos: "", ...ETQ_A },
  { clave: "gf-etq-uv-vinil", nombre: "Etiqueta UV Vinil (sin reserva)", categoria: "Etiqueta UV", costoM2: 22, modo: "etiqueta", anchos: "", ...ETQ_A },
  { clave: "gf-etq-uv-vinil-cr", nombre: "Etiqueta UV Vinil (con reserva)", categoria: "Etiqueta UV", costoM2: 28, modo: "etiqueta", anchos: "", ...ETQ_A },
  { clave: "gf-etq-uv-clear", nombre: "Etiqueta UV Clear (sin reserva)", categoria: "Etiqueta UV", costoM2: 22, modo: "etiqueta", anchos: "", ...ETQ_A },
  { clave: "gf-etq-uv-clear-cr", nombre: "Etiqueta UV Clear (con reserva)", categoria: "Etiqueta UV", costoM2: 28, modo: "etiqueta", anchos: "", ...ETQ_A },
  { clave: "gf-etq-uv-holo", nombre: "Etiqueta UV Holográfico (sin reserva)", categoria: "Etiqueta UV", costoM2: 26, modo: "etiqueta", anchos: "", ...ETQ_B },
  { clave: "gf-etq-uv-holo-cr", nombre: "Etiqueta UV Holográfico (con reserva)", categoria: "Etiqueta UV", costoM2: 34, modo: "etiqueta", anchos: "", ...ETQ_B },
  { clave: "gf-etq-uv-dorado", nombre: "Etiqueta UV Dorado / Rose Gold (sin reserva)", categoria: "Etiqueta UV", costoM2: 14, modo: "etiqueta", anchos: "", ...ETQ_C },
  { clave: "gf-etq-uv-dorado-cr", nombre: "Etiqueta UV Dorado / Rose Gold (con reserva)", categoria: "Etiqueta UV", costoM2: 17, modo: "etiqueta", anchos: "", ...ETQ_C },
];

/**
 * Productos terminados de GRAN FORMATO (catálogo del proveedor Digital Print 2025).
 * A diferencia de los materiales, aquí el costo es FIJO por unidad: ya viene armado
 * (impresión + estructura/acabado). El sistema le aplica el mismo margen por pieza.
 */
export type ProductoGFBase = {
  clave: string; nombre: string; categoria: string; medida: string; costoUnit: number;
};

export const PRODUCTOS_GF_BASE: ProductoGFBase[] = [
  // Pendones — banner 13oz con tubo arriba y bolsillo abajo (precio por tamaño).
  { clave: "gf-pendon-40x60", nombre: "Pendón 40×60", categoria: "Pendón", medida: "40×60 cm", costoUnit: 5 },
  { clave: "gf-pendon-60x90", nombre: "Pendón 60×90", categoria: "Pendón", medida: "60×90 cm", costoUnit: 8.5 },
  { clave: "gf-pendon-80x120", nombre: "Pendón 80×120", categoria: "Pendón", medida: "80×120 cm", costoUnit: 12 },
  { clave: "gf-pendon-100x140", nombre: "Pendón 100×140", categoria: "Pendón", medida: "100×140 cm", costoUnit: 16 },
  // Roll Up (enrollable) — estructura sola o con banner blackout.
  { clave: "gf-rollup-85x200", nombre: "Roll Up estructura 85×200", categoria: "Roll Up", medida: "85×200 cm", costoUnit: 45 },
  { clave: "gf-rollup-blackout-85x200", nombre: "Roll Up + Banner Blackout 85×200", categoria: "Roll Up", medida: "85×200 cm", costoUnit: 65 },
  // Araña (X-banner) — incluye estructura, banner 13oz y bolso de traslado.
  { clave: "gf-arana-13oz-60x160", nombre: "Araña + Banner 13oz 60×160", categoria: "Araña", medida: "60×160 cm", costoUnit: 30 },
  { clave: "gf-arana-13oz-80x170", nombre: "Araña + Banner 13oz 80×170", categoria: "Araña", medida: "80×170 cm", costoUnit: 35 },
  { clave: "gf-arana-uv-60x160", nombre: "Araña + Banner 13oz UV 60×160", categoria: "Araña", medida: "60×160 cm", costoUnit: 35 },
  { clave: "gf-arana-uv-80x170", nombre: "Araña + Banner 13oz UV 80×170", categoria: "Araña", medida: "80×170 cm", costoUnit: 45 },
  // Estructuras solas (porta pendón) — incluyen bolso de traslado.
  { clave: "gf-porta-arana-60x160", nombre: "Porta pendón Araña 60×160", categoria: "Estructura", medida: "60×160 cm", costoUnit: 20 },
  { clave: "gf-porta-arana-80x170", nombre: "Porta pendón Araña 80×170", categoria: "Estructura", medida: "80×170 cm", costoUnit: 24 },
  { clave: "gf-porta-doble-cara", nombre: "Porta pendón doble cara", categoria: "Estructura", medida: "hasta 180 cm", costoUnit: 25 },
  // Stand de degustación (80×196 cm).
  { clave: "gf-stand-degustacion", nombre: "Stand de degustación (sin rotular)", categoria: "Stand", medida: "80×196 cm", costoUnit: 100 },
  { clave: "gf-stand-degustacion-rot", nombre: "Stand de degustación (rotulado)", categoria: "Stand", medida: "80×196 cm", costoUnit: 156 },
  // Accesorios para banner/pendón (Digital Print, pág. 3).
  { clave: "gf-bolsillo-peq", nombre: "Bolsillo y refilado (par, hasta 50 cm)", categoria: "Accesorio", medida: "hasta 50 cm", costoUnit: 1.5 },
  { clave: "gf-bolsillo-med", nombre: "Bolsillo y refilado (par, hasta 1 m)", categoria: "Accesorio", medida: "hasta 1 m", costoUnit: 2.5 },
  { clave: "gf-tubo-peq", nombre: "Tubo + cuerda + regetones (30–60 cm)", categoria: "Accesorio", medida: "30–60 cm", costoUnit: 3.5 },
  { clave: "gf-tubo-med", nombre: "Tubo + cuerda + regetones (70–120 cm)", categoria: "Accesorio", medida: "70–120 cm", costoUnit: 5 },
  { clave: "gf-tubo-gra", nombre: "Tubo + cuerda + regetones (121–150 cm)", categoria: "Accesorio", medida: "121–150 cm", costoUnit: 6 },
];

/**
 * Productos PERSONALIZADOS / Material POP (catálogo Digital Print 2025).
 * Tercerizados. `modo` define cómo viene el costo del proveedor:
 *   escalas = precio por unidad según el volumen ("desde:precio" separados por coma)
 *   lineal  = precio por metro lineal con ancho fijo y mínimo en cm (DTF UV)
 */
export type ProductoPopBase = {
  clave: string; nombre: string; categoria: string;
  modo: "escalas" | "lineal";
  escalas: string; precioLineal: number; anchoCm: number; minCm: number; unidad: string;
};

const E = (escalas: string, categoria: string): Pick<ProductoPopBase, "modo" | "escalas" | "precioLineal" | "anchoCm" | "minCm" | "unidad" | "categoria"> =>
  ({ modo: "escalas", escalas, precioLineal: 0, anchoCm: 0, minCm: 0, unidad: "unidad", categoria });

// Escalas propuestas: SIEMPRE bajan al subir la cantidad (motivan volumen) y
// agregan tramos altos (250, 500) para empujar pedidos grandes. Los tramos 1–100
// respetan el catálogo del proveedor; 250/500 son propuestas ajustables en Variables.
export const PRODUCTOS_POP_BASE: ProductoPopBase[] = [
  // Chapas (botones) — precio por unidad según volumen.
  { clave: "pop-chapa-prendedor", nombre: "Chapa prendedor", ...E("1:3.5,12:2.2,50:2.1,100:1.5,250:1.3,500:1.1", "Chapa") },
  { clave: "pop-chapa-llavero", nombre: "Chapa llavero liso", ...E("1:4.2,12:3.4,50:3,100:2.6,250:2.3,500:2", "Chapa") },
  { clave: "pop-chapa-destapador", nombre: "Chapa destapador", ...E("1:5,12:4.2,50:4,100:3.5,250:3.2,500:3", "Chapa") },
  // Sublimación de objetos.
  { clave: "pop-boligrafo-3en1", nombre: "Bolígrafo 3 en 1 (sublimado)", ...E("1:4,12:3.5,50:3.2,100:3,250:2.8,500:2.6", "Bolígrafo") },
  // Corte / grabado láser.
  { clave: "pop-llavero-acrilico-transp", nombre: "Llavero grabado acrílico transparente", ...E("1:3,12:2.2,50:2,100:1.6,250:1.4,500:1.2", "Llavero") },
  { clave: "pop-llavero-acrilico-metal", nombre: "Llavero grabado acrílico metalizado", ...E("1:3.5,12:2.3,50:2.2,100:1.8,250:1.6,500:1.4", "Llavero") },
  { clave: "pop-llavero-mdf", nombre: "Llavero grabado MDF", ...E("1:3,12:2.2,50:1.8,100:1.5,250:1.3,500:1.1", "Llavero") },
  // DTF UV — por metro lineal (ancho fijo 57 cm, mínimo 30 cm).
  { clave: "pop-dtf-uv", nombre: "DTF UV", categoria: "DTF", modo: "lineal", escalas: "", precioLineal: 30, anchoCm: 57, minCm: 30, unidad: "metro" },
];

/**
 * Equipos del taller (prensas offset). `coloresPasada` = cuántos colores imprime
 * la prensa en una sola pasada. Costos base ajustables en Variables.
 */
export type EquipoBase = {
  clave: string; nombre: string; coloresPasada: number; costoMillar: number; costoArranque: number;
};

// Prensa grande (4 colores) = más costo por pasada pero imprime todo de una;
// prensa de 1 color = pasada barata pero un full color son 4 pasadas. Estimados
// para PYME en Venezuela (USD a BCV); afinar en Variables con los costos reales.
export const EQUIPOS_BASE: EquipoBase[] = [
  { clave: "prensa-4c", nombre: "Prensa 4 colores", coloresPasada: 4, costoMillar: 8, costoArranque: 18 },
  { clave: "prensa-2c", nombre: "Prensa 2 colores", coloresPasada: 2, costoMillar: 5, costoArranque: 12 },
  { clave: "prensa-1c", nombre: "Prensa 1 color", coloresPasada: 1, costoMillar: 3, costoArranque: 8 },
];

export const CONFIG_BASE: Omit<Config, "papeles" | "acabados"> = {
  merma: 3,        // % de error de consumo de papel
  margen: 30,      // % de margen sobre el precio de venta
  comision: 3,     // % de comisión del vendedor
  ml: 12,          // % de recargo para MercadoLibre
  tasaBCV: 473,
  binCompra: 659.71,
  binVenta: 658.01,
  pinza: 5,        // mm no imprimibles en cada borde
  sep: 3,          // mm de separación entre piezas
};
