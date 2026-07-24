"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { n, usd, fmtNum } from "@/lib/calculo";

/**
 * Campos y bloques compartidos por las dos calculadoras (propia y de proveedor),
 * para no duplicarlos. Presentacionales; usan las clases de calc.css.
 */

/** Etiqueta + contenido + pista opcional. */
export function F({ l, children, hint }: { l: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="fl">{l}</label>
      {children}
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

/** Campo de texto/numérico simple. */
export function T({
  l, v, set, ph, num,
}: {
  l: string; v: string | number; set: (v: string) => void; ph?: string; num?: boolean;
}) {
  return (
    <F l={l}>
      <input
        className={num ? "in mono" : "in"}
        type="text"
        inputMode={num ? "decimal" : "text"}
        value={v}
        placeholder={ph || ""}
        onChange={(e) => set(e.target.value)}
      />
    </F>
  );
}

/**
 * Tarjeta "Tasas y utilidad": tasas BCV/Binance, diferencial (auto o a mano) y
 * margen/comisión/ML. Idéntica en ambas calculadoras; `set` escribe un campo y
 * `toggleManual` alterna el diferencial manual.
 */
export function TarjetaTasas({
  tasaBCV, binCompra, binVenta, margen, comision, ml, difManual, dif,
  difAuto, binProm, difActual, set, toggleManual,
}: {
  tasaBCV: string | number; binCompra: string | number; binVenta: string | number;
  margen: string | number; comision: string | number; ml: string | number;
  difManual: boolean; dif: string | number;
  difAuto: number; binProm: number; difActual: number;
  set: (campo: "tasaBCV" | "binCompra" | "binVenta" | "margen" | "comision" | "ml" | "dif", v: string) => void;
  toggleManual: () => void;
}) {
  return (
    <section className="card">
      <div className="ch"><b>Tasas y utilidad</b><span className="mt mono">diferencial {fmtNum(difActual, 4)}</span></div>
      <div className="cb">
        <div className="rowg c3">
          <T l="Tasa BCV" v={tasaBCV} set={(v) => set("tasaBCV", v)} num />
          <T l="Binance compra" v={binCompra} set={(v) => set("binCompra", v)} num />
          <T l="Binance venta" v={binVenta} set={(v) => set("binVenta", v)} num />
        </div>
        <div className="hint mono" style={{ marginTop: 6 }}>
          Promedio {fmtNum(binProm, 2)} ÷ BCV {fmtNum(n(tasaBCV), 2)} = {fmtNum(difAuto, 4)}
          <button type="button" className="lnk" onClick={toggleManual}>
            {difManual ? "volver a automático" : "fijar manualmente"}
          </button>
        </div>
        {difManual ? (
          <div style={{ marginTop: 8, maxWidth: 170 }}>
            <T l="Diferencial fijo" v={dif} set={(v) => set("dif", v)} num />
          </div>
        ) : null}
        <div className="rowg c3" style={{ marginTop: 12 }}>
          <T l="Margen (%)" v={margen} set={(v) => set("margen", v)} num />
          <T l="Comisión vendedor (%)" v={comision} set={(v) => set("comision", v)} num />
          <T l="Recargo MercadoLibre (%)" v={ml} set={(v) => set("ml", v)} num />
        </div>
      </div>
    </section>
  );
}

/**
 * Fijar el precio de venta a mano. Muestra el precio sugerido por el motor y el
 * % de diferencia. Igual en ambas calculadoras.
 */
export function PrecioManual({
  valor, onChange, activo, onToggle, sugerido,
}: {
  valor: string | number;
  onChange: (v: string) => void;
  activo: boolean;
  onToggle: () => void;
  sugerido: number;
}) {
  return (
    <div style={{ marginTop: 10 }}>
      <div className="hint" style={{ cursor: "pointer" }} onClick={onToggle}>
        <button type="button" className={activo ? "chk on" : "chk"} aria-label="Fijar precio de venta a mano">
          {activo ? <Check size={10} strokeWidth={4} /> : null}
        </button>
        <span>Fijar precio de venta a mano</span>
      </div>
      {activo ? (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input className="in mono" style={{ maxWidth: 150 }} type="text" inputMode="decimal"
            value={valor} onChange={(e) => onChange(e.target.value)} />
          <span className="hint mono">
            sugerido {usd(sugerido, 4)}
            {sugerido > 0
              ? ` · ${n(valor) >= sugerido ? "+" : ""}${fmtNum((n(valor) / sugerido - 1) * 100, 1)}%`
              : ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}
