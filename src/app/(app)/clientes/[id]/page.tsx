import Link from "next/link";
import { notFound } from "next/navigation";
import type { EstadoCotizacion } from "@prisma/client";
import { requireRol } from "@/lib/auth";
import { obtenerFichaCliente } from "@/lib/clientes";
import { alternarActivoClienteAction } from "@/app/actions/clientes";
import { fmtNum, usd } from "@/lib/calculo";
import { EstadoBadge } from "../../cotizaciones/EstadoBadge";
import { ClienteForm } from "../ClienteForm";

export const dynamic = "force-dynamic";

export default async function FichaClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol("ADMIN", "VENDEDOR");
  const { id } = await params;
  const c = await obtenerFichaCliente(id);
  if (!c) notFound();

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Link href="/clientes" className="text-sm text-kraft hover:text-tinta">← Clientes</Link>
        <span className={c.activo ? "text-xs font-medium text-exito" : "text-xs font-medium text-kraft"}>
          {c.activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      <header className="mt-3 flex items-baseline justify-between gap-4">
        <h1 className="text-lg font-bold tracking-tight">{c.nombre}</h1>
        <div className="flex gap-2">
          <Link href="/cotizar" className="rounded-sm bg-tinta px-3 py-1.5 text-sm font-bold text-hoja hover:opacity-90">
            Cotizar
          </Link>
          <form action={alternarActivoClienteAction}>
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" className="rounded-sm border border-regla px-3 py-1.5 text-sm font-medium text-kraft hover:border-tinta hover:text-tinta">
              {c.activo ? "Desactivar" : "Activar"}
            </button>
          </form>
        </div>
      </header>

      {/* Datos editables */}
      <section className="mt-6">
        <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">Datos del cliente</h2>
        <ClienteForm
          modo="editar"
          initial={{
            id: c.id, nombre: c.nombre, rif: c.rif, contacto: c.contacto,
            telefono: c.telefono, email: c.email, direccion: c.direccion, notas: c.notas,
          }}
        />
      </section>

      {/* Trabajos repetidos */}
      <section className="mt-8">
        <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
          Trabajos repetidos
        </h2>
        {c.trabajos.length === 0 ? (
          <p className="rounded-sm border border-regla bg-hoja px-4 py-6 text-center text-sm text-kraft">
            Sin trabajos guardados. Al cotizar, marca “guardar también como trabajo repetido”.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-regla bg-hoja">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-regla bg-suave text-left text-[10px] uppercase tracking-widest text-kraft">
                  <th className="px-4 py-2 font-bold">Trabajo</th>
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
                      <Link href={`/cotizar?trabajo=${t.id}`}
                        className="rounded-sm bg-cian px-3 py-1.5 text-xs font-bold text-hoja hover:opacity-90">
                        Recotizar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Histórico de cotizaciones */}
      <section className="mt-8">
        <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
          Cotizaciones ({c.cotizaciones.length})
        </h2>
        {c.cotizaciones.length === 0 ? (
          <p className="rounded-sm border border-regla bg-hoja px-4 py-6 text-center text-sm text-kraft">
            Todavía no le has cotizado nada a este cliente.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-regla bg-hoja">
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
        )}
      </section>
    </>
  );
}
