"use server";

import { revalidatePath } from "next/cache";
import { requireRol } from "@/lib/auth";
import { n } from "@/lib/calculo";
import {
  obtenerConfig, actualizarConfig, crearPapel, editarPapel, alternarPapel,
  crearAcabado, editarAcabado, alternarAcabado,
} from "@/lib/variables";
import { fetchTasasExternas } from "@/lib/tasas";

export type EstadoVar = { error: string | null; ok?: boolean; msg?: string };

/** Trae las tasas de la fuente externa y las guarda. Si falla, no cambia nada. */
export async function actualizarTasasAction(
  _prev: EstadoVar,
  _formData: FormData,
): Promise<EstadoVar> {
  await requireRol("ADMIN");
  const t = await fetchTasasExternas();
  if (!t) {
    return { error: "No se pudo leer la fuente externa. Se mantiene la última tasa registrada." };
  }
  const cfg = await obtenerConfig();
  await actualizarConfig({ ...cfg, tasaBCV: t.bcv, binCompra: t.binCompra, binVenta: t.binVenta });
  revalidatePath("/variables");
  return {
    error: null, ok: true,
    msg: `Tasas actualizadas desde ${t.fuente}: BCV ${t.bcv} · Binance ${t.binCompra}.`,
  };
}

/* ─────────────────────────── configuración ─────────────────────────── */

export async function guardarConfigAction(
  _prev: EstadoVar,
  formData: FormData,
): Promise<EstadoVar> {
  await requireRol("ADMIN");
  const f = (k: string) => n(formData.get(k));

  await actualizarConfig({
    merma: f("merma"), margen: f("margen"), comision: f("comision"), ml: f("ml"),
    tasaBCV: f("tasaBCV"), binCompra: f("binCompra"), binVenta: f("binVenta"),
    pinza: f("pinza"), sep: f("sep"),
  });
  revalidatePath("/variables");
  return { error: null, ok: true };
}

/* ───────────────────────────── papeles ───────────────────────────── */

export async function crearPapelAction(
  _prev: EstadoVar,
  formData: FormData,
): Promise<EstadoVar> {
  await requireRol("ADMIN");
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre del papel es obligatorio." };

  const r = await crearPapel({
    nombre,
    medida: String(formData.get("medida") ?? "70x100"),
    hojas: Math.max(1, Math.round(n(formData.get("hojas")))),
    precio: n(formData.get("precio")),
  });
  if (!r.ok) return { error: r.error ?? "No se pudo crear." };
  revalidatePath("/variables");
  return { error: null, ok: true };
}

export async function editarPapelAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await editarPapel(id, {
    nombre: String(formData.get("nombre") ?? "").trim() || "Papel",
    medida: String(formData.get("medida") ?? "70x100"),
    hojas: Math.max(1, Math.round(n(formData.get("hojas")))),
    precio: n(formData.get("precio")),
  });
  revalidatePath("/variables");
}

export async function alternarPapelAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) await alternarPapel(id);
  revalidatePath("/variables");
}

/* ───────────────────────────── acabados ───────────────────────────── */

export async function crearAcabadoAction(
  _prev: EstadoVar,
  formData: FormData,
): Promise<EstadoVar> {
  await requireRol("ADMIN");
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "El nombre del acabado es obligatorio." };

  const r = await crearAcabado({
    label,
    costo: n(formData.get("costo")),
    unidad: String(formData.get("unidad") ?? "pliego"),
    escala: String(formData.get("escala") ?? "area"),
    orden: Math.round(n(formData.get("orden"))),
    grupo: String(formData.get("grupo") ?? "").trim() || null,
  });
  if (!r.ok) return { error: r.error ?? "No se pudo crear." };
  revalidatePath("/variables");
  return { error: null, ok: true };
}

export async function editarAcabadoAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await editarAcabado(id, {
    label: String(formData.get("label") ?? "").trim() || "Acabado",
    costo: n(formData.get("costo")),
    unidad: String(formData.get("unidad") ?? "pliego"),
    escala: String(formData.get("escala") ?? "area"),
    orden: Math.round(n(formData.get("orden"))),
    grupo: String(formData.get("grupo") ?? "").trim() || null,
  });
  revalidatePath("/variables");
}

export async function alternarAcabadoAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) await alternarAcabado(id);
  revalidatePath("/variables");
}
