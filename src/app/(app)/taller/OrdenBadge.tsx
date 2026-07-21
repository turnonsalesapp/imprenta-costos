import type { EstadoOrden } from "@prisma/client";
import { ETIQUETA_ORDEN } from "@/lib/ordenes";

const CLASES: Record<EstadoOrden, string> = {
  PENDIENTE: "bg-suave text-kraft",
  EN_PROCESO: "bg-[#E6F4F8] text-cian",
  TERMINADA: "bg-[#EDF9F1] text-exito",
  ENTREGADA: "bg-tinta text-hoja",
  ANULADA: "bg-[#FDEDED] text-[#8A1C1C]",
};

export function OrdenBadge({ estado }: { estado: EstadoOrden }) {
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${CLASES[estado]}`}>
      {ETIQUETA_ORDEN[estado]}
    </span>
  );
}
