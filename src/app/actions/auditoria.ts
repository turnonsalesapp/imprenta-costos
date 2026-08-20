"use server";

import { revalidatePath } from "next/cache";
import { requireRol } from "@/lib/auth";
import { purgarAuditoria } from "@/lib/auditoria";

/**
 * Purga de la bitácora por rango de fechas. Reservada a SUPERADMIN:
 * `requireRol("SUPERADMIN")` redirige a cualquier otro rol (ADMIN incluido) antes
 * de tocar nada. La lógica (borrar + dejar rastro en una transacción) vive en
 * `purgarAuditoria`; aquí solo se leen y validan las fechas del formulario.
 */
export type EstadoPurga = { error: string | null; borrados: number | null };

export async function purgarAuditoriaAction(
  _prev: EstadoPurga,
  formData: FormData,
): Promise<EstadoPurga> {
  const actor = await requireRol("SUPERADMIN");

  const desdeStr = String(formData.get("desde") ?? "");
  const hastaStr = String(formData.get("hasta") ?? "");
  if (!desdeStr || !hastaStr) {
    return { error: "Indica la fecha inicial y la final.", borrados: null };
  }

  // Los <input type="date"> llegan como "YYYY-MM-DD". Tomamos el día completo:
  // desde el inicio del día inicial hasta el final del día final.
  const desde = new Date(`${desdeStr}T00:00:00`);
  const hasta = new Date(`${hastaStr}T23:59:59.999`);

  const r = await purgarAuditoria({ desde, hasta }, actor);
  if (!r.ok) return { error: r.error, borrados: null };

  revalidatePath("/auditoria");
  return { error: null, borrados: r.borrados };
}
