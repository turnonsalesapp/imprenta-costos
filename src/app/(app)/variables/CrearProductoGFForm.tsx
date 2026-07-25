"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearProductoGFAction, type EstadoVar } from "@/app/actions/variables";

const INICIAL: EstadoVar = { error: null };
const inCls = "rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian";

export function CrearProductoGFForm() {
  const [estado, action, pend] = useActionState(crearProductoGFAction, INICIAL);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.ok) form.current?.reset(); }, [estado.ok]);

  return (
    <form ref={form} action={action} className="flex flex-wrap items-end gap-2 border-t border-regla p-4">
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Producto</span>
        <input name="nombre" required className={`mt-1 block w-56 ${inCls}`} placeholder="Ej. Pendón 60×90" />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Categoría</span>
        <select name="categoria" defaultValue="Pendón" className={`mt-1 block ${inCls}`}>
          <option value="Pendón">Pendón</option>
          <option value="Roll Up">Roll Up</option>
          <option value="Araña">Araña</option>
          <option value="Estructura">Estructura</option>
        </select>
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Medida</span>
        <input name="medida" className={`mt-1 block w-28 ${inCls}`} placeholder="60×90 cm" />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Costo $/u</span>
        <input name="costoUnit" type="text" inputMode="decimal" defaultValue="0" className={`mt-1 block w-24 font-mono ${inCls}`} />
      </label>
      <button type="submit" disabled={pend} className="rounded-sm bg-tinta px-3 py-1.5 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-50">
        Agregar producto
      </button>
      {estado.error && <span className="text-sm text-[#8A1C1C]">{estado.error}</span>}
    </form>
  );
}
