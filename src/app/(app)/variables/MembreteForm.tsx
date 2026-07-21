"use client";

import { useActionState } from "react";
import { guardarMembreteAction, type EstadoVar } from "@/app/actions/variables";
import type { DatosMembrete } from "@/lib/variables";

const INICIAL: EstadoVar = { error: null };
const inCls = "mt-1 w-full rounded-sm border border-regla bg-white px-3 py-1.5 text-sm outline-none focus:border-cian";

export function MembreteForm({ m }: { m: DatosMembrete }) {
  const [estado, action, pend] = useActionState(guardarMembreteAction, INICIAL);
  return (
    <form action={action} className="rounded-sm border border-regla bg-hoja p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] text-kraft">Nombre de la empresa</span>
          <input name="empresaNombre" defaultValue={m.empresaNombre ?? ""} className={inCls} placeholder="Mi Imprenta, C.A." />
        </label>
        <label className="block">
          <span className="text-[11px] text-kraft">RIF</span>
          <input name="empresaRif" defaultValue={m.empresaRif ?? ""} className={inCls} placeholder="J-12345678-9" />
        </label>
        <label className="block">
          <span className="text-[11px] text-kraft">Teléfono</span>
          <input name="empresaTelefono" defaultValue={m.empresaTelefono ?? ""} className={inCls} />
        </label>
        <label className="block">
          <span className="text-[11px] text-kraft">Dirección</span>
          <input name="empresaDireccion" defaultValue={m.empresaDireccion ?? ""} className={inCls} />
        </label>
      </div>
      {estado.ok && (
        <p className="mt-3 rounded-sm border border-[#B4E0C6] bg-[#EDF9F1] px-3 py-2 text-sm text-exito">Membrete guardado.</p>
      )}
      <button type="submit" disabled={pend}
        className="mt-3 rounded-sm bg-tinta px-4 py-2 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-50">
        {pend ? "Guardando…" : "Guardar membrete"}
      </button>
      <p className="mt-2 text-[11px] text-kraft">Aparece en la cotización imprimible que se envía al cliente.</p>
    </form>
  );
}
