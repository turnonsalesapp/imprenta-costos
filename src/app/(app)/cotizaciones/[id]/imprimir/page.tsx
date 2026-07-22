import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRol } from "@/lib/auth";
import { obtenerCotizacion } from "@/lib/cotizaciones";
import { obtenerMembrete, obtenerConfig } from "@/lib/variables";
import { obtenerClienteContacto } from "@/lib/clientes";
import { fmtNum, usd } from "@/lib/calculo";
import { BotonImprimir } from "@/app/(app)/taller/[id]/BotonImprimir";

export const dynamic = "force-dynamic";

/**
 * Cotización imprimible con membrete, para enviar al cliente. Muestra precios
 * (es la cara al cliente), con Subtotal / IVA / Total. Se guarda como PDF desde
 * el diálogo del navegador.
 */
export default async function ImprimirCotizacion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol("ADMIN", "VENDEDOR");
  const { id } = await params;
  const [c, m, dc] = await Promise.all([
    obtenerCotizacion(id), obtenerMembrete(), obtenerConfig(),
  ]);
  if (!c) notFound();

  const cliente = c.clienteId ? await obtenerClienteContacto(c.clienteId) : null;
  const empresa = m.empresaNombre ?? "Imprenta";

  const subtotal = c.ventaTotal;
  const ivaMonto = subtotal * (dc.iva / 100);
  const total = subtotal + ivaMonto;
  const totalBs = total * c.tasaBCV;

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
                <div>
                  {m.empresaTelefono && <span>Tel: {m.empresaTelefono} </span>}
                  {m.empresaEmail && <span>· {m.empresaEmail}</span>}
                </div>
                {m.empresaWeb && <div>{m.empresaWeb}</div>}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">Cotización</div>
              <div className="font-mono text-xl font-bold">N° {c.numero}</div>
              <div className="font-mono text-[12px] text-kraft">{c.creadaEn.toLocaleDateString("es-VE")}</div>
            </div>
          </div>

          {/* Cliente */}
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">Cliente</div>
            <div className="text-sm font-medium">{cliente?.nombre ?? c.clienteNombre ?? "—"}</div>
            {cliente && (
              <div className="text-[12px] leading-relaxed text-kraft">
                {cliente.rif && <div>RIF: {cliente.rif}</div>}
                <div>
                  {cliente.telefono && <span>Tel: {cliente.telefono} </span>}
                  {cliente.email && <span>· {cliente.email}</span>}
                </div>
                {cliente.direccion && <div>{cliente.direccion}</div>}
              </div>
            )}
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
                    {c.tipo === "PROVEEDOR"
                      ? (c.proveedorNombre ? `Proveedor: ${c.proveedorNombre}` : "Trabajo tercerizado")
                      : `${fmtNum(c.ancho, 0)}×${fmtNum(c.alto, 0)} mm · ${c.papelNombre} · ${c.tamano}`}
                  </div>
                </td>
                <td className="py-3 text-right font-mono">{fmtNum(c.cantidad, 0)}</td>
                <td className="py-3 text-right font-mono">{usd(c.precioUnit, 4)}</td>
                <td className="py-3 text-right font-mono">{usd(subtotal)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totales con IVA */}
          <div className="mt-4 flex justify-end">
            <div className="w-72">
              <div className="flex justify-between py-1 text-sm">
                <span className="text-kraft">Subtotal</span>
                <span className="font-mono">{usd(subtotal)}</span>
              </div>
              {dc.iva > 0 && (
                <div className="flex justify-between py-1 text-sm">
                  <span className="text-kraft">IVA ({fmtNum(dc.iva, 0)}%)</span>
                  <span className="font-mono">{usd(ivaMonto)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-regla py-2 text-base font-bold">
                <span>Total</span>
                <span className="font-mono">{usd(total)}</span>
              </div>
              <div className="flex justify-between py-1 text-[12px] text-kraft">
                <span>Equivalente en Bs (BCV {fmtNum(c.tasaBCV, 2)})</span>
                <span className="font-mono">{fmtNum(totalBs, 2)} Bs</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-regla pt-3 text-[11px] leading-relaxed text-kraft">
            <p><b>Forma de pago:</b> Bs a la tasa BCV del día del pago.</p>
            <p className="mt-1">
              Precios en dólares; el equivalente en bolívares se calcula a la tasa BCV.
              Cotización válida por 15 días, sujeta a disponibilidad de material.
            </p>
            <p className="mt-2">Gracias por su preferencia. Esperamos seguir haciendo negocios con usted.</p>
          </div>
        </div>
      </article>
    </>
  );
}
