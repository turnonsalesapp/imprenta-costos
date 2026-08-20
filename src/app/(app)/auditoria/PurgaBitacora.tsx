"use client";

import { useActionState, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { purgarAuditoriaAction, type EstadoPurga } from "@/app/actions/auditoria";

/**
 * Purga de la bitácora por rango de fechas. Solo se monta para SUPERADMIN (la
 * página lo decide). Pide confirmación explícita antes de enviar: borrar la
 * bitácora es irreversible, aunque la propia purga deja su rastro.
 */
const INICIAL: EstadoPurga = { error: null, borrados: null };

export function PurgaBitacora() {
  const [estado, action, pendiente] = useActionState(purgarAuditoriaAction, INICIAL);
  const form = useRef<HTMLFormElement>(null);

  return (
    <details className="mt-8 rounded-sm border border-[#E0C089] bg-[#FCF6E8]">
      <summary className="cursor-pointer list-none px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#8A5A00]">
        Purgar bitácora por rango de fechas · solo superadmin
      </summary>

      <form
        ref={form}
        action={action}
        onSubmit={(e) => {
          if (!window.confirm("Vas a borrar los registros del rango indicado. Esta acción es irreversible (queda solo el rastro de la purga). ¿Continuar?")) {
            e.preventDefault();
          }
        }}
        className="border-t border-[#E0C089]/60 px-4 py-4"
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-[11px] text-kraft">Desde</span>
            <RangoInput name="desde" />
          </label>
          <label className="block">
            <span className="text-[11px] text-kraft">Hasta</span>
            <RangoInput name="hasta" />
          </label>
          <button
            type="submit"
            disabled={pendiente}
            className="rounded-sm bg-[#8A1C1C] px-4 py-2 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-50"
          >
            {pendiente ? "Purgando…" : "Purgar rango"}
          </button>
        </div>

        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-[#8A5A00]">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          Se borran los registros cuya fecha caiga en el rango (días completos, ambos incluidos).
          La purga misma queda registrada como «Purga de bitácora».
        </p>

        {estado.error && (
          <p className="mt-3 rounded-sm border border-[#E8B4B4] bg-[#FDEDED] px-3 py-2 text-sm text-[#8A1C1C]">
            {estado.error}
          </p>
        )}
        {estado.borrados != null && (
          <p className="mt-3 rounded-sm border border-[#B4E0C6] bg-[#EDF9F1] px-3 py-2 text-sm text-exito">
            Se purgaron {estado.borrados} registro(s). La operación quedó en la bitácora.
          </p>
        )}
      </form>
    </details>
  );
}

function RangoInput({ name }: { name: string }) {
  // Estado propio para que `required` funcione y el navegador muestre el picker.
  const [v, setV] = useState("");
  return (
    <input
      name={name}
      type="date"
      required
      value={v}
      onChange={(e) => setV(e.target.value)}
      className="mt-1 block rounded-sm border border-regla bg-white px-3 py-2 text-sm outline-none focus:border-cian"
    />
  );
}
