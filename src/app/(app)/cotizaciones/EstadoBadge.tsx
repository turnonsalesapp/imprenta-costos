import type { EstadoCotizacion } from "@prisma/client";
import { ETIQUETA_ESTADO } from "@/lib/cotizaciones";

const CLASES: Record<EstadoCotizacion, string> = {
  BORRADOR: "bg-suave text-kraft",
  PENDIENTE: "bg-[#F1ECF8] text-[#5B3E8F]",
  ENVIADA: "bg-[#E6F4F8] text-cian",
  APROBADA: "bg-[#EDF9F1] text-exito",
  RECHAZADA: "bg-[#FDEDED] text-[#8A1C1C]",
  VENCIDA: "bg-[#FFF9E6] text-[#5C4A00]",
};

export function EstadoBadge({ estado }: { estado: EstadoCotizacion }) {
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${CLASES[estado]}`}>
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}
