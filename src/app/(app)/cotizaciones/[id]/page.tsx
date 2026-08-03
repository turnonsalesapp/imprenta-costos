import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { obtenerCotizacion, cargarCotizacionEnDraft, ESTADOS, ETIQUETA_ESTADO, esOrdenVenta } from "@/lib/cotizaciones";
import { cambiarEstadoAction, eliminarCotizacionAction } from "@/app/actions/cotizaciones";
import { generarOrdenAction } from "@/app/actions/ordenes";
import { tiposQuePuedeCotizar, puedeEliminarCotizaciones, puedeVerEstructura } from "@/lib/roles";
import { BotonEliminar } from "@/app/_components/BotonEliminar";
import { fmtNum, usd } from "@/lib/calculo";
import { EstadoBadge } from "../EstadoBadge";
import { CargarCotizadorBtn } from "./CargarCotizadorBtn";
import { PageHeader } from "@/app/_components/ui";
import { Hilo } from "@/app/(app)/_hilo/Hilo";

export const dynamic = "force-dynamic";

const TINTAS = ["#0B8FA8", "#C4177C", "#C79400", "#171B19", "#5B8C5A", "#8A5FBF", "#C0563B"];

export default async function DetalleCotizacion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  const { id } = await params;
  const c = await obtenerCotizacion(id);
  if (!c) notFound();

  // Estructura de costos (costo, costo unit, margen, diferencial, desglose): solo
  // si el usuario la ve. Si no, se muestra únicamente el precio de venta y datos.
  const verEstructura = puedeVerEstructura(usuario);

  const puedeBorrar = puedeEliminarCotizaciones(usuario) && c.estado === "BORRADOR" && !c.orden;
  const permitidos = tiposQuePuedeCotizar(usuario);
  // Puede reeditar/copiar solo si puede cotizar todos los tipos que contiene.
  const puedeCargar = c.items.length > 0 && c.items.every((it) => permitidos.includes(it.tipo ?? c.tipo));
  const esMixta = c.tipo === "MIXTA";
  const tercerizado = c.tipo === "PROVEEDOR" || c.tipo === "GRAN_FORMATO" || c.tipo === "PERSONALIZADO";
  const multi = c.items.length > 1;
  // Columna izquierda (desglose): con estructura siempre; sin ella, solo en multi
  // para listar la venta por ítem (precio). En single sin estructura, se oculta.
  const mostrarColIzq = verEstructura || multi;
  // Ítems producibles en el taller (digital/offset). Los tercerizados no van a producción.
  const itemsProducibles = c.items.filter((it) => (it.tipo ?? c.tipo) === "PROPIA" || (it.tipo ?? c.tipo) === "OFFSET");
  const generaOrden = !tercerizado && itemsProducibles.length > 0;
  // Ruta B: editar y copiar cargan la cotización (de cualquier tipo) en el cotizador unificado.
  const cargaEditar = c.estado === "BORRADOR" ? await cargarCotizacionEnDraft(c.id, "editar") : null;
  const cargaCopia = await cargarCotizacionEnDraft(c.id, "copia");
  const ov = esOrdenVenta(c.estado);

  return (
    <>
      <PageHeader
        back={{ href: "/cotizaciones", label: "Cotizaciones" }}
        eyebrow={
          <span className="flex items-center gap-2">
            {ov ? "Orden de Venta" : "Cotización"}
            {ov && (
              <span className="rounded-sm bg-[#EDF9F1] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-exito">
                Aprobada
              </span>
            )}
          </span>
        }
        title={
          <>
            {c.titulo}{" "}
            <span className="font-mono text-sm font-normal text-kraft">N° {c.numero}</span>
          </>
        }
      >
        {puedeCargar && cargaEditar && cargaEditar.items.length > 0 && (
          <CargarCotizadorBtn carga={cargaEditar} accion="editar" />
        )}
        {puedeCargar && cargaCopia && cargaCopia.items.length > 0 && (
          <CargarCotizadorBtn carga={cargaCopia} accion="copia" />
        )}
        <Link href={`/cotizaciones/${c.id}/imprimir`}
          className="rounded-sm border border-regla px-3 py-1.5 text-sm font-medium hover:border-tinta">
          Imprimir / PDF
        </Link>
        {puedeBorrar && (
          <BotonEliminar
            accion={eliminarCotizacionAction}
            id={c.id}
            texto="Eliminar"
            confirmacion="¿Eliminar este borrador? No se puede deshacer."
          />
        )}
        <EstadoBadge estado={c.estado} />
      </PageHeader>

      <p className="mt-3 text-sm text-kraft">
        {c.clienteNombre ? c.clienteNombre + " · " : ""}
        {c.creadaEn.toLocaleDateString("es-VE")}
        {c.autor ? " · " + c.autor : ""}
      </p>

      <div className={mostrarColIzq ? "mt-8 grid gap-5 lg:grid-cols-[1fr_320px]" : "mt-8 max-w-md"}>
        {/* Desglose congelado, por ítem. Solo se muestra si el usuario ve la
            estructura de costos; en modo multi se conserva para listar la venta
            por ítem (precio), ocultando igualmente el desglose y el costo. */}
        {mostrarColIzq && (
        <div className="space-y-4">
          {c.items.map((it, ii) => (
            <section key={ii} className="rounded-sm border border-regla bg-hoja">
              <div className="flex items-baseline gap-2 border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
                <span>{multi ? it.titulo : verEstructura ? "Desglose de costos" : "Ítem"}</span>
                {multi && <span className="ml-auto font-mono normal-case">{fmtNum(it.cantidad, 0)} u</span>}
              </div>
              {multi && it.descripcion && (
                <p className="border-b border-suave px-4 py-2 text-[12px] text-kraft">{it.descripcion}</p>
              )}
              {verEstructura && (
                <div className="divide-y divide-suave">
                  {it.lineas.map((l, i) => (
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
              )}
              {verEstructura && (
                <div className="flex items-baseline border-t border-regla px-4 py-2.5 text-sm font-bold">
                  <span>Costo total</span>
                  <span className="ml-auto font-mono">{usd(it.costoTotal)}</span>
                </div>
              )}
              {(multi || verEstructura) && (
                <div className="flex items-baseline px-4 pb-3 pt-2.5 text-sm text-kraft">
                  <span>{multi ? "Venta del ítem" : "Costo unitario"}</span>
                  <span className="ml-auto font-mono">{multi ? usd(it.ventaTotal) : usd(it.costoUnit, 4)}</span>
                </div>
              )}
            </section>
          ))}
        </div>
        )}

        {/* Precio y condiciones */}
        <div className="space-y-4">
          <section className="rounded-sm bg-tinta px-4 py-4 text-hoja">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#9AA39C]">
              {multi ? "Total de la cotización" : "Precio unitario de venta"}
            </div>
            <div className="mt-1 font-mono text-3xl font-bold tracking-tight">
              {multi ? usd(c.ventaTotal) : usd(c.items[0].precioUnit, 4)}
            </div>
            <div className="mt-3 flex gap-4 border-t border-[#333937] pt-3 font-mono text-[11px] text-[#B9C1BA]">
              {multi ? (
                <>
                  <span>{c.items.length} ítems</span>
                  <span>Bs <b className="text-hoja">{fmtNum(c.precioBs, 2)}</b></span>
                </>
              ) : (
                <>
                  <span>Venta total <b className="text-hoja">{usd(c.ventaTotal)}</b></span>
                  <span>Bs <b className="text-hoja">{fmtNum(c.precioBs, 2)}</b></span>
                  <span>ML <b className="text-hoja">{usd(c.precioML, 4)}</b></span>
                </>
              )}
            </div>
          </section>

          <section className="rounded-sm border border-regla bg-hoja p-4 text-sm">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
              Condiciones del cálculo
            </div>
            {!multi && c.descripcion && <p className="mb-2">{c.descripcion}</p>}
            <dl className="space-y-1 font-mono text-[12px] text-kraft">
              {c.tipo === "PROVEEDOR" ? (
                <>
                  {c.proveedorNombre && <Cond k="Proveedor" v={c.proveedorNombre} />}
                  {c.proveedorRef && <Cond k="Referencia" v={c.proveedorRef} />}
                  <Cond k="Cantidad" v={`${fmtNum(c.cantidad, 0)} u`} />
                  {verEstructura && <Cond k="Costo del proveedor" v={usd(c.costoTotal)} />}
                  {verEstructura && <Cond k="Margen" v={`${fmtNum(c.margen, 0)}%`} />}
                  {verEstructura && <Cond k="Diferencial" v={fmtNum(c.diferencial, 4)} />}
                  <Cond k="Tasa BCV" v={fmtNum(c.tasaBCV, 2)} />
                  {c.proveedorNotas && <Cond k="Notas" v={c.proveedorNotas} />}
                </>
              ) : c.tipo === "GRAN_FORMATO" ? (
                c.ancho > 0 ? (
                  <>
                    <Cond k="Material" v={c.papelNombre} />
                    <Cond k="Medida" v={`${fmtNum(c.ancho, 0)}×${fmtNum(c.alto, 0)} cm`} />
                    <Cond k="Cantidad" v={`${fmtNum(c.cantidad, 0)} u`} />
                    <Cond k="Cobro" v={c.tamano} />
                    {verEstructura && <Cond k="Margen" v={`${fmtNum(c.margen, 0)}%`} />}
                    {verEstructura && <Cond k="Diferencial" v={fmtNum(c.diferencial, 4)} />}
                    <Cond k="Tasa BCV" v={fmtNum(c.tasaBCV, 2)} />
                  </>
                ) : (
                  <>
                    <Cond k="Producto" v={c.papelNombre} />
                    {c.tamano && <Cond k="Medida" v={c.tamano} />}
                    <Cond k="Cantidad" v={`${fmtNum(c.cantidad, 0)} u`} />
                    {verEstructura && <Cond k="Costo por unidad" v={usd(c.costoUnit, 4)} />}
                    {verEstructura && <Cond k="Margen" v={`${fmtNum(c.margen, 0)}%`} />}
                    {verEstructura && <Cond k="Diferencial" v={fmtNum(c.diferencial, 4)} />}
                    <Cond k="Tasa BCV" v={fmtNum(c.tasaBCV, 2)} />
                  </>
                )
              ) : c.tipo === "PERSONALIZADO" ? (
                <>
                  <Cond k="Producto" v={c.papelNombre} />
                  {c.tamano && <Cond k="Cobro" v={c.tamano} />}
                  <Cond k="Cantidad" v={`${fmtNum(c.cantidad, 0)} u`} />
                  {verEstructura && <Cond k="Costo por unidad" v={usd(c.costoUnit, 4)} />}
                  {verEstructura && <Cond k="Margen" v={`${fmtNum(c.margen, 0)}%`} />}
                  {verEstructura && <Cond k="Diferencial" v={fmtNum(c.diferencial, 4)} />}
                  <Cond k="Tasa BCV" v={fmtNum(c.tasaBCV, 2)} />
                </>
              ) : c.tipo === "OFFSET" ? (
                <>
                  <Cond k="Papel" v={c.papelNombre} />
                  <Cond k="Medida pieza" v={`${fmtNum(c.ancho, 0)}×${fmtNum(c.alto, 0)} mm`} />
                  <Cond k="Cantidad" v={`${fmtNum(c.cantidad, 0)} pzs`} />
                  <Cond k="Piezas por pliego" v={fmtNum(c.capacidad, 0)} />
                  <Cond k="Pliegos" v={fmtNum(c.pliegos, 0)} />
                  <Cond k="Planchas / cara" v={c.tamano} />
                  {verEstructura && <Cond k="Margen" v={`${fmtNum(c.margen, 0)}%`} />}
                  {verEstructura && <Cond k="Diferencial" v={fmtNum(c.diferencial, 4)} />}
                  <Cond k="Tasa BCV" v={fmtNum(c.tasaBCV, 2)} />
                </>
              ) : multi ? (
                <>
                  {c.items.map((it, i) => (
                    <Cond key={i} k={it.titulo} v={`${fmtNum(it.cantidad, 0)} u · ${usd(it.precioUnit, 4)}`} />
                  ))}
                  <Cond k="Tasa BCV" v={fmtNum(c.tasaBCV, 2)} />
                </>
              ) : (
                <>
                  <Cond k="Medida" v={`${fmtNum(c.items[0].ancho, 0)}×${fmtNum(c.items[0].alto, 0)} mm`} />
                  <Cond k="Cantidad" v={`${fmtNum(c.items[0].cantidad, 0)} pzs`} />
                  <Cond k="Papel" v={c.items[0].papelNombre} />
                  <Cond k="Tamaño de corte" v={c.items[0].tamano} />
                  <Cond k="Piezas por corte" v={fmtNum(c.items[0].capacidad, 0)} />
                  <Cond k="Cortes (con merma)" v={fmtNum(c.items[0].pliegos, 2)} />
                  {verEstructura && <Cond k="Margen" v={`${fmtNum(c.margen, 0)}%`} />}
                  {verEstructura && <Cond k="Diferencial" v={fmtNum(c.diferencial, 4)} />}
                  <Cond k="Tasa BCV" v={fmtNum(c.tasaBCV, 2)} />
                </>
              )}
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

          {/* Trabajo de producción */}
          <section className="rounded-sm border border-regla bg-hoja p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
              Trabajo de producción
            </div>
            {!generaOrden ? (
              <p className="text-[11px] text-kraft">
                {esMixta
                  ? "Cotización mixta sin ítems de producción propia: no genera trabajo de taller."
                  : "Trabajo tercerizado: lo produce el proveedor, no genera trabajo de taller."}
              </p>
            ) : c.orden ? (
              <Link
                href={`/taller/${c.orden.id}`}
                className="inline-block rounded-sm border border-regla px-3 py-1.5 text-sm font-medium hover:border-tinta"
              >
                Ver trabajo N° {c.orden.numero} →
              </Link>
            ) : c.estado === "APROBADA" ? (
              <>
                <p className="mb-2 text-[11px] text-kraft">
                  Aprobada: es una <b>Orden de Venta</b>. Genera el trabajo de producción para el taller.
                  {esMixta ? ` Solo los ${itemsProducibles.length} ítem(s) de producción propia van al taller.` : ""}
                </p>
                <form action={generarOrdenAction}>
                  <input type="hidden" name="cotizacionId" value={c.id} />
                  <button type="submit" className="w-full rounded-sm bg-cian px-3 py-2 text-sm font-bold text-hoja hover:opacity-90">
                    Generar trabajo de producción
                  </button>
                </form>
              </>
            ) : (
              <p className="text-[11px] text-kraft">
                Aprueba la cotización (arriba) para convertirla en <b>Orden de Venta</b> y generar su trabajo de producción.
              </p>
            )}
          </section>

          <p className="text-[11px] leading-relaxed text-kraft">
            {ov ? "Esta Orden de Venta" : "Esta cotización"} es inmutable: se guardó con los precios y
            tasas del día y no se recalcula. Aunque cambien las variables, seguirá mostrando lo
            que se le prometió al cliente.
          </p>
        </div>
      </div>

      {/* Hilo del trabajo: comentarios + adjuntos (compartido con la orden). */}
      <Hilo cotizacionId={c.id} usuario={{ id: usuario.id, rol: usuario.rol }} />
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
