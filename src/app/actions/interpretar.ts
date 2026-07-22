"use server";

import { requireRol } from "@/lib/auth";
import { cargarConfig } from "@/lib/config";
import { obtenerConfig } from "@/lib/variables";
import { limitar } from "@/lib/rate-limit";
import {
  interpretarActivo, interpretarSolicitud, type SolicitudInterpretada,
} from "@/lib/interpretar";

export type EstadoInterpretar =
  | { ok: true; data: SolicitudInterpretada }
  | { ok: false; error: string };

/**
 * Interpreta el texto de la solicitud del cliente con IA. Solo ADMIN/VENDEDOR y
 * solo si la función está activa para ese usuario (sistema + override). No
 * persiste nada: devuelve el borrador para que el vendedor lo revise y cargue.
 */
export async function interpretarSolicitudAction(
  texto: string,
): Promise<EstadoInterpretar> {
  const usuario = await requireRol("ADMIN", "VENDEDOR");

  if (!(await interpretarActivo(usuario.id))) {
    return { ok: false, error: "La interpretación con IA está desactivada para tu usuario." };
  }

  // Rate limiting: acota el costo de la IA por usuario (30 por hora).
  const lim = limitar(`ia:${usuario.id}`, 30, 60 * 60_000);
  if (!lim.ok) {
    const min = Math.ceil(lim.enSegundos / 60);
    return { ok: false, error: `Alcanzaste el límite de interpretaciones. Intenta de nuevo en ${min} min.` };
  }

  const [cfg, dc] = await Promise.all([cargarConfig(), obtenerConfig()]);
  return interpretarSolicitud(texto, cfg, dc.interpretarModelo);
}
