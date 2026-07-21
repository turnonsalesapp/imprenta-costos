"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearAcabadoAction, type EstadoVar } from "@/app/actions/variables";

const INICIAL: EstadoVar = { error: null };
const inCls = "rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian";

export function CrearAcabadoForm() {
  const [estado, action, pend] = useActionState(crearAcabadoAction, INICIAL);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.ok) form.current?.reset(); }, [estado.ok]);

  return (
    <form ref={form} action={action} className="flex flex-wrap items-end gap-2 border-t border-regla p-4">
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Nombre</span>
        <input name="label" required className={`mt-1 block w-48 ${inCls}`} placeholder="Nuevo acabado" />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Costo USD</span>
        <input name="costo" type="text" inputMode="decimal" defaultValue="0" className={`mt-1 block w-24 font-mono ${inCls}`} />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Se cobra</span>
        <select name="unidad" defaultValue="pliego" className={`mt-1 block ${inCls}`}>
          <option value="pliego">Por corte</option>
          <option value="elemento">Por pieza</option>
          <option value="millar">Por millar</option>
          <option value="trabajo">Por trabajo</option>
        </select>
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Al cambiar tamaño</span>
        <select name="escala" defaultValue="area" className={`mt-1 block ${inCls}`}>
          <option value="area">Sube y baja con el área</option>
          <option value="min">Sube, nunca baja</option>
          <option value="fija">Siempre igual</option>
        </select>
      </label>
      <button type="submit" disabled={pend} className="rounded-sm bg-tinta px-3 py-1.5 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-50">
        Agregar acabado
      </button>
      {estado.error && <span className="text-sm text-[#8A1C1C]">{estado.error}</span>}
    </form>
  );
}
