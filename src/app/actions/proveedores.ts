"use server";

import { revalidatePath } from "next/cache";
import { requireRol } from "@/lib/auth";
import {
  crearProveedor, marcarPredeterminado, eliminarProveedor, fijarPreferido,
  importarLista, diffImportacion, type FilaImport, type DiffFila,
} from "@/lib/proveedores";
import { parsearExcel } from "@/lib/proveedores-excel";

/** Crea un proveedor (solo ADMIN: es catálogo de costos). */
export async function crearProveedorAction(formData: FormData): Promise<{ error: string | null }> {
  await requireRol("ADMIN");
  const r = await crearProveedor({
    nombre: String(formData.get("nombre") ?? ""),
    moneda: String(formData.get("moneda") ?? ""),
    contacto: String(formData.get("contacto") ?? ""),
    notas: String(formData.get("notas") ?? ""),
  });
  if (!r.ok) return { error: r.error };
  revalidatePath("/proveedores");
  return { error: null };
}

export async function marcarPredeterminadoAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) await marcarPredeterminado(id);
  revalidatePath("/proveedores");
}

export async function eliminarProveedorAction(formData: FormData): Promise<{ error: string | null }> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  const r = await eliminarProveedor(id);
  revalidatePath("/proveedores");
  return { error: r.ok ? null : (r.error ?? "No se pudo borrar.") };
}

/** Fija el proveedor preferido de un papel (copia su precio al precio efectivo). */
export async function fijarPreferidoAction(
  papelId: string, proveedorId: string,
): Promise<{ error: string | null }> {
  await requireRol("ADMIN");
  if (!papelId || !proveedorId) return { error: "Datos inválidos." };
  await fijarPreferido(papelId, proveedorId);
  revalidatePath("/proveedores");
  revalidatePath("/variables");
  return { error: null };
}

/** Dry-run: parsea el .xlsx cargado y devuelve el diff + las filas para confirmar. */
export async function previewImportAction(
  formData: FormData,
): Promise<{ diff: DiffFila[]; filas: FilaImport[]; error: string | null }> {
  await requireRol("ADMIN");
  const proveedorId = String(formData.get("proveedorId") ?? "");
  const archivo = formData.get("archivo");
  if (!proveedorId) return { diff: [], filas: [], error: "Elige un proveedor." };
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { diff: [], filas: [], error: "Sube un archivo .xlsx con la lista." };
  }
  try {
    const filas = await parsearExcel(await archivo.arrayBuffer());
    if (!filas.length) return { diff: [], filas: [], error: "El archivo no tiene filas legibles." };
    const diff = await diffImportacion(proveedorId, filas);
    return { diff, filas, error: null };
  } catch {
    return { diff: [], filas: [], error: "No se pudo leer el archivo. ¿Es un .xlsx válido?" };
  }
}

/** Aplica la importación previamente previsualizada (filas en JSON). */
export async function confirmarImportAction(
  proveedorId: string, filas: FilaImport[],
): Promise<{ error: string | null; aplicados: number; sinPapel: string[] }> {
  await requireRol("ADMIN");
  if (!proveedorId) return { error: "Elige un proveedor.", aplicados: 0, sinPapel: [] };
  const r = await importarLista(proveedorId, filas);
  revalidatePath("/proveedores");
  revalidatePath("/variables");
  revalidatePath("/inventario");
  return { error: r.ok ? null : (r.error ?? "Error al importar."), aplicados: r.aplicados, sinPapel: r.sinPapel };
}
