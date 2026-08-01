import Link from "next/link";
import { notFound } from "next/navigation";
import type { EstadoCotizacion } from "@prisma/client";
import { requireRol } from "@/lib/auth";
import { esAdmin } from "@/lib/roles";
import { obtenerFichaCliente } from "@/lib/clientes";
import { alternarActivoClienteAction, eliminarClienteAction } from "@/app/actions/clientes";
import { BotonEliminar } from "@/app/_components/BotonEliminar";
import { fmtNum, usd } from "@/lib/calculo";
import { EstadoBadge } from "../../cotizaciones/EstadoBadge";
import { ClienteForm } from "../ClienteForm";
import { PageHeader, SectionTitle, EmptyState } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export default async function FichaClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  const { id } = await params;
  const c = await obtenerFichaCliente(id);
  if (!c) notFound();

  const puedeBorrar = esAdmin(usuario.rol) && c.cotizaciones.length === 0 && c.trabajos.length === 0;

  return (
    <>
      <PageHeader title={c.nombre} back={{ href: "/clientes", label: "Clientes" }}>
        <span className={c.activo ? "text-xs font-medium text-exito" : "text-xs font-medium text-kraft"}>
          {c.activo ? "Activo" : "Inactivo"}
        </span>
        <Link href="/cotizacion-nueva" className="rounded-sm bg-tinta px-3 py-1.5 text-sm font-bold text-hoja hover:opacity-90">
          Cotizar
        </Link>
        <form action={alternarActivoClienteAction}>
          <input type="hidden" name="id" value={c.id} />
          <button type="submit" className="rounded-sm border border-regla px-3 py-1.5 text-sm font-medium text-kraft hover:border-tinta hover:text-tinta">
            {c.activo ? "Desactivar" : "Activar"}
          </button>
        </form>
        {puedeBorrar && (
          <BotonEliminar
            accion={eliminarClienteAction}
            id={c.id}
            texto="Eliminar"
            confirmacion="¿Eliminar este cliente? Solo se permite porque no tiene histórico."
          />
        )}
      </PageHeader>

      {/* Datos editables */}
      <section className="mt-8">
        <SectionTitle>Datos del cliente</SectionTitle>
        <ClienteForm
          modo="editar"
          initial={{
            id: c.id, nombre: c.nombre, rif: c.rif, contacto: c.contacto,
            telefono: c.telefono, email: c.email, direccion: c.direccion, notas: c.notas,
          }}
        />
      </section>

      {/* Plantillas (trabajos repetibles) */}
      <section className="mt-6">
        <SectionTitle>Plantillas</SectionTitle>
        {c.trabajos.length === 0 ? (
          <EmptyState title="Sin plantillas guardadas">
            Al cotizar, marca “guardar también como plantilla”.
          </EmptyState>
        ) : (
          <>
            {/* Móvil: una tarjeta por plantilla, sin scroll horizontal. */}
            <ul className="space-y-3 md:hidden">
              {c.trabajos.map((t) => (
                <li key={t.id} className="rounded-sm border border-regla bg-hoja p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 font-medium">{t.nombre}</div>
                    <Link href={`/cotizacion-nueva?trabajo=${t.id}`}
                      className="shrink-0 rounded-sm bg-cian px-3 py-1.5 text-xs font-bold text-hoja hover:opacity-90">
                      Recotizar
                    </Link>
                  </div>
                  <div className="mt-2 text-[11px] leading-relaxed text-kraft">
                    {fmtNum(t.ancho, 0)}×{fmtNum(t.alto, 0)} mm · {t.tamano}
                    {t.papelNombre ? " · " + t.papelNombre : ""}
                  </div>
                </li>
              ))}
            </ul>

            {/* Escritorio (≥768px): tabla completa. */}
            <div className="hidden overflow-x-auto rounded-sm border border-regla bg-hoja md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-regla bg-suave text-left text-[10px] uppercase tracking-widest text-kraft">
                    <th className="px-4 py-2 font-bold">Plantilla</th>
                    <th className="px-4 py-2 font-bold">Receta</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-suave">
                  {c.trabajos.map((t) => (
                    <tr key={t.id} className="hover:bg-suave">
                      <td className="px-4 py-2.5 font-medium">{t.nombre}</td>
                      <td className="px-4 py-2.5 text-[13px] text-kraft">
                        {fmtNum(t.ancho, 0)}×{fmtNum(t.alto, 0)} mm · {t.tamano}
                        {t.papelNombre ? " · " + t.papelNombre : ""}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link href={`/cotizacion-nueva?trabajo=${t.id}`}
                          className="rounded-sm bg-cian px-3 py-1.5 text-xs font-bold text-hoja hover:opacity-90">
                          Recotizar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Histórico de cotizaciones */}
      <section className="mt-6">
        <SectionTitle>Cotizaciones ({c.cotizaciones.length})</SectionTitle>
        {c.cotizaciones.length === 0 ? (
          <EmptyState title="Todavía no le has cotizado nada a este cliente" />
        ) : (
          <>
            {/* Móvil: cada cotización es una tarjeta con sus datos apilados. */}
            <ul className="space-y-3 md:hidden">
              {c.cotizaciones.map((q) => (
                <li key={q.id} className="rounded-sm border border-regla bg-hoja p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/cotizaciones/${q.id}`} className="min-w-0 font-medium hover:text-cian">
                      {q.titulo}
                    </Link>
                    <EstadoBadge estado={q.estado as EstadoCotizacion} />
                  </div>

                  <div className="mt-2 text-[11px] leading-relaxed text-kraft">
                    <span className="font-mono">N° {q.numero}</span> · {q.creadaEn.toLocaleDateString("es-VE")}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-suave pt-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">Cant.</div>
                      <div className="tabular mt-0.5 font-mono text-sm">{fmtNum(q.cantidad, 0)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">Precio u.</div>
                      <div className="tabular mt-0.5 font-mono text-sm font-bold">{usd(q.precioUnit, 4)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">Venta</div>
                      <div className="tabular mt-0.5 font-mono text-sm">{usd(q.ventaTotal)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Escritorio (≥768px): tabla completa. */}
            <div className="hidden overflow-x-auto rounded-sm border border-regla bg-hoja md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-regla bg-suave text-left text-[10px] uppercase tracking-widest text-kraft">
                    <th className="px-4 py-2 font-bold">N°</th>
                    <th className="px-4 py-2 font-bold">Fecha</th>
                    <th className="px-4 py-2 font-bold">Trabajo</th>
                    <th className="px-4 py-2 text-right font-bold">Cant.</th>
                    <th className="px-4 py-2 text-right font-bold">Precio unit.</th>
                    <th className="px-4 py-2 text-right font-bold">Venta</th>
                    <th className="px-4 py-2 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-suave">
                  {c.cotizaciones.map((q) => (
                    <tr key={q.id} className="hover:bg-suave">
                      <td className="px-4 py-2.5 font-mono text-kraft">{q.numero}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[13px] text-kraft">
                        {q.creadaEn.toLocaleDateString("es-VE")}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link href={`/cotizaciones/${q.id}`} className="font-medium hover:text-cian">{q.titulo}</Link>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">{fmtNum(q.cantidad, 0)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold">{usd(q.precioUnit, 4)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{usd(q.ventaTotal)}</td>
                      <td className="px-4 py-2.5"><EstadoBadge estado={q.estado as EstadoCotizacion} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
