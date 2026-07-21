"use client";

import { useActionState } from "react";
import { guardarConfigAction, type EstadoVar } from "@/app/actions/variables";
import type { DatosConfig } from "@/lib/variables";

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
