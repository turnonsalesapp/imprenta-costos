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
