"use server";

import { revalidatePath } from "next/cache";
import { requireRol } from "@/lib/auth";
import {
  contarTransaccional, resetTransaccional, importarCrm, importarProduccion,
  type Conteos, type ResultadoReset, type ResultadoImport,
} from "@/lib/migracion";
import { planificarCrm, planificarProduccion, type Reconciliacion } from "@/lib/trello";

const MAX = 20 * 1024 * 1024; // 20 MB

async function leerArchivo(formData: FormData): Promise<{ texto: string } | { error: string }> {
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Sube el archivo .json exportado de Trello." };
  if (archivo.size > MAX) return { error: "El archivo supera 20 MB." };
  try {
    const texto = await archivo.text();
    JSON.parse(texto); // valida que sea JSON
    return { texto };
  } catch {
    return { error: "El archivo no es un JSON válido." };
  }
}

function flagsCrm(formData: FormData) {
  return {
    perdidos: formData.get("perdidos") === "on",
    done: formData.get("done") === "on",
    clientes: formData.get("clientes") === "on",
  };
}

export async function contarAction(): Promise<Conteos> {
  await requireRol("ADMIN");
  return contarTransaccional();
}

export async function resetAction(formData: FormData): Promise<{ error: string | null; resultado?: ResultadoReset }> {
  await requireRol("ADMIN");
  if (String(formData.get("confirmar") ?? "").trim().toUpperCase() !== "BORRAR") {
    return { error: 'Escribe BORRAR para confirmar.' };
  }
  const resultado = await resetTransaccional();
  revalidatePath("/migracion");
  revalidatePath("/cotizaciones");
  revalidatePath("/taller");
  return { error: null, resultado };
}

// CRM
export async function previewCrmAction(formData: FormData): Promise<{ error: string | null; recon?: Reconciliacion }> {
  await requireRol("ADMIN");
  const r = await leerArchivo(formData);
  if ("error" in r) return { error: r.error };
  const { recon } = planificarCrm(JSON.parse(r.texto), flagsCrm(formData));
  return { error: null, recon };
}

export async function importarCrmAction(formData: FormData): Promise<{ error: string | null; resultado?: ResultadoImport }> {
  await requireRol("ADMIN");
  const r = await leerArchivo(formData);
  if ("error" in r) return { error: r.error };
  const resultado = await importarCrm(r.texto, flagsCrm(formData));
  revalidatePath("/cotizaciones");
  return { error: null, resultado };
}

// Producción
export async function previewProdAction(formData: FormData): Promise<{ error: string | null; recon?: Reconciliacion }> {
  await requireRol("ADMIN");
  const r = await leerArchivo(formData);
  if ("error" in r) return { error: r.error };
  const { recon } = planificarProduccion(JSON.parse(r.texto), { cobrado: formData.get("cobrado") === "on" });
  return { error: null, recon };
}

export async function importarProduccionAction(formData: FormData): Promise<{ error: string | null; resultado?: ResultadoImport }> {
  await requireRol("ADMIN");
  const r = await leerArchivo(formData);
  if ("error" in r) return { error: r.error };
  const resultado = await importarProduccion(r.texto, { cobrado: formData.get("cobrado") === "on" });
  revalidatePath("/cotizaciones");
  revalidatePath("/taller");
  return { error: null, resultado };
}
