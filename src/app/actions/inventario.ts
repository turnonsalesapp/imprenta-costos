"use server";

import { revalidatePath } from "next/cache";
import { requireRol } from "@/lib/auth";
import { n } from "@/lib/calculo";
import { registrarEntrada, ajustarStock, fijarStockMin } from "@/lib/inventario";

export type EstadoInv = { error: string | null; ok?: boolean };

/** Registra una entrada de compra (suma pliegos al stock). */
export async function entradaAction(
  _prev: EstadoInv,
  formData: FormData,
): Promise<EstadoInv> {
  const usuario = await requireRol("ADMIN");
  const papelId = String(formData.get("papelId") ?? "");
  if (!papelId) return { error: "Elige el papel." };
  const pliegos = n(formData.get("pliegos"));
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  const r = await registrarEntrada(papelId, pliegos, motivo, usuario.id);
  if (!r.ok) return { error: r.error ?? "No se pudo registrar." };
  revalidatePath("/inventario");
  return { error: null, ok: true };
}

/** Ajusta el stock a un valor exacto (conteo físico). */
export async function ajusteAction(formData: FormData): Promise<void> {
  const usuario = await requireRol("ADMIN");
  const papelId = String(formData.get("papelId") ?? "");
  if (!papelId) return;
  await ajustarStock(papelId, n(formData.get("stock")), "Ajuste manual", usuario.id);
  revalidatePath("/inventario");
}

/** Fija el stock mínimo (umbral de aviso) de un papel. */
export async function stockMinAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const papelId = String(formData.get("papelId") ?? "");
  if (!papelId) return;
  await fijarStockMin(papelId, n(formData.get("stockMin")));
  revalidatePath("/inventario");
}
