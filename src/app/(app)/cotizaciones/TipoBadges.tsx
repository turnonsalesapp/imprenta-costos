import type { TipoCotizacion } from "@prisma/client";

/** Estilo por tipo de ítem. La cotización se etiqueta con los tipos que contiene. */
const ESTILO: Record<string, { label: string; bg: string; color: string }> = {
  PROPIA: { label: "Digital", bg: "#E6F4F8", color: "#0B7A93" },
  OFFSET: { label: "Offset", bg: "#E9F0FF", color: "#2C4A8A" },
  PROVEEDOR: { label: "Proveedor", bg: "#EDE6F7", color: "#5B3E8F" },
  GRAN_FORMATO: { label: "Gran formato", bg: "#FDECED", color: "#B23A48" },
  PERSONALIZADO: { label: "Personalizado", bg: "#FFF4E0", color: "#9A6A00" },
  MIXTA: { label: "Mixta", bg: "#EEF7EE", color: "#3B6B3B" },
};

export function TipoBadges({ tipos }: { tipos: TipoCotizacion[] }) {
  return (
    <>
      {tipos.map((t) => {
        const e = ESTILO[t] ?? { label: t, bg: "#EEE", color: "#333" };
        return (
          <span
            key={t}
            className="ml-1.5 rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ background: e.bg, color: e.color }}
          >
            {e.label}
          </span>
        );
      })}
    </>
  );
}
