"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearEquipoAction, type EstadoVar } from "@/app/actions/variables";

const INICIAL: EstadoVar = { error: null };
const inCls = "rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian";

export function CrearEquipoForm() {
  const [estado, action, pend] = useActionState(crearEquipoAction, INICIAL);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.ok) form.current?.reset(); }, [estado.ok]);

  return (
    <form ref={form} action={action} className="flex flex-wrap items-end gap-2 border-t border-regla p-4">
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Equipo / prensa</span>
        <input name="nombre" required className={`mt-1 block w-56 ${inCls}`} placeholder="Ej. Prensa 4 colores" />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Colores/pasada</span>
        <input name="coloresPasada" type="text" inputMode="numeric" defaultValue="4" className={`mt-1 block w-24 font-mono ${inCls}`} />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Millar/pasada ($)</span>
        <input name="costoMillar" type="text" inputMode="decimal" defaultValue="6" className={`mt-1 block w-24 font-mono ${inCls}`} />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Arranque/cara ($)</span>
        <input name="costoArranque" type="text" inputMode="decimal" defaultValue="15" className={`mt-1 block w-24 font-mono ${inCls}`} />
      </label>
      <button type="submit" disabled={pend} className="rounded-sm bg-tinta px-3 py-1.5 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-50">
        Agregar equipo
      </button>
      {estado.error && <span className="text-sm text-[#8A1C1C]">{estado.error}</span>}
    </form>
  );
}
