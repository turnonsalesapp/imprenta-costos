"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { crearProductoPopAction, type EstadoVar } from "@/app/actions/variables";

const INICIAL: EstadoVar = { error: null };
const inCls = "rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian";

export function CrearProductoPopForm() {
  const [estado, action, pend] = useActionState(crearProductoPopAction, INICIAL);
  const [modo, setModo] = useState("escalas");
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.ok) { form.current?.reset(); setModo("escalas"); } }, [estado.ok]);

  return (
    <form ref={form} action={action} className="flex flex-wrap items-end gap-2 border-t border-regla p-4">
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Producto</span>
        <input name="nombre" required className={`mt-1 block w-52 ${inCls}`} placeholder="Ej. Chapa prendedor" />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Categoría</span>
        <input name="categoria" defaultValue="Chapa" className={`mt-1 block w-28 ${inCls}`} placeholder="Chapa, Llavero…" />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Cobro</span>
        <select name="modo" value={modo} onChange={(e) => setModo(e.target.value)} className={`mt-1 block ${inCls}`}>
          <option value="escalas">Por cantidad</option>
          <option value="lineal">Metro lineal</option>
        </select>
      </label>
      {modo === "escalas" ? (
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Escalas (desde:precio)</span>
          <input name="escalas" className={`mt-1 block w-64 font-mono ${inCls}`} placeholder="1:3.5,12:2.2,50:2.1,100:1.5" />
        </label>
      ) : (
        <>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">$/metro</span>
            <input name="precioLineal" type="text" inputMode="decimal" defaultValue="0" className={`mt-1 block w-20 font-mono ${inCls}`} />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Ancho (cm)</span>
            <input name="anchoCm" type="text" inputMode="numeric" defaultValue="0" className={`mt-1 block w-20 font-mono ${inCls}`} />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Mín. (cm)</span>
            <input name="minCm" type="text" inputMode="numeric" defaultValue="0" className={`mt-1 block w-20 font-mono ${inCls}`} />
          </label>
        </>
      )}
      <button type="submit" disabled={pend} className="rounded-sm bg-tinta px-3 py-1.5 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-50">
        Agregar producto
      </button>
      {estado.error && <span className="text-sm text-[#8A1C1C]">{estado.error}</span>}
    </form>
  );
}
