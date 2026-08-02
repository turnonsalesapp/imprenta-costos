import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { listarProveedores, comparadorPapeles } from "@/lib/proveedores";
import { crearProveedorAction, marcarPredeterminadoAction } from "@/app/actions/proveedores";
import { usd } from "@/lib/calculo";
import { PageHeader, SectionTitle, EmptyState } from "@/app/_components/ui";
import { BotonPreferido } from "./BotonPreferido";
import { BorrarProveedor } from "./BorrarProveedor";

export const dynamic = "force-dynamic";

const inCls =
  "mt-1 block w-full rounded-sm border border-regla bg-white px-3 py-2 text-base outline-none focus:border-cian sm:text-sm";
const labelCls = "text-[10px] font-bold uppercase tracking-widest text-kraft";

export default async function ProveedoresPage() {
  await requireRol("ADMIN");
  const [proveedores, comparador] = await Promise.all([
    listarProveedores(),
    comparadorPapeles(),
  ]);

  return (
    <>
      <PageHeader title="Proveedores" eyebrow="Listas de precios de papel">
        <Link
          href="/proveedores/importar"
          className="rounded-sm bg-tinta px-3 py-2 text-sm font-bold text-hoja hover:opacity-90"
        >
          Importar lista
        </Link>
        <a
          href="/api/proveedores/plantilla"
          className="rounded-sm border border-regla px-3 py-2 text-sm font-medium text-kraft hover:border-tinta hover:text-tinta"
        >
          Descargar plantilla
        </a>
      </PageHeader>

      {/* Nuevo proveedor */}
      <section className="mt-8">
        <SectionTitle>Nuevo proveedor</SectionTitle>
        <form
          action={async (fd) => {
            "use server";
            await crearProveedorAction(fd);
          }}
          className="grid grid-cols-1 gap-3 rounded-sm border border-regla bg-hoja p-4 sm:grid-cols-2"
        >
          <label className="block">
            <span className={labelCls}>Nombre</span>
            <input name="nombre" required placeholder="Distribuidora…" className={inCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Moneda</span>
            <input name="moneda" defaultValue="USD" className={inCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Contacto</span>
            <input name="contacto" placeholder="Teléfono, correo…" className={inCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Notas</span>
            <input name="notas" placeholder="Opcional" className={inCls} />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-sm bg-tinta px-4 py-2 text-sm font-bold text-hoja hover:opacity-90"
            >
              Agregar proveedor
            </button>
          </div>
        </form>
      </section>

      {/* Lista de proveedores */}
      <section className="mt-6">
        <SectionTitle>Proveedores</SectionTitle>
        {proveedores.length === 0 ? (
          <EmptyState title="Aún no hay proveedores">
            Agrega el primero con el formulario de arriba para cargar sus listas de precios.
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {proveedores.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sm border border-regla bg-hoja p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{p.nombre}</span>
                    {p.predeterminado && (
                      <span className="rounded-sm bg-[#E6F4F8] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cian">
                        Predeterminado
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-kraft">
                    <span className="font-mono">{p.moneda}</span>
                    {" · "}
                    <span className="tabular font-mono">{p.nPrecios}</span>{" "}
                    {p.nPrecios === 1 ? "precio" : "precios"}
                    {p.contacto ? ` · ${p.contacto}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!p.predeterminado && (
                    <form action={marcarPredeterminadoAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-sm border border-regla px-2.5 py-1 text-xs font-medium text-kraft hover:border-tinta hover:text-tinta"
                      >
                        Hacer predeterminado
                      </button>
                    </form>
                  )}
                  {p.predeterminado ? (
                    <span className="text-[11px] text-kraft">No se puede borrar</span>
                  ) : (
                    <BorrarProveedor id={p.id} nombre={p.nombre} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Comparador de listas por papel */}
      <section className="mt-6">
        <SectionTitle acento="bg-cian">Comparador de precios</SectionTitle>
        {comparador.length === 0 ? (
          <EmptyState title="No hay papeles activos que comparar">
            Carga listas de precios de tus proveedores para verlas lado a lado.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {comparador.map((papel) => (
              <div key={papel.papelId} className="rounded-sm border border-regla bg-hoja p-4">
                {/* Encabezado del papel */}
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] text-kraft">{papel.clave}</span>
                    <span className="ml-2 text-sm font-medium">{papel.nombre}</span>
                  </div>
                  <div className="text-right">
                    <span className={labelCls}>Precio efectivo</span>{" "}
                    <span className="tabular font-mono text-sm font-bold">
                      {usd(papel.precioEfectivo)}
                    </span>
                  </div>
                </div>

                {papel.ahorroMasBarato > 0 && (
                  <p className="mt-2 rounded-sm bg-[#EDF9F1] px-2 py-1 text-[11px] text-exito">
                    Ahorro potencial: {usd(papel.ahorroMasBarato)} con el más barato.
                  </p>
                )}

                {papel.precios.length === 0 ? (
                  <p className="mt-3 text-[13px] text-kraft">
                    Sin precios de proveedores para este papel todavía.
                  </p>
                ) : (
                  <>
                    {/* Móvil (<md): cada precio como tarjeta apilada. */}
                    <ul className="mt-3 space-y-2 md:hidden">
                      {papel.precios.map((pr) => (
                        <li
                          key={pr.proveedorId}
                          className={`rounded-sm border border-regla p-3 ${pr.esMasBarato ? "bg-[#EDF9F1]" : ""}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">
                              {pr.proveedorNombre}
                              {pr.esPreferido && (
                                <span className="ml-2 rounded-sm bg-[#E6F4F8] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cian">
                                  Preferido
                                </span>
                              )}
                              {pr.esMasBarato && (
                                <span className="ml-2 rounded-sm bg-[#EDF9F1] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-exito">
                                  Más barato
                                </span>
                              )}
                            </span>
                            {!pr.esPreferido && (
                              <BotonPreferido papelId={papel.papelId} proveedorId={pr.proveedorId} />
                            )}
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-suave pt-2">
                            <div>
                              <div className={labelCls}>Precio ({pr.unidad})</div>
                              <div className="tabular mt-0.5 font-mono text-sm">{usd(pr.precio)}</div>
                            </div>
                            <div>
                              <div className={labelCls}>Por resma</div>
                              <div className="tabular mt-0.5 font-mono text-sm font-bold">
                                {usd(pr.precioResma)}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {/* Escritorio (≥md): tabla completa. */}
                    <div className="mt-3 hidden overflow-x-auto rounded-sm border border-regla md:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-regla bg-suave text-left text-[10px] uppercase tracking-widest text-kraft">
                            <th className="px-3 py-2 font-bold">Proveedor</th>
                            <th className="px-3 py-2 text-right font-bold">Precio (unidad)</th>
                            <th className="px-3 py-2 text-right font-bold">Por resma</th>
                            <th className="px-3 py-2 font-bold">Vigente</th>
                            <th className="px-3 py-2 text-right font-bold">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-suave">
                          {papel.precios.map((pr) => (
                            <tr key={pr.proveedorId} className={pr.esMasBarato ? "bg-[#EDF9F1]" : ""}>
                              <td className="px-3 py-2">
                                {pr.proveedorNombre}
                                {pr.esPreferido && (
                                  <span className="ml-2 rounded-sm bg-[#E6F4F8] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cian">
                                    Preferido
                                  </span>
                                )}
                                {pr.esMasBarato && (
                                  <span className="ml-2 rounded-sm bg-[#EDF9F1] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-exito">
                                    Más barato
                                  </span>
                                )}
                              </td>
                              <td className="tabular whitespace-nowrap px-3 py-2 text-right font-mono">
                                {usd(pr.precio)} <span className="text-kraft">/ {pr.unidad}</span>
                              </td>
                              <td className="tabular px-3 py-2 text-right font-mono font-bold">
                                {usd(pr.precioResma)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 font-mono text-[13px] text-kraft">
                                {pr.vigenteDesde.toLocaleDateString("es-VE")}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {pr.esPreferido ? (
                                  <span className="text-[11px] text-kraft">—</span>
                                ) : (
                                  <BotonPreferido papelId={papel.papelId} proveedorId={pr.proveedorId} />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
