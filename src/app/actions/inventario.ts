"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRol } from "@/lib/auth";
import { n } from "@/lib/calculo";
import { registrarEntrada, ajustarStock, fijarStockMin } from "@/lib/inventario";

export type EstadoInv = { error: string | null; ok?: boolean };

// Cota sensata para pliegos/stock: evita que un dedo resbalado meta un absurdo.
const MAX_PLIEGOS = 100_000_000;
const cantidad = z.number().finite().min(0).max(MAX_PLIEGOS);

/** Registra una entrada de compra (suma pliegos al stock). */
export async function entradaAction(
  _prev: EstadoInv,
  formData: FormData,
): Promise<EstadoInv> {
  const usuario = await requireRol("ADMIN");
  const papelId = String(formData.get("papelId") ?? "");
  if (!papelId) return { error: "Elige el papel." };

  const pliegos = cantidad.safeParse(n(formData.get("pliegos")));
  if (!pliegos.success || pliegos.data <= 0) {
    return { error: "Indica una cantidad de pliegos válida." };
  }
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  const r = await registrarEntrada(papelId, pliegos.data, motivo, usuario.id);
  if (!r.ok) return { error: r.error ?? "No se pudo registrar." };
  revalidatePath("/inventario");
  return { error: null, ok: true };
}

/** Ajusta el stock a un valor exacto (conteo físico). */
export async function ajusteAction(formData: FormData): Promise<void> {
  const usuario = await requireRol("ADMIN");
  const papelId = String(formData.get("papelId") ?? "");
  if (!papelId) return;
  const stock = cantidad.safeParse(n(formData.get("stock")));
  if (!stock.success) return;
  await ajustarStock(papelId, stock.data, "Ajuste manual", usuario.id);
  revalidatePath("/inventario");
}

/** Fija el stock mínimo (umbral de aviso) de un papel. */
export async function stockMinAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const papelId = String(formData.get("papelId") ?? "");
  if (!papelId) return;
  const min = cantidad.safeParse(n(formData.get("stockMin")));
  if (!min.success) return;
  await fijarStockMin(papelId, min.data);
  revalidatePath("/inventario");
}
