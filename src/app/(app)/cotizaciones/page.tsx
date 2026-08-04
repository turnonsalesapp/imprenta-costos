import Link from "next/link";
import type { EstadoCotizacion } from "@prisma/client";
import { requireRol } from "@/lib/auth";
import {
  listarCotizaciones, ESTADOS, ETIQUETA_ESTADO,
} from "@/lib/cotizaciones";
import { listarProspectos } from "@/lib/crm";
import { limpiarDetalle } from "@/lib/trello";
import { fmtNum, usd } from "@/lib/calculo";
import { tiposQuePuedeCotizar, puedeCotizar, puedeEliminarCotizaciones } from "@/lib/roles";
import { EstadoBadge } from "./EstadoBadge";
import { TipoBadges } from "./TipoBadges";
import { AccionesFila } from "./AccionesFila";
import { TableroCotizaciones } from "./TableroCotizaciones";
import { PageHeader, EmptyState } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; vista?: string }>;
}) {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  const permitidos = tiposQuePuedeCotizar(usuario);
  const puedeElim = puedeEliminarCotizaciones(usuario);

  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const esTablero = sp.vista === "tablero";
  const estado = (ESTADOS.includes(sp.estado as EstadoCotizacion)
    ? (sp.estado as EstadoCotizacion)
    : "") as EstadoCotizacion | "";

  // El tablero muestra todas las columnas (todos los estados); el filtro por
  // estado solo aplica a la Lista. La búsqueda `q` aplica a ambas vistas.
  const filas = await listarCotizaciones({ q, estado: esTablero ? "" : estado });

  // Oportunidades (prospectos activos del CRM) para la columna 0 del tablero.
  // Solo NUEVO y CONTACTADO; los CONVERTIDO/DESCARTADO no se muestran.
  const oportunidades = esTablero
    ? (await listarProspectos())
        .filter((p) => p.estado === "NUEVO" || p.estado === "CONTACTADO")
        .map((p) => ({
          id: p.id,
          nombre: p.nombre,
          clienteNombre: p.clienteNombre,
          contacto: p.contacto,
          detalle: limpiarDetalle(p.detalle),
          estado: p.estado,
        }))
    : [];

  // Preserva filtros en el enlace de exportar.
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (estado) params.set("estado", estado);
  const exportHref = `/api/cotizaciones/export${params.toString() ? "?" + params : ""}`;

  // Enlaces del selector de vista (conservan la búsqueda).
  const listaHref = `/cotizaciones${q ? `?q=${encodeURIComponent(q)}` : ""}`;
  const tableroHref = `/cotizaciones?vista=tablero${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <>
      <PageHeader
        title="Cotizaciones"
        eyebrow={`${filas.length} ${filas.length === 1 ? "registro" : "registros"}`}
      >
        <div className="inline-flex overflow-hidden rounded-sm border border-regla">
          <Link href={listaHref}
            className={`px-3 py-1.5 text-sm font-medium ${!esTablero ? "bg-tinta text-hoja" : "text-kraft hover:text-tinta"}`}>
            Lista
          </Link>
          <Link href={tableroHref}
            className={`border-l border-regla px-3 py-1.5 text-sm font-medium ${esTablero ? "bg-tinta text-hoja" : "text-kraft hover:text-tinta"}`}>
            Tablero
          </Link>
        </div>
        {puedeCotizar(usuario) && (
          <Link href="/cotizacion-nueva"
            className="rounded-sm bg-tinta px-3 py-2 text-sm font-bold text-hoja hover:opacity-90">
            Nueva cotización
          </Link>
        )}
      </PageHeader>

      {/* Buscador (+ filtro por estado y export solo en la Lista). GET, sin JS. */}
      <form method="get" className="mt-8 flex flex-wrap items-end gap-2">
        {esTablero && <input type="hidden" name="vista" value="tablero" />}
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Buscar</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Cliente, trabajo o papel"
            className="mt-1 block w-full rounded-sm border border-regla bg-hoja px-3 py-1.5 text-base outline-none focus:border-cian sm:w-64 sm:text-sm"
          />
        </label>
        {!esTablero && (
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Estado</span>
            <select
              name="estado"
              defaultValue={estado}
              className="mt-1 block rounded-sm border border-regla bg-hoja px-2 py-1.5 text-base outline-none focus:border-cian sm:text-sm"
            >
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{ETIQUETA_ESTADO[e]}</option>
              ))}
            </select>
          </label>
        )}
        <button type="submit" className="rounded-sm border border-regla px-3 py-1.5 text-sm font-medium hover:border-tinta">
          Filtrar
        </button>
        {(q || estado) && (
          <Link href={esTablero ? tableroHref.split("&q=")[0] : "/cotizaciones"} className="px-1 py-1.5 text-sm text-kraft underline hover:text-tinta">
            Limpiar
          </Link>
        )}
        {!esTablero && (
          <a
            href={exportHref}
            className="ml-auto rounded-sm border border-regla px-3 py-1.5 text-sm font-medium hover:border-tinta"
          >
            Exportar CSV
          </a>
        )}
      </form>

      {esTablero ? (
        filas.length === 0 && oportunidades.length === 0 ? (
          <EmptyState title={q ? "Ningún resultado" : "Todavía no hay cotizaciones"}>
            {q ? "Prueba con otro término." : "Calcula un trabajo y guárdalo para empezar tu histórico."}
          </EmptyState>
        ) : (
          // Ancho completo (rompe el max-w del layout) para ver todas las columnas.
          <div className="mx-[calc(50%-50vw)] w-screen px-4 sm:px-6">
            <TableroCotizaciones
              filasIniciales={filas.map((c) => ({
                id: c.id, numero: c.numero, titulo: c.titulo,
                clienteNombre: c.clienteNombre, estado: c.estado, ventaTotal: c.ventaTotal,
                tipos: c.tipos,
              }))}
              oportunidadesIniciales={oportunidades}
            />
          </div>
        )
      ) : filas.length === 0 ? (
        <EmptyState title={q || estado ? "Ningún resultado" : "Todavía no hay cotizaciones"}>
          {q || estado
            ? "Prueba con otro término o quita el filtro."
            : "Calcula un trabajo y guárdalo para empezar tu histórico."}
        </EmptyState>
      ) : (
        <>
          {/* Móvil: cada cotización es una tarjeta con sus datos apilados, así se
              ve todo por línea sin scroll horizontal (la tabla no es cómoda en el
              teléfono). La tabla aparece a partir de 900px, donde entra completa. */}
          <ul className="mt-4 space-y-3 lg:hidden">
            {filas.map((c) => (
              <li key={c.id} className="rounded-sm border border-regla bg-hoja p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/cotizaciones/${c.id}`} className="font-medium hover:text-cian">
                      {c.titulo}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <TipoBadges tipos={c.tipos} />
                      {c.nItems > 1 && (
                        <span className="rounded-sm bg-suave px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-kraft">
                          {c.nItems} ítems
                        </span>
                      )}
                    </div>
                  </div>
                  <EstadoBadge estado={c.estado} />
                </div>

                <div className="mt-2 text-[11px] leading-relaxed text-kraft">
                  <span className="font-mono">N° {c.numero}</span> · {c.creadaEn.toLocaleDateString("es-VE")}
                  {c.clienteNombre ? " · " + c.clienteNombre : ""}
                  <br />
                  {c.tipo === "PROPIA" || c.tipo === "OFFSET" ? `${c.papelNombre} · ${c.tamano}` : c.papelNombre}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-suave pt-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">Cant.</div>
                    <div className="mt-0.5 font-mono text-sm">{fmtNum(c.cantidad, 0)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">Precio u.</div>
                    <div className="mt-0.5 font-mono text-sm font-bold">{usd(c.precioUnit, 4)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">Total</div>
                    <div className="mt-0.5 font-mono text-sm">{usd(c.ventaTotal)}</div>
                  </div>
                </div>

                <div className="mt-2 flex justify-end border-t border-suave pt-2">
                  <AccionesFila
                    id={c.id}
                    estado={c.estado}
                    puedeEditar={c.tipos.every((t) => permitidos.includes(t))}
                    puedeEliminar={puedeElim && c.estado === "BORRADOR" && !c.tieneOrden}
                  />
                </div>
              </li>
            ))}
          </ul>

          {/* Escritorio (≥900px): tabla completa, ya sin scroll horizontal. */}
          <div className="mt-4 hidden overflow-x-auto rounded-sm border border-regla bg-hoja lg:block">
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
                  <th className="px-4 py-2 text-right font-bold">Acciones</th>
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
                      <TipoBadges tipos={c.tipos} />
                      {c.nItems > 1 && (
                        <span className="ml-1.5 rounded-sm bg-suave px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-kraft">
                          {c.nItems} ítems
                        </span>
                      )}
                      <div className="text-[11px] text-kraft">
                        {c.clienteNombre ? c.clienteNombre + " · " : ""}
                        {c.tipo === "PROPIA" || c.tipo === "OFFSET" ? `${c.papelNombre} · ${c.tamano}` : c.papelNombre}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{fmtNum(c.cantidad, 0)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold">{usd(c.precioUnit, 4)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{usd(c.ventaTotal)}</td>
                    <td className="px-4 py-2.5"><EstadoBadge estado={c.estado} /></td>
                    <td className="px-4 py-2.5">
                      <AccionesFila
                        id={c.id}
                        estado={c.estado}
                        puedeEditar={c.tipos.every((t) => permitidos.includes(t))}
                        puedeEliminar={puedeElim && c.estado === "BORRADOR" && !c.tieneOrden}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
