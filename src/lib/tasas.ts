import "server-only";
import { env } from "./env";

/**
 * Consulta de tasas a una fuente externa (best-effort).
 *
 * Por defecto usa dolarapi (ve.dolarapi.com): sin token, formato estable. Da
 * "oficial" (BCV) y "paralelo" (referencia tipo Binance). Se puede cambiar con
 * la variable de entorno TASAS_API. Si la fuente no responde o el formato no
 * calza, devuelve un detalle del porqué y el sistema se queda con la última
 * tasa registrada. Nunca lanza.
 */

export type TasasExternas = {
  bcv: number;
  binCompra: number;
  binVenta: number;
  fuente: string;
};

export type ResultadoTasas =
  | { ok: true; tasas: TasasExternas }
  | { ok: false; detalle: string };

export async function fetchTasasExternas(): Promise<ResultadoTasas> {
  let data: unknown;
  try {
    const res = await fetch(env.tasasApi, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, detalle: `la fuente respondió HTTP ${res.status}` };
    data = await res.json();
  } catch (e) {
    return { ok: false, detalle: `no se pudo conectar (${e instanceof Error ? e.message : "error"})` };
  }

  const bcv = extraer(data, ["oficial", "bcv", "usd"]);
  const par = extraer(data, ["paralelo", "binance", "enparalelovzla", "bitcoin"]);
  if (bcv == null || par == null) {
    return {
      ok: false,
      detalle: `formato inesperado (BCV=${bcv ?? "?"}, paralelo=${par ?? "?"}). Revisa /api/tasas/debug`,
    };
  }
  return { ok: true, tasas: { bcv, binCompra: par, binVenta: par, fuente: host(env.tasasApi) } };
}

/** Saca un número de un nodo, probando los campos usuales de cada API. */
function valor(nodo: unknown): number | null {
  if (nodo == null) return null;
  if (typeof nodo === "number") return isFinite(nodo) && nodo > 0 ? nodo : null;
  const o = nodo as Record<string, unknown>;
  const p = Number(o.promedio ?? o.venta ?? o.compra ?? o.price);
  return isFinite(p) && p > 0 ? p : null;
}

/**
 * Busca la tasa por sus posibles claves, tanto si la respuesta es un arreglo
 * (dolarapi: [{fuente, promedio}]) como un objeto (pydolarve: {monitors:{...}}).
 */
function extraer(data: unknown, claves: string[]): number | null {
  const arr = Array.isArray(data)
    ? data
    : (data as { monitors?: unknown })?.monitors ?? data;

  if (Array.isArray(arr)) {
    for (const k of claves) {
      const item = arr.find(
        (x) => String((x as { fuente?: unknown })?.fuente ?? "").toLowerCase() === k,
      );
      const v = valor(item);
      if (v != null) return v;
    }
    return null;
  }
  if (arr && typeof arr === "object") {
    for (const k of claves) {
      const v = valor((arr as Record<string, unknown>)[k]);
      if (v != null) return v;
    }
  }
  return null;
}

function host(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return "la fuente";
  }
}
