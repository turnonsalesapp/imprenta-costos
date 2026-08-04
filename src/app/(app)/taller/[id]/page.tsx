import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUsuario } from "@/lib/auth";
import { obtenerOrden, ESTADOS_ORDEN, ETIQUETA_ORDEN, ETIQUETA_PIEZA } from "@/lib/ordenes";
import { cambiarEstadoOrdenAction, actualizarOrdenAction } from "@/app/actions/ordenes";
import { fmtNum } from "@/lib/calculo";
import { EtapaToggle } from "../EtapaToggle";
import { OrdenBadge } from "../OrdenBadge";
import { TipoBadges } from "../../cotizaciones/TipoBadges";
import { BotonImprimir } from "./BotonImprimir";
import { SelectorPieza } from "./SelectorPieza";
import { SelectorCobro } from "./SelectorCobro";
import { SectionTitle } from "@/app/_components/ui";
import { Hilo } from "@/app/(app)/_hilo/Hilo";
import type { TipoCotizacion } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function OrdenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await requireUsuario();
  const { id } = await params;
  const o = await obtenerOrden(id);
  if (!o) notFound();

  const gestiona = usuario.rol !== "TALLER"; // ADMIN o VENDEDOR
  const multi = o.items.length > 1;
  const fechaValor = o.fechaEntrega ? o.fechaEntrega.toISOString().slice(0, 10) : "";

  // Técnica de impresión, deducida de las etapas de la orden.
  const tecnica = o.etapas.some((e) => e.clave === "impRetiro")
    ? "Tiro y retiro (T+R)"
    : o.etapas.some((e) => e.clave === "impTiro")
      ? "Solo tiro (T)"
      : "—";

  return (
    <>
      <div className="no-print flex items-center justify-between gap-4">
        <Link href="/taller" className="text-sm text-kraft hover:text-tinta">← Producción</Link>
        <div className="flex items-center gap-2">
          <OrdenBadge estado={o.estado} />
          <BotonImprimir />
        </div>
      </div>

      {/* ───────────────────────── hoja de orden ───────────────────────── */}
      <article className="hoja-orden mt-4 rounded-sm border border-regla bg-hoja">
        <div className="flex h-1.5 overflow-hidden">
          <i className="flex-1 bg-cian" />
          <i className="flex-1 bg-magenta" />
          <i className="flex-1 bg-amarillo" />
          <i className="flex-1 bg-tinta" />
        </div>

        <div className="p-5">
          <div className="flex items-baseline justify-between gap-4 border-b border-regla pb-3">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Trabajo de producción</h1>
              <p className="text-xs uppercase tracking-widest text-kraft">
                N° {o.numero} · Orden de Venta {o.cotizacionNumero} · {o.creadaEn.toLocaleDateString("es-VE")}
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-kraft">Entrega</div>
              <div className="font-mono text-sm font-bold">
                {o.fechaEntrega ? o.fechaEntrega.toLocaleDateString("es-VE") : "Sin fecha"}
              </div>
            </div>
          </div>

          {/* Datos de producción — sin costos */}
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            <Dato k="Cliente" v={o.cliente ?? "—"} />
            <Dato k="Técnica" v={tecnica} />
            {multi ? (
              <Dato k="Ítems" v={`${o.items.length}`} />
            ) : (
              <>
                <Dato k="Trabajo" v={o.titulo} />
                <Dato k="Cantidad" v={`${fmtNum(o.cantidad, 0)} pzs`} />
                <Dato k="Medida" v={`${fmtNum(o.ancho, 0)}×${fmtNum(o.alto, 0)} mm`} />
                <Dato k="Papel" v={o.papelNombre} />
                <Dato k="Tamaño de corte" v={o.tamano} />
                <Dato k="Montaje (arte por corte)" v={`${fmtNum(o.capacidad, 0)} pzs`} />
                <Dato k="Cuartos a imprimir (con merma)" v={fmtNum(o.pliegos, 2)} />
              </>
            )}
          </dl>

          {multi ? (
            <div className="mt-4 overflow-x-auto border-t border-regla pt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-regla text-left text-[10px] uppercase tracking-widest text-kraft">
                    <th className="py-2 pr-2 font-bold">Ítem</th>
                    <th className="py-2 px-2 text-right font-bold">Cant.</th>
                    <th className="py-2 px-2 font-bold">Medida</th>
                    <th className="py-2 px-2 font-bold">Papel</th>
                    <th className="py-2 px-2 font-bold">Corte</th>
                    <th className="py-2 px-2 text-right font-bold">Cuartos</th>
                    <th className="py-2 pl-2 font-bold">Acabados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-suave align-top">
                  {o.items.map((it, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-2">
                        <div className="font-medium">{it.titulo}</div>
                        {it.descripcion ? <div className="text-[11px] text-kraft">{it.descripcion}</div> : null}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">{fmtNum(it.cantidad, 0)}</td>
                      <td className="py-2 px-2 font-mono text-[13px]">{fmtNum(it.ancho, 0)}×{fmtNum(it.alto, 0)} mm</td>
                      <td className="py-2 px-2 text-[13px]">{it.papelNombre}</td>
                      <td className="py-2 px-2 font-mono text-[13px]">{it.tamano}</td>
                      <td className="py-2 px-2 text-right font-mono">{fmtNum(it.pliegos, 2)}</td>
                      <td className="py-2 pl-2 text-[12px] text-kraft">{it.acabados.join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : o.descripcion ? (
            <p className="mt-4 border-t border-regla pt-3 text-sm">{o.descripcion}</p>
          ) : null}

          {/* Etapas */}
          <div className="mt-5">
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
              Etapas de producción
            </h2>
            <div className="space-y-2">
              {o.etapas.map((e) => (
                <EtapaToggle key={e.id} etapa={e} />
              ))}
            </div>
          </div>

          {/* Piezas */}
          {o.piezas.length > 0 ? (
            <div className="mt-5">
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
                Piezas
              </h2>
              <ul className="space-y-2">
                {o.piezas.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-start justify-between gap-3 rounded-sm border border-regla bg-hoja px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="-ml-1.5 flex flex-wrap items-center gap-y-1">
                        <TipoBadges tipos={[p.tipo as TipoCotizacion]} />
                      </div>
                      <div className="mt-1 text-sm font-medium">{p.titulo}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-kraft">
                        {fmtNum(p.cantidad, 0)} pzs
                        {p.carril === "TERCERIZADO" && p.proveedorNombre ? ` · ${p.proveedorNombre}` : ""}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {gestiona ? (
                        <SelectorPieza id={p.id} carril={p.carril} estado={p.estado} />
                      ) : (
                        <span className="text-[11px] font-bold uppercase tracking-wide text-kraft">
                          {ETIQUETA_PIEZA[p.estado]}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {o.instrucciones ? (
            <div className="mt-5 border-t border-regla pt-3">
              <h2 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-kraft">Instrucciones</h2>
              <p className="whitespace-pre-wrap text-sm">{o.instrucciones}</p>
            </div>
          ) : null}

          {/* Empaque y cierre — se llenan a mano en el taller */}
          <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-regla pt-5 sm:grid-cols-3">
            <FirmaLinea k="N° de bultos" />
            <FirmaLinea k="Unidades por bulto" />
            <FirmaLinea k="Cuartos dañados" />
            <FirmaLinea k="Recibe conforme" />
            <FirmaLinea k="Autorizado por" />
            <FirmaLinea k="Fecha de entrega" />
          </div>
        </div>
      </article>

      {/* ─────────────────── controles (ADMIN/VENDEDOR) ─────────────────── */}
      {gestiona ? (
        <div className="no-print mt-5 grid gap-4 sm:grid-cols-2">
          <form action={actualizarOrdenAction} className="rounded-sm border border-regla bg-hoja p-4">
            <input type="hidden" name="id" value={o.id} />
            <SectionTitle>Entrega e instrucciones</SectionTitle>
            <label className="block">
              <span className="text-[11px] text-kraft">Fecha de entrega</span>
              <input type="date" name="fecha" defaultValue={fechaValor}
                className="mt-1 block rounded-sm border border-regla bg-white px-3 py-1.5 text-sm outline-none focus:border-cian" />
            </label>
            <label className="mt-3 block">
              <span className="text-[11px] text-kraft">Instrucciones para el taller</span>
              <textarea name="instrucciones" rows={3} defaultValue={o.instrucciones ?? ""}
                className="mt-1 block w-full rounded-sm border border-regla bg-white px-3 py-2 text-sm outline-none focus:border-cian" />
            </label>
            <button type="submit" className="mt-3 rounded-sm bg-tinta px-4 py-2 text-sm font-bold text-hoja hover:opacity-90">
              Guardar
            </button>
          </form>

          <form action={cambiarEstadoOrdenAction} className="h-fit rounded-sm border border-regla bg-hoja p-4">
            <input type="hidden" name="id" value={o.id} />
            <SectionTitle>Estado de la orden</SectionTitle>
            <div className="flex gap-2">
              <select name="estado" defaultValue={o.estado}
                className="flex-1 rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian">
                {ESTADOS_ORDEN.map((e) => (
                  <option key={e} value={e}>{ETIQUETA_ORDEN[e]}</option>
                ))}
              </select>
              <button type="submit" className="rounded-sm bg-tinta px-3 py-1.5 text-sm font-bold text-hoja hover:opacity-90">
                Guardar
              </button>
            </div>
            <p className="mt-2 text-[11px] text-kraft">
              El estado avanza solo al marcar etapas; aquí lo forzas (entregada, anulada).
            </p>
          </form>

          <SelectorCobro
            id={o.id}
            estado={o.estadoCobro}
            fechaFactura={o.fechaFactura ? o.fechaFactura.toISOString() : null}
            fechaCobro={o.fechaCobro ? o.fechaCobro.toISOString() : null}
          />
        </div>
      ) : null}

      {/* Hilo del trabajo: comentarios + adjuntos (mismo hilo de la cotización,
          vía cotizacionId). Sin precios: participan todos los roles, TALLER
          incluido. No se imprime con la hoja de orden. */}
      <div className="no-print">
        <Hilo cotizacionId={o.cotizacionId} usuario={{ id: usuario.id, rol: usuario.rol }} />
      </div>
    </>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-widest text-kraft">{k}</dt>
      <dd className="mt-0.5 text-sm font-medium">{v}</dd>
    </div>
  );
}

/** Línea en blanco para llenar a mano (empaque, firmas). */
function FirmaLinea({ k }: { k: string }) {
  return (
    <div>
      <div className="h-6 border-b border-tinta/40" />
      <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-kraft">{k}</div>
    </div>
  );
}
