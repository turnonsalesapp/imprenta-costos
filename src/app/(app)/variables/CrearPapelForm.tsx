"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearPapelAction, type EstadoVar } from "@/app/actions/variables";

const INICIAL: EstadoVar = { error: null };
const inCls = "rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian";

export function CrearPapelForm({ medidas }: { medidas: string[] }) {
  const [estado, action, pend] = useActionState(crearPapelAction, INICIAL);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.ok) form.current?.reset(); }, [estado.ok]);

  return (
    <form ref={form} action={action} className="flex flex-wrap items-end gap-2 border-t border-regla p-4">
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Nombre</span>
        <input name="nombre" required className={`mt-1 block w-56 ${inCls}`} placeholder="Nuevo papel" />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Medida</span>
        <select name="medida" className={`mt-1 block ${inCls}`} defaultValue="70x100">
          {medidas.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Hojas</span>
        <input name="hojas" type="text" inputMode="numeric" defaultValue="500" className={`mt-1 block w-20 font-mono ${inCls}`} />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Precio resma</span>
        <input name="precio" type="text" inputMode="decimal" defaultValue="0" className={`mt-1 block w-24 font-mono ${inCls}`} />
      </label>
      <button type="submit" disabled={pend} className="rounded-sm bg-tinta px-3 py-1.5 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-50">
        Agregar papel
      </button>
      {estado.error && <span className="text-sm text-[#8A1C1C]">{estado.error}</span>}
    </form>
  );
}
