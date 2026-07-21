import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUsuario } from "@/lib/auth";
import { obtenerOrden, ESTADOS_ORDEN, ETIQUETA_ORDEN } from "@/lib/ordenes";
import { cambiarEstadoOrdenAction, actualizarOrdenAction } from "@/app/actions/ordenes";
import { fmtNum } from "@/lib/calculo";
import { EtapaToggle } from "../EtapaToggle";
import { OrdenBadge } from "../OrdenBadge";
import { BotonImprimir } from "./BotonImprimir";

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
  const fechaValor = o.fechaEntrega ? o.fechaEntrega.toISOString().slice(0, 10) : "";

  return (
    <>
      <div className="no-print flex items-center justify-between gap-4">
        <Link href="/taller" className="text-sm text-kraft hover:text-tinta">← Taller</Link>
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
              <h1 className="text-lg font-bold tracking-tight">Orden de producción</h1>
              <p className="text-xs uppercase tracking-widest text-kraft">
                N° {o.numero} · {o.creadaEn.toLocaleDateString("es-VE")}
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
            <Dato k="Trabajo" v={o.titulo} />
            <Dato k="Cantidad" v={`${fmtNum(o.cantidad, 0)} pzs`} />
            <Dato k="Medida" v={`${fmtNum(o.ancho, 0)}×${fmtNum(o.alto, 0)} mm`} />
            <Dato k="Papel" v={o.papelNombre} />
            <Dato k="Tamaño de corte" v={o.tamano} />
            <Dato k="Montaje" v={`${fmtNum(o.capacidad, 0)} pzs por corte`} />
            <Dato k="Cortes" v={`${fmtNum(o.pliegos, 2)} (con merma)`} />
          </dl>

          {o.descripcion ? (
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

          {o.instrucciones ? (
            <div className="mt-5 border-t border-regla pt-3">
              <h2 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-kraft">Instrucciones</h2>
              <p className="whitespace-pre-wrap text-sm">{o.instrucciones}</p>
            </div>
          ) : null}
        </div>
      </article>

      {/* ─────────────────── controles (ADMIN/VENDEDOR) ─────────────────── */}
      {gestiona ? (
        <div className="no-print mt-5 grid gap-4 sm:grid-cols-2">
          <form action={actualizarOrdenAction} className="rounded-sm border border-regla bg-hoja p-4">
            <input type="hidden" name="id" value={o.id} />
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">Entrega e instrucciones</h2>
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
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">Estado de la orden</h2>
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
        </div>
      ) : null}
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
