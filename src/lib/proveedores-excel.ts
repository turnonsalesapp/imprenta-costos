import "server-only";
import ExcelJS from "exceljs";
import { db } from "./db";
import type { FilaImport } from "./proveedores";

/**
 * Entrada/salida Excel de listas de precios (Fase 3). La plantilla se pre-rellena
 * con el catálogo actual para que el emparejamiento por `Clave` sea exacto.
 */

const COLUMNAS = [
  { header: "Clave", key: "clave", width: 28 },
  { header: "Nombre", key: "nombre", width: 32 },
  { header: "Medida", key: "medida", width: 12 },
  { header: "Hojas", key: "hojas", width: 10 },
  { header: "Precio", key: "precio", width: 12 },
  { header: "Unidad", key: "unidad", width: 12 },
];

/** Plantilla .xlsx pre-rellenada con el catálogo actual (Precio vacío para llenar). */
export async function generarPlantilla(): Promise<Buffer> {
  const papeles = await db.papel.findMany({
    where: { activo: true },
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    select: { clave: true, nombre: true, medida: true, hojas: true },
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Precios");
  ws.columns = COLUMNAS;
  ws.getRow(1).font = { bold: true };
  for (const p of papeles) {
    ws.addRow({ clave: p.clave, nombre: p.nombre, medida: p.medida, hojas: p.hojas, precio: "", unidad: "resma" });
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

/** Convierte una celda de exceljs a texto, tolerando fórmulas/hipervínculos/richText. */
function celTexto(v: ExcelJS.CellValue): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString();
  const o = v as unknown as Record<string, unknown>;
  if (typeof o.text === "string") return o.text.trim() || undefined;
  if (Array.isArray(o.richText)) {
    return (o.richText as { text?: string }[]).map((r) => r.text ?? "").join("").trim() || undefined;
  }
  if ("result" in o) return o.result == null ? undefined : String(o.result).trim() || undefined;
  return undefined;
}

function celNumero(v: ExcelJS.CellValue): number | undefined {
  if (typeof v === "number") return v;
  const o = v as unknown as Record<string, unknown> | null;
  if (o && typeof o === "object" && typeof o.result === "number") return o.result;
  const n = Number(celTexto(v));
  return isFinite(n) ? n : undefined;
}

/** Lee un .xlsx cargado y devuelve las filas crudas de la primera hoja. */
export async function parsearExcel(data: ArrayBuffer): Promise<FilaImport[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  // Detecta columnas por encabezado (fila 1), tolerante al orden.
  const idx: Record<string, number> = {};
  ws.getRow(1).eachCell((cell, col) => {
    const k = celTexto(cell.value)?.toLowerCase();
    if (k) idx[k] = col;
  });
  const col = (...nombres: string[]) => {
    for (const n of nombres) if (idx[n]) return idx[n];
    return 0;
  };
  const cClave = col("clave");
  const cNombre = col("nombre");
  const cMedida = col("medida");
  const cHojas = col("hojas");
  const cPrecio = col("precio", "precio resma", "costo");
  const cUnidad = col("unidad");

  const filas: FilaImport[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return; // encabezado
    const cel = (c: number) => (c ? row.getCell(c).value : null);
    const clave = celTexto(cel(cClave));
    const precio = celNumero(cel(cPrecio));
    if (!clave && precio == null) return; // fila vacía
    filas.push({
      clave,
      nombre: celTexto(cel(cNombre)),
      medida: celTexto(cel(cMedida)),
      hojas: celNumero(cel(cHojas)),
      precio,
      unidad: celTexto(cel(cUnidad)),
    });
  });
  return filas;
}
