"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { marcarActividadAction } from "@/app/actions/crm";

/**
 * Botón "Hecha" de una actividad. Marca la actividad como completada; al
 * revalidar, `proximasActividades()` deja de devolverla y la tarjeta desaparece
 * de la lista de pendientes.
 */
export function ActividadHecha({ id }: { id: string }) {
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex shrink-0 flex-col items-end">
      <button
        type="button"
        disabled={pendiente}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await marcarActividadAction(id, true);
            if (res?.error) setError(res.error);
          });
        }}
        className="inline-flex items-center gap-1 rounded-sm border border-regla px-2.5 py-1 text-xs font-medium text-kraft hover:border-tinta hover:text-tinta disabled:opacity-40"
      >
        <Check size={14} /> Hecha
      </button>
      {error && <span className="mt-1 text-[11px] text-[#8A1C1C]">{error}</span>}
    </div>
  );
}
