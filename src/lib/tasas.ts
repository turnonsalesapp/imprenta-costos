import "server-only";

/**
 * Consulta de tasas a una fuente externa (best-effort).
 *
 * Por defecto usa pydolarve.org, que publica BCV y Binance. Se puede cambiar la
 * base con la variable de entorno TASAS_API. Si la fuente no responde o el
 * formato no calza, devuelve null y el sistema se queda con la última tasa
 * registrada (el respaldo). Nunca lanza.
 */

export type TasasExternas = {
  bcv: number;
  binCompra: number;
  binVenta: number;
  fuente: string;
};

const URL_BASE = process.env.TASAS_API ?? "https://pydolarve.org/api/v1/dollar";

async function precioDe(pagina: string, claves: string[]): Promise<number | null> {
  try {
    const res = await fetch(`${URL_BASE}?page=${pagina}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const mons = (data as { monitors?: Record<string, unknown> })?.monitors ?? data;
    for (const k of claves) {
      const nodo = (mons as Record<string, unknown>)?.[k];
      const p = Number(
        (nodo as { price?: unknown })?.price ?? nodo,
      );
      if (isFinite(p) && p > 0) return p;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchTasasExternas(): Promise<TasasExternas | null> {
  const [bcv, binance] = await Promise.all([
    precioDe("bcv", ["usd", "bcv", "oficial"]),
    precioDe("criptodolar", ["binance", "enparalelovzla", "paralelo"]),
  ]);
  if (!bcv || !binance) return null;
  // La fuente da un solo valor Binance; compra y venta quedan iguales (su
  // promedio, que es lo que usa el diferencial, coincide con ese valor).
  return { bcv, binCompra: binance, binVenta: binance, fuente: "pydolarve" };
}
