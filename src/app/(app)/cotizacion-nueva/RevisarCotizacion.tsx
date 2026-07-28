"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Save, Trash2, X } from "lucide-react";
import { fmtNum, usd } from "@/lib/calculo";
import { useDraft, quitarItemDraft, actualizarMetaDraft, vaciarDraft } from "@/lib/draft-cotizacion";
import { guardarMixtaAction } from "@/app/actions/cotizaciones";

const TIPO_COLOR: Record<string, string> = {
  Proveedor: "#5B3E8F", "Gran formato": "#B23A48", Personalizado: "#9A6A00",
  Offset: "#2C4A8A", Digital: "#0B7A93",
};

export function RevisarCotizacion() {
  const draft = useDraft();
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const total = draft.items.reduce((s, i) => s + (i.resumen.ventaTotal || 0), 0);

  function guardar() {
    setError(null);
    if (!draft.items.length) { setError("Agrega al menos un ítem."); return; }
    if (!draft.meta.cliente.trim() && !draft.meta.trabajo.trim()) { setError("Indica el cliente o el título de la cotización."); return; }
    startTransition(async () => {
      const res = await guardarMixtaAction({
        meta: draft.meta,
        items: draft.items.map((i) => ({ tipo: i.tipo, form: i.form })),
      });
      if (res?.error) setError(res.error);
      else vaciarDraft(); // se redirige al detalle; limpiamos el borrador local
    });
  }

  if (!draft.items.length) {
    return (
      <div className="rounded-sm border border-regla bg-hoja px-4 py-12 text-center">
        <b className="block text-sm">El borrador está vacío</b>
        <p className="mt-1 text-sm text-kraft">
          Desde cualquier calculadora usa <b>“Agregar a la cotización”</b> para sumar ítems (de cualquier tipo) aquí.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm">
          <Link href="/cotizar" className="lnk">Digital</Link>
          <Link href="/cotizar-offset" className="lnk">Offset</Link>
          <Link href="/cotizar-proveedor" className="lnk">Proveedor</Link>
          <Link href="/cotizar-granformato" className="lnk">Gran formato</Link>
          <Link href="/cotizar-personalizado" className="lnk">Personalizados</Link>
        </div>
      </div>
    );
  }

  const editando = !!draft.meta.editarId;

  return (
    <div className="max-w-2xl">
      {editando ? (
        <div className="mb-3 rounded-sm border border-[#9AD3E0] bg-[#E6F4F8] px-3 py-2 text-sm text-[#0B5C6E]">
          Editando una cotización guardada · al guardar se actualiza esa misma cotización.
        </div>
      ) : null}
      {/* Meta de la cotización */}
      <div className="rounded-sm border border-regla bg-hoja p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Cliente</span>
            <input
              value={draft.meta.cliente}
              onChange={(e) => actualizarMetaDraft({ cliente: e.target.value, clienteId: "" })}
              placeholder="Nombre del cliente"
              className="mt-1 block w-full rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Título de la cotización</span>
            <input
              value={draft.meta.trabajo}
              onChange={(e) => actualizarMetaDraft({ trabajo: e.target.value })}
              placeholder="Ej. Paquete de campaña"
              className="mt-1 block w-full rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian"
            />
          </label>
        </div>
      </div>

      {/* Ítems */}
      <div className="mt-4 overflow-hidden rounded-sm border border-regla bg-hoja">
        <div className="flex items-center justify-between border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
          <span>{draft.items.length} ítem{draft.items.length !== 1 ? "s" : ""}</span>
          <button type="button" onClick={() => vaciarDraft()} className="flex items-center gap-1 text-kraft hover:text-[#B23A48]">
            <Trash2 size={12} /> Vaciar
          </button>
        </div>
        <ul className="divide-y divide-suave">
          {draft.items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 px-4 py-2.5">
              <span
                className="rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                style={{ background: TIPO_COLOR[it.resumen.tipoLabel] ?? "#767D76" }}
              >
                {it.resumen.tipoLabel}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{it.resumen.titulo}</span>
              <span className="font-mono text-[13px] text-kraft">{fmtNum(it.resumen.cantidad, 0)} u</span>
              <span className="w-24 text-right font-mono text-sm font-bold">{usd(it.resumen.ventaTotal)}</span>
              <button type="button" onClick={() => quitarItemDraft(it.id)} aria-label="Quitar ítem"
                className="rounded-sm p-1 text-kraft hover:bg-suave hover:text-[#B23A48]">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-regla px-4 py-3">
          <span className="text-sm font-bold">Venta total</span>
          <span className="font-mono text-base font-bold">{usd(total)}</span>
        </div>
      </div>

      {error ? <div className="mt-3 rounded-sm border border-[#E4B3B3] bg-[#FDECED] px-3 py-2 text-sm text-[#8A1C1C]">{error}</div> : null}

      <button
        type="button"
        onClick={guardar}
        disabled={pendiente}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-tinta px-3 py-2.5 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-50"
      >
        <Save size={15} /> {pendiente ? "Guardando…" : editando ? "Guardar cambios" : "Guardar cotización"}
      </button>
    </div>
  );
}
