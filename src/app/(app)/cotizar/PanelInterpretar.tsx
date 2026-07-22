"use client";

import { useState, useTransition } from "react";
import { Sparkles, ChevronDown, ChevronRight, Check } from "lucide-react";
import { TAMANOS, type Acabado, type Papel } from "@/lib/calculo";
import type { AcabadoSel } from "@/lib/calculo";
import type { FormCotizacion } from "@/lib/cotizacion-form";
import { interpretarSolicitudAction } from "@/app/actions/interpretar";
import type { SolicitudInterpretada } from "@/lib/interpretar";

type Conf = "alta" | "media" | "baja";
const COLOR_CONF: Record<Conf, string> = { alta: "#15794F", media: "#C79400", baja: "#C0563B" };
const ETIQUETA_CONF: Record<Conf, string> = { alta: "alta", media: "media", baja: "baja" };

/**
 * Panel plegable para pegar la solicitud del cliente e interpretarla con IA.
 * No guarda nada: al "cargar" mezcla el borrador en el formulario de la
 * calculadora (vía onCargar), que sigue su flujo normal.
 */
export function PanelInterpretar({
  habilitado,
  papeles,
  acabados,
  onCargar,
}: {
  habilitado: boolean;
  papeles: Papel[];
  acabados: Acabado[];
  onCargar: (parcial: Partial<FormCotizacion>) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [res, setRes] = useState<SolicitudInterpretada | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  if (!habilitado) return null;

  const nombrePapel = (clave: string | null) =>
    papeles.find((p) => p.id === clave)?.nombre ?? null;
  const labelAcabado = (clave: string) => acabados.find((a) => a.id === clave)?.label ?? clave;
  const tieneAcabado = (clave: string) => acabados.some((a) => a.id === clave);

  function interpretar() {
    setError(null);
    setRes(null);
    startTransition(async () => {
      const r = await interpretarSolicitudAction(texto);
      if (r.ok) setRes(r.data);
      else setError(r.error);
    });
  }

  function cargar() {
    if (!res) return;
    const acs: Record<string, AcabadoSel> = {};
    for (const clave of res.acabados) acs[clave] = { on: true, q: 1 };
    if (res.imprimeTiro !== false && tieneAcabado("impTiro")) acs["impTiro"] = { on: true, q: 1 };
    if (res.imprimeRetiro === true && tieneAcabado("impRetiro")) acs["impRetiro"] = { on: true, q: 1 };

    const tamanoOk = res.tamano && TAMANOS.some((t) => t.id === res.tamano) ? res.tamano : undefined;
    const descripcion = [res.descripcion, res.notas].filter(Boolean).join(" · ") || undefined;

    const parcial: Partial<FormCotizacion> = {
      capAuto: true,
      ...(res.cliente ? { cliente: res.cliente, clienteId: "" } : {}),
      ...(res.trabajo ? { trabajo: res.trabajo } : {}),
      ...(descripcion ? { descripcion } : {}),
      ...(res.cantidad != null ? { cantidad: Math.max(0, Math.round(res.cantidad)) } : {}),
      ...(res.anchoMm != null ? { ancho: Math.round(res.anchoMm) } : {}),
      ...(res.altoMm != null ? { alto: Math.round(res.altoMm) } : {}),
      ...(tamanoOk ? { tamano: tamanoOk } : {}),
      ...(res.papelClave ? { papelId: res.papelClave } : {}),
      ...(Object.keys(acs).length ? { acabados: acs } : {}),
    };
    onCargar(parcial);
    setRes(null);
    setTexto("");
    setAbierto(false);
  }

  const c = res?.confianza;

  return (
    <section className="card" style={{ borderColor: "#C9B8E0", background: "#FBFAFE" }}>
      <div className="ch" style={{ cursor: "pointer" }} onClick={() => setAbierto((v) => !v)}>
        <b style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={14} style={{ color: "#8A5FBF" }} />
          Interpretar solicitud del cliente
        </b>
        <span className="mt" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          IA · opcional
          {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </div>

      {abierto ? (
        <div className="cb">
          <label className="fl">Pega aquí lo que escribió el cliente</label>
          <textarea
            className="in"
            style={{ minHeight: 92, resize: "vertical", fontFamily: "inherit" }}
            value={texto}
            placeholder="Ej: Necesito 3000 volantes media carta, full color por un solo lado, en glasé. Es para Jugarte."
            onChange={(e) => setTexto(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn" onClick={interpretar} disabled={pendiente || texto.trim().length < 3}>
              <Sparkles size={13} />
              {pendiente ? "Interpretando…" : "Interpretar"}
            </button>
            <span className="hint">El texto se procesa con IA de Anthropic.</span>
          </div>

          {error ? <div className="warn" style={{ marginTop: 10 }}>{error}</div> : null}

          {res ? (
            <div style={{ marginTop: 12 }}>
              <div className="tw">
                <table>
                  <tbody>
                    <Fila l="Cliente" v={res.cliente} conf={c?.cliente} />
                    <Fila l="Trabajo" v={res.trabajo} conf={c?.trabajo} />
                    <Fila l="Descripción" v={res.descripcion} />
                    <Fila l="Cantidad" v={res.cantidad != null ? String(res.cantidad) : null} conf={c?.cantidad} />
                    <Fila
                      l="Medida"
                      v={res.anchoMm != null && res.altoMm != null ? `${res.anchoMm} × ${res.altoMm} mm` : null}
                      conf={c?.medida}
                    />
                    <Fila l="Tamaño de corte" v={res.tamano} />
                    <Fila l="Papel" v={nombrePapel(res.papelClave)} conf={c?.papel} />
                    <Fila
                      l="Impresión"
                      v={[res.imprimeTiro ? "tiro" : null, res.imprimeRetiro ? "retiro" : null].filter(Boolean).join(" / ") || null}
                    />
                    <Fila
                      l="Acabados"
                      v={res.acabados.length ? res.acabados.map(labelAcabado).join(", ") : "ninguno"}
                      conf={c?.acabados}
                    />
                  </tbody>
                </table>
              </div>

              {res.dudas.length ? (
                <div style={{ marginTop: 10, borderLeft: "3px solid #C79400", background: "#FFFBEF", padding: "8px 10px", borderRadius: 2 }}>
                  <div className="fl" style={{ color: "#8A6D0B" }}>Dudas para preguntarle al cliente</div>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 12.5, color: "#5C4A0B" }}>
                    {res.dudas.map((d, i) => <li key={i} style={{ marginTop: 2 }}>{d}</li>)}
                  </ul>
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button type="button" className="btn" onClick={cargar}>
                  <Check size={13} />Cargar en la cotización
                </button>
                <button type="button" className="btn g" onClick={() => setRes(null)}>Descartar</button>
              </div>
              <div className="hint" style={{ marginTop: 6 }}>
                Revisa y corrige lo que haga falta después de cargar. Nada se guarda hasta que guardes la cotización.
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Fila({ l, v, conf }: { l: string; v: string | null; conf?: Conf }) {
  return (
    <tr className="rw">
      <td style={{ width: 130, color: "#767D76", fontSize: 11.5 }}>{l}</td>
      <td style={{ fontWeight: 600 }}>{v ?? <span style={{ color: "#B0B5AF" }}>—</span>}</td>
      <td className="ta-r" style={{ width: 64 }}>
        {conf ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: COLOR_CONF[conf] }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: COLOR_CONF[conf] }} />
            {ETIQUETA_CONF[conf]}
          </span>
        ) : null}
      </td>
    </tr>
  );
}
