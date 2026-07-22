"use client";

import { useActionState } from "react";
import { guardarConfigAction, type EstadoVar } from "@/app/actions/variables";
import type { DatosConfig } from "@/lib/variables";
import { MODELOS_IA, MODELO_IA_DEFAULT } from "@/lib/modelos-ia";

const INICIAL: EstadoVar = { error: null };
const inCls = "mt-1 w-full rounded-sm border border-regla bg-white px-3 py-1.5 text-sm font-mono outline-none focus:border-cian";

export function ConfigForm({ cfg }: { cfg: DatosConfig }) {
  const [estado, action, pendiente] = useActionState(guardarConfigAction, INICIAL);

  return (
    <form action={action} className="rounded-sm border border-regla bg-hoja p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Campo l="Merma papel (%)" name="merma" v={cfg.merma} />
        <Campo l="Margen (%)" name="margen" v={cfg.margen} />
        <Campo l="Comisión vend. (%)" name="comision" v={cfg.comision} />
        <Campo l="MercadoLibre (%)" name="ml" v={cfg.ml} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Campo l="Tasa BCV" name="tasaBCV" v={cfg.tasaBCV} />
        <Campo l="Binance compra" name="binCompra" v={cfg.binCompra} />
        <Campo l="Binance venta" name="binVenta" v={cfg.binVenta} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-4">
        <Campo l="Pinza (mm)" name="pinza" v={cfg.pinza} />
        <Campo l="Separación (mm)" name="sep" v={cfg.sep} />
        <Campo l="Margen mínimo (%)" name="margenMin" v={cfg.margenMin} />
        <Campo l="IVA (%)" name="iva" v={cfg.iva} />
      </div>

      <label className="mt-4 flex items-start gap-2.5 rounded-sm border border-regla bg-suave px-3 py-2.5">
        <input type="checkbox" name="interpretarIA" defaultChecked={cfg.interpretarIA} className="mt-0.5 h-4 w-4 accent-tinta" />
        <span>
          <span className="text-sm font-medium">Interpretar solicitud del cliente con IA</span>
          <span className="mt-0.5 block text-[11px] leading-relaxed text-kraft">
            Activa el panel en «Cotizar» para pegar el texto del cliente y traducirlo en un borrador.
            Interruptor general; puedes ajustarlo por usuario en Usuarios. Requiere la clave
            ANTHROPIC_API_KEY configurada en el servidor. El texto pegado se procesa con IA de Anthropic.
          </span>
          <span className="mt-2.5 block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Modelo de IA</span>
            <select name="interpretarModelo" defaultValue={cfg.interpretarModelo || MODELO_IA_DEFAULT}
              className="mt-1 block rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian">
              {MODELOS_IA.map((m) => (
                <option key={m.id} value={m.id}>{m.label} — {m.nota}</option>
              ))}
            </select>
          </span>
        </span>
      </label>

      {estado.error && (
        <p className="mt-3 rounded-sm border border-[#E8B4B4] bg-[#FDEDED] px-3 py-2 text-sm text-[#8A1C1C]">{estado.error}</p>
      )}
      {estado.ok && (
        <p className="mt-3 rounded-sm border border-[#B4E0C6] bg-[#EDF9F1] px-3 py-2 text-sm text-exito">
          Guardado. Si cambiaste una tasa, quedó registrada en el histórico.
        </p>
      )}

      <button type="submit" disabled={pendiente}
        className="mt-3 rounded-sm bg-tinta px-4 py-2 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-50">
        {pendiente ? "Guardando…" : "Guardar variables"}
      </button>
      <p className="mt-2 text-[11px] text-kraft">
        Estos valores se aplican a cada cotización nueva. Las cotizaciones ya guardadas no cambian.
      </p>
    </form>
  );
}

function Campo({ l, name, v }: { l: string; name: string; v: number }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">{l}</span>
      <input name={name} type="text" inputMode="decimal" defaultValue={String(v)} className={inCls} />
    </label>
  );
}
