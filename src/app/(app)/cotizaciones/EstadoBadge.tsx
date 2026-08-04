import type { EstadoCotizacion } from "@prisma/client";
import { ETIQUETA_ESTADO } from "@/lib/cotizaciones";

const CLASES: Record<EstadoCotizacion, string> = {
  BORRADOR: "bg-suave text-kraft",
  PENDIENTE: "bg-[#FFF9E6] text-[#5C4A00]",
  APROBADA: "bg-[#EDE9FB] text-[#5B3E8F]", // aprobación interna
  ENVIADA: "bg-[#E6F4F8] text-cian",       // enviada al cliente
  GANADA: "bg-[#EDF9F1] text-exito",        // ganada
  RECHAZADA: "bg-[#FDEDED] text-[#8A1C1C]", // perdida
  VENCIDA: "bg-[#FBEBD9] text-[#8A4B00]",
};

export function EstadoBadge({ estado }: { estado: EstadoCotizacion }) {
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${CLASES[estado]}`}>
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}
