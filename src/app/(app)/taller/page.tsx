import Link from "next/link";
import { requireUsuario } from "@/lib/auth";
import { tablero, type OrdenProd } from "@/lib/ordenes";
import { fmtNum } from "@/lib/calculo";
import { EtapaToggle } from "./EtapaToggle";
import { OrdenBadge } from "./OrdenBadge";
import { PageHeader, EmptyState } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

/**
 * Tablero del taller. Accesible a todos los roles (es la pantalla del TALLER).
 * Sin un solo precio: `tablero()` no selecciona ninguna columna de dinero.
 */
export default async function TallerPage() {
  await requireUsuario();
  const ordenes = await tablero();

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const atrasada = (o: OrdenProd) =>
    o.fechaEntrega != null && o.fechaEntrega < hoy && o.estado !== "TERMINADA";

  return (
    <>
      <PageHeader
        title="Taller"
        eyebrow={`${ordenes.length} ${ordenes.length === 1 ? "trabajo activo" : "trabajos activos"}`}
      />

      {ordenes.length === 0 ? (
        <EmptyState title="No hay trabajos en producción">
          Los trabajos aparecen aquí al generarse desde una Orden de Venta (cotización aprobada).
        </EmptyState>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {ordenes.map((o) => {
            const listas = o.etapas.filter((e) => e.estado === "LISTA" || e.estado === "OMITIDA").length;
            const tarde = atrasada(o);
            return (
              <section
                key={o.id}
                className={`rounded-sm border bg-hoja ${tarde ? "border-[#C0563B]" : "border-regla"}`}
              >
                <div className={`flex items-start justify-between gap-3 border-b px-4 py-2.5 ${tarde ? "border-[#C0563B]/40 bg-[#FCEEEA]" : "border-regla bg-suave"}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-kraft">N° {o.numero}</span>
                      <OrdenBadge estado={o.estado} />
                    </div>
                    <Link href={`/taller/${o.id}`} className="mt-0.5 block truncate font-bold hover:text-cian">
                      {o.titulo}
                    </Link>
                    {o.cliente ? <div className="truncate text-[12px] text-kraft">{o.cliente}</div> : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`text-[11px] font-bold uppercase tracking-wide ${tarde ? "text-[#C0563B]" : "text-kraft"}`}>
                      {o.fechaEntrega ? o.fechaEntrega.toLocaleDateString("es-VE") : "Sin fecha"}
                    </div>
                    {tarde ? <div className="text-[10px] font-bold uppercase text-[#C0563B]">Atrasada</div> : null}
                    <div className="mt-1 font-mono text-[12px] text-kraft">{listas}/{o.etapas.length} etapas</div>
                  </div>
                </div>

                <div className="px-4 py-2 text-[12px] text-kraft">
                  {o.items.length > 1
                    ? `${fmtNum(o.cantidad, 0)} pzs · ${o.items.length} ítems`
                    : `${fmtNum(o.cantidad, 0)} pzs · ${o.papelNombre} · ${fmtNum(o.ancho, 0)}×${fmtNum(o.alto, 0)} mm`}
                </div>

                <div className="space-y-2 px-4 pb-4">
                  {o.etapas.map((e) => (
                    <EtapaToggle key={e.id} etapa={e} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
