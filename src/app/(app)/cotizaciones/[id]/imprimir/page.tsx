import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { obtenerCotizacion } from "@/lib/cotizaciones";
import { obtenerMembrete } from "@/lib/variables";
import { fmtNum, usd } from "@/lib/calculo";
import { BotonImprimir } from "@/app/(app)/taller/[id]/BotonImprimir";

export const dynamic = "force-dynamic";

/**
 * Cotización imprimible con membrete, para enviar al cliente. A diferencia de la
 * hoja de taller, ESTA sí muestra precios (es la cara al cliente). Se imprime o
 * se guarda como PDF desde el diálogo del navegador.
 */
export default async function ImprimirCotizacion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol("ADMIN", "VENDEDOR");
  const { id } = await params;
  const [c, m] = await Promise.all([obtenerCotizacion(id), obtenerMembrete()]);
  if (!c) notFound();

  const empresa = m.empresaNombre ?? "Imprenta";

  return (
    <>
      <div className="no-print flex items-center justify-between gap-4">
        <Link href={`/cotizaciones/${c.id}`} className="text-sm text-kraft hover:text-tinta">← Volver</Link>
        <BotonImprimir />
      </div>

      <article className="hoja-orden mx-auto mt-4 max-w-2xl rounded-sm border border-regla bg-hoja">
        <div className="flex h-1.5 overflow-hidden">
          <i className="flex-1 bg-cian" />
          <i className="flex-1 bg-magenta" />
          <i className="flex-1 bg-amarillo" />
          <i className="flex-1 bg-tinta" />
        </div>

        <div className="p-6">
          {/* Membrete */}
          <div className="flex items-start justify-between gap-4 border-b border-regla pb-4">
            <div>
              <h1 className="text-lg font-bold tracking-tight">{empresa}</h1>
              <div className="mt-0.5 text-[12px] leading-relaxed text-kraft">
                {m.empresaRif && <div>RIF: {m.empresaRif}</div>}
                {m.empresaDireccion && <div>{m.empresaDireccion}</div>}
                {m.empresaTelefono && <div>Tel: {m.empresaTelefono}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">Cotización</div>
              <div className="font-mono text-xl font-bold">N° {c.numero}</div>
              <div className="font-mono text-[12px] text-kraft">{c.creadaEn.toLocaleDateString("es-VE")}</div>
            </div>
          </div>

          {/* Cliente */}
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">Cliente</div>
            <div className="text-sm font-medium">{c.clienteNombre ?? "—"}</div>
          </div>

          {/* Detalle */}
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-y border-regla text-left text-[10px] uppercase tracking-widest text-kraft">
                <th className="py-2 font-bold">Descripción</th>
                <th className="py-2 text-right font-bold">Cantidad</th>
                <th className="py-2 text-right font-bold">Precio unit.</th>
                <th className="py-2 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-suave align-top">
                <td className="py-3">
                  <div className="font-medium">{c.titulo}</div>
                  {c.descripcion && <div className="text-[12px] text-kraft">{c.descripcion}</div>}
                  <div className="mt-1 text-[11px] text-kraft">
                    {fmtNum(c.ancho, 0)}×{fmtNum(c.alto, 0)} mm · {c.papelNombre} · {c.tamano}
                  </div>
                </td>
                <td className="py-3 text-right font-mono">{fmtNum(c.cantidad, 0)}</td>
                <td className="py-3 text-right font-mono">{usd(c.precioUnit, 4)}</td>
                <td className="py-3 text-right font-mono">{usd(c.ventaTotal)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totales */}
          <div className="mt-4 flex justify-end">
            <div className="w-64">
              <div className="flex justify-between border-t border-regla py-2 text-sm font-bold">
                <span>Total USD</span>
                <span className="font-mono">{usd(c.ventaTotal)}</span>
              </div>
              <div className="flex justify-between py-1 text-[12px] text-kraft">
                <span>Equivalente en Bs</span>
                <span className="font-mono">{fmtNum(c.precioBs * c.cantidad, 2)} Bs</span>
              </div>
              <div className="flex justify-between py-1 text-[12px] text-kraft">
                <span>Tasa BCV</span>
                <span className="font-mono">{fmtNum(c.tasaBCV, 2)}</span>
              </div>
            </div>
          </div>

          <p className="mt-6 border-t border-regla pt-3 text-[11px] leading-relaxed text-kraft">
            Precios en dólares; el equivalente en bolívares se calcula a la tasa BCV del día de la cotización.
            Válida por 15 días. Sujeta a disponibilidad de material.
          </p>
        </div>
      </article>
    </>
  );
}
