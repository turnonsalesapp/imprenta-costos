"use client";

import { useActionState, useEffect, useRef } from "react";
import { entradaAction, type EstadoInv } from "@/app/actions/inventario";

const INICIAL: EstadoInv = { error: null };
const inCls = "rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian";

export function EntradaForm({ papeles }: { papeles: { id: string; nombre: string }[] }) {
  const [estado, action, pend] = useActionState(entradaAction, INICIAL);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.ok) form.current?.reset(); }, [estado.ok]);

  return (
    <form ref={form} action={action} className="flex flex-wrap items-end gap-2 rounded-sm border border-regla bg-hoja p-4">
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Papel</span>
        <select name="papelId" required className={`mt-1 block w-64 ${inCls}`} defaultValue="">
          <option value="" disabled>— Elige el papel —</option>
          {papeles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Pliegos que entran</span>
        <input name="pliegos" type="text" inputMode="decimal" required className={`mt-1 block w-28 font-mono ${inCls}`} placeholder="0" />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Motivo / factura</span>
        <input name="motivo" className={`mt-1 block w-48 ${inCls}`} placeholder="Compra, factura N°…" />
      </label>
      <button type="submit" disabled={pend}
        className="rounded-sm bg-tinta px-3 py-1.5 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-50">
        {pend ? "Registrando…" : "Registrar entrada"}
      </button>
      {estado.error && <span className="text-sm text-[#8A1C1C]">{estado.error}</span>}
      {estado.ok && <span className="text-sm text-exito">Entrada registrada.</span>}
    </form>
  );
}
