import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { obtenerCotizacion, ESTADOS, ETIQUETA_ESTADO } from "@/lib/cotizaciones";
import { cambiarEstadoAction } from "@/app/actions/cotizaciones";
import { generarOrdenAction } from "@/app/actions/ordenes";
import { fmtNum, usd } from "@/lib/calculo";
import { EstadoBadge } from "../EstadoBadge";

export const dynamic = "force-dynamic";

const TINTAS = ["#0B8FA8", "#C4177C", "#C79400", "#171B19", "#5B8C5A", "#8A5FBF", "#C0563B"];

export default async function DetalleCotizacion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol("ADMIN", "VENDEDOR");
  const { id } = await params;
  const c = await obtenerCotizacion(id);
  if (!c) notFound();

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Link href="/cotizaciones" className="text-sm text-kraft hover:text-tinta">← Cotizaciones</Link>
        <EstadoBadge estado={c.estado} />
      </div>

      <header className="mt-3">
        <h1 className="text-lg font-bold tracking-tight">
          {c.titulo}{" "}
          <span className="font-mono text-sm font-normal text-kraft">N° {c.numero}</span>
        </h1>
        <p className="mt-0.5 text-sm text-kraft">
          {c.clienteNombre ? c.clienteNombre + " · " : ""}
          {c.creadaEn.toLocaleDateString("es-VE")}
          {c.autor ? " · " + c.autor : ""}
        </p>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Desglose congelado */}
        <section className="rounded-sm border border-regla bg-hoja">
          <div className="border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
            Desglose de costos
          </div>
          <div className="divide-y divide-suave">
            {c.lineas.map((l, i) => (
              <div key={l.k} className="flex items-baseline gap-3 px-4 py-2.5 text-sm">
                <span className="h-2 w-2 shrink-0 rounded-[1px]" style={{ background: TINTAS[i % TINTAS.length] }} />
                <span className="min-w-0 flex-1">
                  {l.label}
                  <span className="block font-mono text-[11px] text-kraft">{l.detalle}</span>
                </span>
                <span className="ml-auto font-mono">{usd(l.monto)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-baseline border-t border-regla px-4 py-2.5 text-sm font-bold">
            <span>Costo total</span>
            <span className="ml-auto font-mono">{usd(c.costoTotal)}</span>
          </div>
          <div className="flex items-baseline px-4 pb-3 text-sm text-kraft">
            <span>Costo unitario</span>
            <span className="ml-auto font-mono">{usd(c.costoUnit, 4)}</span>
          </div>
        </section>

        {/* Precio y condiciones */}
        <div className="space-y-4">
          <section className="rounded-sm bg-tinta px-4 py-4 text-hoja">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#9AA39C]">
              Precio unitario de venta
            </div>
            <div className="mt-1 font-mono text-3xl font-bold tracking-tight">{usd(c.precioUnit, 4)}</div>
            <div className="mt-3 flex gap-4 border-t border-[#333937] pt-3 font-mono text-[11px] text-[#B9C1BA]">
              <span>Venta total <b className="text-hoja">{usd(c.ventaTotal)}</b></span>
              <span>Bs <b className="text-hoja">{fmtNum(c.precioBs, 2)}</b></span>
              <span>ML <b className="text-hoja">{usd(c.precioML, 4)}</b></span>
            </div>
          </section>

          <section className="rounded-sm border border-regla bg-hoja p-4 text-sm">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
              Condiciones del cálculo
            </div>
            {c.descripcion && <p className="mb-2">{c.descripcion}</p>}
            <dl className="space-y-1 font-mono text-[12px] text-kraft">
              <Cond k="Medida" v={`${fmtNum(c.ancho, 0)}×${fmtNum(c.alto, 0)} mm`} />
              <Cond k="Cantidad" v={`${fmtNum(c.cantidad, 0)} pzs`} />
              <Cond k="Papel" v={c.papelNombre} />
              <Cond k="Tamaño de corte" v={c.tamano} />
              <Cond k="Piezas por corte" v={fmtNum(c.capacidad, 0)} />
              <Cond k="Cortes (con merma)" v={fmtNum(c.pliegos, 2)} />
              <Cond k="Margen" v={`${fmtNum(c.margen, 0)}%`} />
              <Cond k="Diferencial" v={fmtNum(c.diferencial, 4)} />
              <Cond k="Tasa BCV" v={fmtNum(c.tasaBCV, 2)} />
            </dl>
          </section>

          {/* Cambio de estado */}
          <section className="rounded-sm border border-regla bg-hoja p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">Estado</div>
            <form action={cambiarEstadoAction} className="flex gap-2">
              <input type="hidden" name="id" value={c.id} />
              <select
                name="estado"
                defaultValue={c.estado}
                className="flex-1 rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian"
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>{ETIQUETA_ESTADO[e]}</option>
                ))}
              </select>
              <button type="submit" className="rounded-sm bg-tinta px-3 py-1.5 text-sm font-bold text-hoja hover:opacity-90">
                Guardar
              </button>
            </form>
          </section>

          {/* Orden de producción */}
          <section className="rounded-sm border border-regla bg-hoja p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
              Orden de producción
            </div>
            {c.orden ? (
              <Link
                href={`/taller/${c.orden.id}`}
                className="inline-block rounded-sm border border-regla px-3 py-1.5 text-sm font-medium hover:border-tinta"
              >
                Ver orden N° {c.orden.numero} →
              </Link>
            ) : c.estado === "APROBADA" ? (
              <form action={generarOrdenAction}>
                <input type="hidden" name="cotizacionId" value={c.id} />
                <button type="submit" className="w-full rounded-sm bg-cian px-3 py-2 text-sm font-bold text-hoja hover:opacity-90">
                  Generar orden de producción
                </button>
              </form>
            ) : (
              <p className="text-[11px] text-kraft">
                Aprueba la cotización (arriba) para poder generar su orden de producción.
              </p>
            )}
          </section>

          <p className="text-[11px] leading-relaxed text-kraft">
            Esta cotización es inmutable: se guardó con los precios y tasas del día
            y no se recalcula. Aunque cambien las variables, seguirá mostrando lo
            que se le prometió al cliente.
          </p>
        </div>
      </div>
    </>
  );
}

function Cond({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{k}</dt>
      <dd className="text-tinta">{v}</dd>
    </div>
  );
}
