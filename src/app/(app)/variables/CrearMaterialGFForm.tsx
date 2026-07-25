"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearMaterialGFAction, type EstadoVar } from "@/app/actions/variables";

const INICIAL: EstadoVar = { error: null };
const inCls = "rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian";

export function CrearMaterialGFForm() {
  const [estado, action, pend] = useActionState(crearMaterialGFAction, INICIAL);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.ok) form.current?.reset(); }, [estado.ok]);

  return (
    <form ref={form} action={action} className="flex flex-wrap items-end gap-2 border-t border-regla p-4">
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Material</span>
        <input name="nombre" required className={`mt-1 block w-56 ${inCls}`} placeholder="Ej. Banner 13 oz" />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Categoría</span>
        <input name="categoria" defaultValue="Banner" className={`mt-1 block w-28 ${inCls}`} />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Costo $/m²</span>
        <input name="costoM2" type="text" inputMode="decimal" defaultValue="0" className={`mt-1 block w-24 font-mono ${inCls}`} />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Cobro</span>
        <select name="modoCobro" defaultValue="mancha" className={`mt-1 block ${inCls}`}>
          <option value="mancha">Por mancha</option>
          <option value="ancho_rollo">Ancho de rollo</option>
        </select>
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Anchos rollo (cm)</span>
        <input name="anchosRollo" className={`mt-1 block w-32 font-mono ${inCls}`} placeholder="105,137,152" />
      </label>
      <button type="submit" disabled={pend} className="rounded-sm bg-tinta px-3 py-1.5 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-50">
        Agregar material
      </button>
      {estado.error && <span className="text-sm text-[#8A1C1C]">{estado.error}</span>}
    </form>
  );
}
