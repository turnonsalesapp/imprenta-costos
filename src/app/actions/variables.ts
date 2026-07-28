"use server";

import { revalidatePath } from "next/cache";
import { requireRol } from "@/lib/auth";
import { n } from "@/lib/calculo";
import {
  obtenerConfig, actualizarConfig, actualizarMembrete, crearPapel, editarPapel,
  alternarPapel, crearAcabado, editarAcabado, alternarAcabado,
} from "@/lib/variables";
import { fetchTasasExternas } from "@/lib/tasas";
import { modeloValido } from "@/lib/modelos-ia";
import { crearMaterialGF, editarMaterialGF, alternarMaterialGF } from "@/lib/materiales-gf";
import { crearProductoGF, editarProductoGF, alternarProductoGF } from "@/lib/productos-gf";
import { crearProductoPop, editarProductoPop, alternarProductoPop } from "@/lib/productos-pop";
import { crearEquipo, editarEquipo, alternarEquipo } from "@/lib/equipos";

export type EstadoVar = { error: string | null; ok?: boolean; msg?: string };

/** Trae las tasas de la fuente externa y las guarda. Si falla, no cambia nada. */
export async function actualizarTasasAction(
  _prev: EstadoVar,
  _formData: FormData,
): Promise<EstadoVar> {
  await requireRol("ADMIN");
  const r = await fetchTasasExternas();
  if (!r.ok) {
    return { error: `No se actualizó: ${r.detalle}. Se mantiene la última tasa registrada.` };
  }
  const t = r.tasas;
  const cfg = await obtenerConfig();
  await actualizarConfig({ ...cfg, tasaBCV: t.bcv, binCompra: t.binCompra, binVenta: t.binVenta });
  revalidatePath("/variables");
  return {
    error: null, ok: true,
    msg: `Tasas actualizadas desde ${t.fuente}: BCV ${t.bcv} · paralelo ${t.binCompra}.`,
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
    pinza: f("pinza"), sep: f("sep"), margenMin: f("margenMin"), iva: f("iva"),
    interpretarIA: formData.get("interpretarIA") === "on",
    interpretarModelo: modeloValido(String(formData.get("interpretarModelo") ?? "")),
    gfOjeteCosto: f("gfOjeteCosto"), gfOjeteCm: Math.max(1, Math.round(f("gfOjeteCm")) || 40),
    offPlancha: f("offPlancha"), offPlanchaMedio: f("offPlanchaMedio"), offPlanchaPliego: f("offPlanchaPliego"),
    offArranque: f("offArranque"), offMillar: f("offMillar"), offTinta: f("offTinta"),
  });
  revalidatePath("/variables");
  return { error: null, ok: true };
}

/** Guarda el membrete (datos de la empresa) para la cotización al cliente. */
export async function guardarMembreteAction(
  _prev: EstadoVar,
  formData: FormData,
): Promise<EstadoVar> {
  await requireRol("ADMIN");
  const s = (k: string) => String(formData.get(k) ?? "");
  await actualizarMembrete({
    empresaNombre: s("empresaNombre"),
    empresaRif: s("empresaRif"),
    empresaTelefono: s("empresaTelefono"),
    empresaDireccion: s("empresaDireccion"),
    empresaEmail: s("empresaEmail"),
    empresaWeb: s("empresaWeb"),
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
    categoria: String(formData.get("categoria") ?? "").trim() || "Papel",
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
    categoria: String(formData.get("categoria") ?? "").trim() || "Papel",
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
    modulo: String(formData.get("modulo") ?? "digital") === "offset" ? "offset" : "digital",
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
    modulo: String(formData.get("modulo") ?? "digital") === "offset" ? "offset" : "digital",
  });
  revalidatePath("/variables");
}

export async function alternarAcabadoAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) await alternarAcabado(id);
  revalidatePath("/variables");
}

/* ─────────────────────── materiales de gran formato ─────────────────────── */

function datosMaterialGF(formData: FormData) {
  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    categoria: String(formData.get("categoria") ?? "").trim() || "Banner",
    costoM2: n(formData.get("costoM2")),
    modoCobro: String(formData.get("modoCobro") ?? "mancha"),
    anchosRollo: String(formData.get("anchosRollo") ?? "").trim(),
    montaje: String(formData.get("montaje") ?? "").trim(),
    tablaEtq: String(formData.get("tablaEtq") ?? "").trim(),
  };
}

export async function crearMaterialGFAction(
  _prev: EstadoVar,
  formData: FormData,
): Promise<EstadoVar> {
  await requireRol("ADMIN");
  const d = datosMaterialGF(formData);
  if (!d.nombre) return { error: "El nombre del material es obligatorio." };
  const r = await crearMaterialGF(d);
  if (!r.ok) return { error: r.error ?? "No se pudo crear." };
  revalidatePath("/variables");
  return { error: null, ok: true };
}

export async function editarMaterialGFAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await editarMaterialGF(id, datosMaterialGF(formData));
  revalidatePath("/variables");
}

export async function alternarMaterialGFAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) await alternarMaterialGF(id);
  revalidatePath("/variables");
}

/* ─────────────── productos terminados de gran formato ─────────────── */

function datosProductoGF(formData: FormData) {
  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    categoria: String(formData.get("categoria") ?? "").trim() || "Pendón",
    medida: String(formData.get("medida") ?? "").trim(),
    costoUnit: n(formData.get("costoUnit")),
  };
}

export async function crearProductoGFAction(
  _prev: EstadoVar,
  formData: FormData,
): Promise<EstadoVar> {
  await requireRol("ADMIN");
  const d = datosProductoGF(formData);
  if (!d.nombre) return { error: "El nombre del producto es obligatorio." };
  const r = await crearProductoGF(d);
  if (!r.ok) return { error: r.error ?? "No se pudo crear." };
  revalidatePath("/variables");
  return { error: null, ok: true };
}

export async function editarProductoGFAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await editarProductoGF(id, datosProductoGF(formData));
  revalidatePath("/variables");
}

export async function alternarProductoGFAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) await alternarProductoGF(id);
  revalidatePath("/variables");
}

/* ─────────────── personalizados / material POP ─────────────── */

function datosProductoPop(formData: FormData) {
  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    categoria: String(formData.get("categoria") ?? "").trim() || "Chapa",
    modo: String(formData.get("modo") ?? "escalas"),
    escalas: String(formData.get("escalas") ?? "").trim(),
    precioLineal: n(formData.get("precioLineal")),
    anchoCm: n(formData.get("anchoCm")),
    minCm: n(formData.get("minCm")),
    unidad: String(formData.get("unidad") ?? "").trim() || "unidad",
  };
}

export async function crearProductoPopAction(
  _prev: EstadoVar,
  formData: FormData,
): Promise<EstadoVar> {
  await requireRol("ADMIN");
  const d = datosProductoPop(formData);
  if (!d.nombre) return { error: "El nombre del producto es obligatorio." };
  const r = await crearProductoPop(d);
  if (!r.ok) return { error: r.error ?? "No se pudo crear." };
  revalidatePath("/variables");
  return { error: null, ok: true };
}

export async function editarProductoPopAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await editarProductoPop(id, datosProductoPop(formData));
  revalidatePath("/variables");
}

export async function alternarProductoPopAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) await alternarProductoPop(id);
  revalidatePath("/variables");
}

/* ─────────────── equipos (prensas offset, etc.) ─────────────── */

function datosEquipo(formData: FormData) {
  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    coloresPasada: n(formData.get("coloresPasada")),
    costoMillar: n(formData.get("costoMillar")),
    costoArranque: n(formData.get("costoArranque")),
  };
}

export async function crearEquipoAction(
  _prev: EstadoVar,
  formData: FormData,
): Promise<EstadoVar> {
  await requireRol("ADMIN");
  const d = datosEquipo(formData);
  if (!d.nombre) return { error: "El nombre del equipo es obligatorio." };
  const r = await crearEquipo(d);
  if (!r.ok) return { error: r.error ?? "No se pudo crear." };
  revalidatePath("/variables");
  return { error: null, ok: true };
}

export async function editarEquipoAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await editarEquipo(id, datosEquipo(formData));
  revalidatePath("/variables");
}

export async function alternarEquipoAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) await alternarEquipo(id);
  revalidatePath("/variables");
}
