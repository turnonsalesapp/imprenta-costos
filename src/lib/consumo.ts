import "server-only";
import { db } from "./db";
import { TAMANOS } from "./calculo";

/**
 * Consumo de papel por mes, para planificar las compras. Cuenta las
 * cotizaciones APROBADAS (los trabajos que sí se hacen).
 *
 * `pliegos` guardado en la cotización son CORTES (con merma). Los pliegos
 * COMPLETOS que se gastan = cortes × la fracción del tamaño (un corte de 1/4
 * de pliego consume 0,25 de pliego).
 */

export type FilaConsumo = {
  mes: string; // "YYYY-MM"
  papel: string;
  cortes: number;
  pliegos: number; // pliegos completos consumidos
};

function frac(tamano: string): number {
  return TAMANOS.find((t) => t.id === tamano)?.frac ?? 0.25;
}

export async function consumoPapelPorMes(): Promise<FilaConsumo[]> {
  const cots = await db.cotizacion.findMany({
    where: { estado: "APROBADA" },
    select: { creadaEn: true, papelNombre: true, tamano: true, pliegos: true },
  });

  const map = new Map<string, FilaConsumo>();
  for (const c of cots) {
    const mes = c.creadaEn.toISOString().slice(0, 7);
    const clave = `${mes}|${c.papelNombre}`;
    const cortes = Number(c.pliegos);
    const fila = map.get(clave) ?? { mes, papel: c.papelNombre, cortes: 0, pliegos: 0 };
    fila.cortes += cortes;
    fila.pliegos += cortes * frac(c.tamano);
    map.set(clave, fila);
  }

  return [...map.values()].sort(
    (a, b) => b.mes.localeCompare(a.mes) || b.pliegos - a.pliegos,
  );
}
