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
