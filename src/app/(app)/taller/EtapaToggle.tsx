import { Check } from "lucide-react";
import type { Etapa } from "@/lib/ordenes";
import { marcarEtapaAction } from "@/app/actions/ordenes";

/**
 * Marca una etapa lista / pendiente. Botón de fila completa y alto generoso
 * para poder tocarlo con una mano en el teléfono. Funciona sin JavaScript.
 */
export function EtapaToggle({ etapa }: { etapa: Etapa }) {
  const lista = etapa.estado === "LISTA";
  return (
    <form action={marcarEtapaAction}>
      <input type="hidden" name="etapaId" value={etapa.id} />
      <input type="hidden" name="lista" value={lista ? "0" : "1"} />
      <button
        type="submit"
        className={`flex w-full items-center gap-3 rounded-sm border px-3 py-3 text-left transition-colors ${
          lista
            ? "border-exito/40 bg-[#EDF9F1]"
            : "border-regla bg-hoja hover:border-tinta"
        }`}
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border-2 ${
            lista ? "border-exito bg-exito text-hoja" : "border-kraft bg-white"
          }`}
        >
          {lista ? <Check size={15} strokeWidth={4} /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-medium ${lista ? "text-exito" : ""}`}>
            {etapa.nombre}
          </span>
          {lista && etapa.responsable ? (
            <span className="block text-[11px] text-kraft">
              {etapa.responsable}
              {etapa.terminadaEn ? " · " + etapa.terminadaEn.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }) : ""}
            </span>
          ) : (
            <span className="block text-[11px] text-kraft">Toca para marcar lista</span>
          )}
        </span>
      </button>
    </form>
  );
}
