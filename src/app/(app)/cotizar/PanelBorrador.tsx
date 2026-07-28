"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { fmtNum, usd } from "@/lib/calculo";
import { useDraft, quitarItemDraft, vaciarDraft } from "@/lib/draft-cotizacion";

/**
 * Panel compartido "En esta cotización": muestra los ítems que se han ido
 * agregando al borrador mixto (de cualquier módulo) para que en todas las
 * calculadoras se vea que se pueden acumular varios ítems y se puedan quitar
 * o ir a revisar/guardar. La acción de AGREGAR vive en cada calculadora
 * ("Agregar a la cotización"); acá solo se listan y administran.
 */
export function PanelBorrador() {
  const draft = useDraft();
  const items = draft.items;
  const total = items.reduce((s, it) => s + (it.resumen?.ventaTotal ?? 0), 0);

  return (
    <section className="card" style={{ marginTop: 14 }}>
      <div className="ch">
        <b>En esta cotización</b>
        <span className="mt">{items.length} ítem{items.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="cb">
        {items.length === 0 ? (
          <div className="hint">
            Aún no agregaste ítems. Con «Agregar a la cotización» podés sumar varios
            trabajos —de este u otros módulos— y guardarlos juntos.
          </div>
        ) : (
          <>
            <div className="tw">
              <table>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="rw">
                      <td style={{ maxWidth: 0 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {it.resumen?.titulo || "Ítem"}
                        </div>
                        <span className="mono" style={{ fontSize: 10, color: "#767D76" }}>
                          {it.resumen?.tipoLabel} · {fmtNum(it.resumen?.cantidad ?? 0, 0)} u
                        </span>
                      </td>
                      <td className="ta-r mono" style={{ whiteSpace: "nowrap" }}>{usd(it.resumen?.ventaTotal ?? 0)}</td>
                      <td className="ta-r" style={{ width: 1 }}>
                        <button type="button" className="x" aria-label="Quitar ítem" title="Quitar"
                          onClick={() => quitarItemDraft(it.id)}>
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="tot" style={{ marginTop: 8 }}>
              <span>Venta total</span><span className="a mono">{usd(total)}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <Link href="/cotizacion-nueva" className="btn sm">Revisar / guardar</Link>
              <button type="button" className="btn g sm" onClick={() => vaciarDraft()}>Vaciar</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
