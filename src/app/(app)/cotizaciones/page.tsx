import Link from "next/link";
import type { EstadoCotizacion } from "@prisma/client";
import { requireRol } from "@/lib/auth";
import {
  listarCotizaciones, ESTADOS, ETIQUETA_ESTADO,
} from "@/lib/cotizaciones";
import { fmtNum, usd } from "@/lib/calculo";
import { EstadoBadge } from "./EstadoBadge";

export const dynamic = "force-dynamic";

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  await requireRol("ADMIN", "VENDEDOR");

  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const estado = (ESTADOS.includes(sp.estado as EstadoCotizacion)
    ? (sp.estado as EstadoCotizacion)
    : "") as EstadoCotizacion | "";

  const filas = await listarCotizaciones({ q, estado });

  // Preserva filtros en el enlace de exportar.
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (estado) params.set("estado", estado);
  const exportHref = `/api/cotizaciones/export${params.toString() ? "?" + params : ""}`;

  return (
    <>
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Cotizaciones</h1>
          <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">
            {filas.length} {filas.length === 1 ? "registro" : "registros"}
          </p>
        </div>
        <Link
          href="/cotizar"
          className="rounded-sm bg-tinta px-3 py-2 text-sm font-bold text-hoja hover:opacity-90"
        >
          Nueva cotización
        </Link>
      </header>

      {/* Buscador + filtro por estado (GET, sin JS) */}
      <form method="get" className="mt-5 flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Buscar</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Cliente, trabajo o papel"
            className="mt-1 block w-64 rounded-sm border border-regla bg-hoja px-3 py-1.5 text-sm outline-none focus:border-cian"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Estado</span>
          <select
            name="estado"
            defaultValue={estado}
            className="mt-1 block rounded-sm border border-regla bg-hoja px-2 py-1.5 text-sm outline-none focus:border-cian"
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{ETIQUETA_ESTADO[e]}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-sm border border-regla px-3 py-1.5 text-sm font-medium hover:border-tinta">
          Filtrar
        </button>
        {(q || estado) && (
          <Link href="/cotizaciones" className="px-1 py-1.5 text-sm text-kraft underline hover:text-tinta">
            Limpiar
          </Link>
        )}
        <a
          href={exportHref}
          className="ml-auto rounded-sm border border-regla px-3 py-1.5 text-sm font-medium hover:border-tinta"
        >
          Exportar CSV
        </a>
      </form>

      {filas.length === 0 ? (
        <div className="mt-6 rounded-sm border border-regla bg-hoja px-4 py-12 text-center">
          <b className="block text-sm">
            {q || estado ? "Ningún resultado" : "Todavía no hay cotizaciones"}
          </b>
          <p className="mt-1 text-sm text-kraft">
            {q || estado
              ? "Prueba con otro término o quita el filtro."
              : "Calcula un trabajo y guárdalo para empezar tu histórico."}
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-sm border border-regla bg-hoja">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-regla bg-suave text-left text-[10px] uppercase tracking-widest text-kraft">
                <th className="px-4 py-2 font-bold">N°</th>
                <th className="px-4 py-2 font-bold">Fecha</th>
                <th className="px-4 py-2 font-bold">Cliente / Trabajo</th>
                <th className="px-4 py-2 text-right font-bold">Cant.</th>
                <th className="px-4 py-2 text-right font-bold">Precio unit.</th>
                <th className="px-4 py-2 text-right font-bold">Venta total</th>
                <th className="px-4 py-2 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-suave">
              {filas.map((c) => (
                <tr key={c.id} className="hover:bg-suave">
                  <td className="px-4 py-2.5 font-mono text-kraft">{c.numero}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[13px] text-kraft">
                    {c.creadaEn.toLocaleDateString("es-VE")}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/cotizaciones/${c.id}`} className="font-medium hover:text-cian">
                      {c.titulo}
                    </Link>
                    <div className="text-[11px] text-kraft">
                      {c.clienteNombre ? c.clienteNombre + " · " : ""}{c.papelNombre} · {c.tamano}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{fmtNum(c.cantidad, 0)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{usd(c.precioUnit, 4)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{usd(c.ventaTotal)}</td>
                  <td className="px-4 py-2.5"><EstadoBadge estado={c.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
