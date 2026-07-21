"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Save, RotateCcw, Check } from "lucide-react";
import {
  calcular, calcCapacidad, medidaCorte, TAMANOS, n, fmtNum, usd,
  type Config, type Montaje as MontajeInfo,
} from "@/lib/calculo";
import { nuevoForm, type FormCotizacion } from "@/lib/cotizacion-form";
import type { ClienteSimple } from "@/lib/clientes";
import { guardarCotizacionAction } from "@/app/actions/cotizaciones";
import "./calc.css";

const TINTAS = ["#0B8FA8", "#C4177C", "#C79400", "#171B19", "#5B8C5A", "#8A5FBF", "#C0563B"];

export function Calculadora({
  cfg,
  clientes,
  formInicial,
  recotizado,
}: {
  cfg: Config;
  clientes: ClienteSimple[];
  formInicial: FormCotizacion;
  recotizado?: boolean;
}) {
  const [form, setForm] = useState<FormCotizacion>(() => formInicial);
  const [escalas, setEscalas] = useState("500, 1000, 3000, 5000, 10000");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const up = <K extends keyof FormCotizacion>(k: K, v: FormCotizacion[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const setAcabado = (id: string, on: boolean, q: number | string) =>
    setForm((f) => ({ ...f, acabados: { ...f.acabados, [id]: { on, q } } }));
  const elegirCliente = (id: string) => {
    if (!id) { setForm((f) => ({ ...f, clienteId: "" })); return; }
    const c = clientes.find((x) => x.id === id);
    setForm((f) => ({ ...f, clienteId: id, cliente: c?.nombre ?? f.cliente }));
  };

  const papel = cfg.papeles.find((p) => p.id === form.papelId) ?? null;
  const frac = (TAMANOS.find((t) => t.id === form.tamano) ?? TAMANOS[2]).frac;
  const [CW, CH] = medidaCorte(papel ? papel.med : "70x100", frac);
  const auto = calcCapacidad(n(form.ancho), n(form.alto), CW, CH, n(cfg.pinza), n(cfg.sep));

  useEffect(() => {
    if (form.capAuto && auto.cap > 0 && String(auto.cap) !== String(form.capacidad)) {
      setForm((f) => ({ ...f, capacidad: auto.cap }));
    }
  }, [auto.cap, form.capAuto, form.capacidad]);

  const r = useMemo(() => calcular(form, cfg), [form, cfg]);

  const pts = useMemo(() => {
    const qs = escalas.split(/[,;\s]+/).map((v) => Math.round(n(v)))
      .filter((v) => v > 0).filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a - b).slice(0, 8);
    return qs.map((cant) => {
      const c = calcular({ ...form, cantidad: cant }, cfg);
      return {
        cant, pliegos: c.pliegos, costoTotal: c.costoTotal, costoUnit: c.costoUnit,
        precioUnit: c.precioUnit, ventaTotal: c.ventaTotal, gananciaTotal: c.gananciaTotal,
      };
    });
  }, [escalas, form, cfg]);

  function guardar() {
    setError(null);
    if (!form.cliente.trim() && !form.trabajo.trim()) { setError("Falta el cliente o el trabajo."); return; }
    if (r.cant <= 0) { setError("Indica la cantidad de piezas."); return; }
    startTransition(async () => {
      const res = await guardarCotizacionAction(form);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="pr">
      <div className="grid">
        {/* ─────────────────────── columna izquierda ─────────────────────── */}
        <div>
          <section className="card">
            <div className="ch">
              <b>Datos del trabajo</b>
              {recotizado ? <span className="mt">recotización · receta cargada, tasas de hoy</span> : null}
            </div>
            <div className="cb">
              <div className="rowg c2">
                <F l="Cliente">
                  <select className="in" value={form.clienteId} onChange={(e) => elegirCliente(e.target.value)}>
                    <option value="">— A mano / sin registrar —</option>
                    {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  {form.clienteId === "" ? (
                    <input className="in" style={{ marginTop: 6 }} type="text" value={form.cliente}
                      placeholder="Nombre del cliente" onChange={(e) => up("cliente", e.target.value)} />
                  ) : null}
                </F>
                <T l="Trabajo" v={form.trabajo} set={(v) => up("trabajo", v)} ph="Ej. Stickers motivacionales" />
              </div>
              <div style={{ marginTop: 10 }}>
                <T l="Descripción" v={form.descripcion} set={(v) => up("descripcion", v)} ph="Ej. Stickers 14×14, 2 hojas" />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="ch">
              <b>Formato y material</b>
              <span className="mt mono">corte de {CW}×{CH} mm</span>
            </div>
            <div className="cb">
              <div className="rowg c4">
                <T l="Ancho (mm)" v={form.ancho} set={(v) => up("ancho", v)} num ph="140" />
                <T l="Alto (mm)" v={form.alto} set={(v) => up("alto", v)} num ph="140" />
                <T l="Cantidad" v={form.cantidad} set={(v) => up("cantidad", v)} num ph="3000" />
                <F l="Tamaño de corte">
                  <select className="in" value={form.tamano} onChange={(e) => up("tamano", e.target.value)}>
                    {TAMANOS.map((t) => <option key={t.id} value={t.id}>{t.id}</option>)}
                  </select>
                </F>
              </div>

              <div className="rowg c2" style={{ marginTop: 10 }}>
                <F l="Papel">
                  <select className="in" value={form.papelId} onChange={(e) => up("papelId", e.target.value)}>
                    <option value="">— Selecciona el papel —</option>
                    {cfg.papeles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  {papel ? (
                    <div className="hint mono">{usd(r.precioPliego, 4)} el pliego · {usd(r.precioCorte, 4)} el corte</div>
                  ) : null}
                </F>
                <F l="Merma de papel (%)">
                  <input className="in mono" type="text" inputMode="decimal" value={form.merma}
                    onChange={(e) => up("merma", e.target.value)} />
                  <div className="hint">Error de consumo por trabajo</div>
                </F>
              </div>

              <div className="rowg c2" style={{ marginTop: 12, alignItems: "start" }}>
                <F l="Piezas por corte">
                  <input className="in mono" type="text" inputMode="decimal" value={form.capacidad}
                    disabled={form.capAuto}
                    style={form.capAuto ? { background: "#EFF2EF", color: "#767D76" } : undefined}
                    onChange={(e) => up("capacidad", e.target.value)} />
                  <div className="hint">
                    <button type="button" className={form.capAuto ? "chk on" : "chk"} style={{ width: 13, height: 13 }}
                      aria-label="Calcular por montaje" onClick={() => up("capAuto", !form.capAuto)}>
                      {form.capAuto ? <Check size={9} strokeWidth={4} /> : null}
                    </button>
                    <span>Calcular por montaje</span>
                    {!form.capAuto && auto.cap > 0 ? (
                      <button type="button" className="lnk" onClick={() => up("capacidad", auto.cap)}>usar {auto.cap}</button>
                    ) : null}
                  </div>
                  {auto.cap > 0 ? (
                    <div className="hint mono">
                      {auto.cols}×{auto.filas}{auto.rot ? " rotado" : ""} · pinza {cfg.pinza} mm · sep {cfg.sep} mm
                    </div>
                  ) : null}
                </F>
                <div>
                  <label className="fl">Montaje en el corte</label>
                  <Montaje W={CW} H={CH} w={n(form.ancho)} h={n(form.alto)} info={auto} />
                  {auto.cap === 0 && n(form.ancho) > 0 ? (
                    <div className="hint">La pieza no entra en este tamaño de corte.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="ch"><b>Acabados</b><span className="mt">marca lo que lleva el trabajo</span></div>
            <div className="cb">
              <div className="acs">
                {cfg.acabados.map((a) => {
                  const st = form.acabados[a.id] || { on: false, q: 1 };
                  const u = a.unidad === "pliego" ? "por corte"
                    : a.unidad === "elemento" ? "por pieza"
                    : a.unidad === "millar" ? "por millar" : "por trabajo";
                  return (
                    <div key={a.id} className={st.on ? "ac on" : "ac"}>
                      <button type="button" className={st.on ? "chk on" : "chk"} aria-label={a.label}
                        onClick={() => setAcabado(a.id, !st.on, n(st.q) || 1)}>
                        {st.on ? <Check size={10} strokeWidth={4} /> : null}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="nm">{a.label}</div>
                        <div className="un mono">{usd(a.costo, n(a.costo) < 1 ? 3 : 2)} {u}</div>
                      </div>
                      {st.on && a.unidad !== "millar" ? (
                        <input type="text" inputMode="decimal" value={st.q}
                          onChange={(e) => setAcabado(a.id, true, e.target.value)} />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="ch"><b>Tasas y utilidad</b><span className="mt mono">diferencial {fmtNum(r.dif, 4)}</span></div>
            <div className="cb">
              <div className="rowg c3">
                <T l="Tasa BCV" v={form.tasaBCV} set={(v) => up("tasaBCV", v)} num />
                <T l="Binance compra" v={form.binCompra} set={(v) => up("binCompra", v)} num />
                <T l="Binance venta" v={form.binVenta} set={(v) => up("binVenta", v)} num />
              </div>
              <div className="hint mono" style={{ marginTop: 6 }}>
                Promedio {fmtNum(r.binProm, 2)} ÷ BCV {fmtNum(n(form.tasaBCV), 2)} = {fmtNum(r.difAuto, 4)}
                <button type="button" className="lnk" onClick={() => setForm((f) => ({
                  ...f, difManual: !f.difManual, dif: f.difManual ? "" : r.difAuto.toFixed(4),
                }))}>
                  {form.difManual ? "volver a automático" : "fijar manualmente"}
                </button>
              </div>
              {form.difManual ? (
                <div style={{ marginTop: 8, maxWidth: 170 }}>
                  <T l="Diferencial fijo" v={form.dif} set={(v) => up("dif", v)} num />
                </div>
              ) : null}
              <div className="rowg c3" style={{ marginTop: 12 }}>
                <T l="Margen (%)" v={form.margen} set={(v) => up("margen", v)} num />
                <T l="Comisión vendedor (%)" v={form.comision} set={(v) => up("comision", v)} num />
                <T l="Recargo MercadoLibre (%)" v={form.ml} set={(v) => up("ml", v)} num />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="ch">
              <b>Comparador por cantidad</b>
              <span className="mt">mismo trabajo, distintos tirajes</span>
            </div>
            <div className="cb">
              <F l="Cantidades a comparar" hint="Separadas por coma. Máximo 8.">
                <input className="in mono" type="text" value={escalas} onChange={(e) => setEscalas(e.target.value)} />
              </F>

              {pts.length < 2 || r.precioUnit <= 0 ? (
                <div className="hint" style={{ marginTop: 10 }}>
                  Elige el papel y al menos dos cantidades para ver la curva.
                </div>
              ) : (
                <>
                  <div style={{ marginTop: 12 }}>
                    <label className="fl">Precio unitario según el tiraje</label>
                    <Curva pts={pts} actual={r.cant} />
                  </div>

                  <div className="tw" style={{ marginTop: 12 }}>
                    <table>
                      <thead>
                        <tr>
                          <th className="ta-r">Cantidad</th>
                          <th className="ta-r">Cortes</th>
                          <th className="ta-r">Costo total</th>
                          <th className="ta-r">Costo unit.</th>
                          <th className="ta-r">Precio unit.</th>
                          <th className="ta-r">Venta total</th>
                          <th className="ta-r">Ganancia</th>
                          <th className="ta-r">vs. {fmtNum(pts[0].cant, 0)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pts.map((p) => {
                          const on = r.cant > 0 && p.cant === r.cant;
                          const dif = pts[0].precioUnit > 0 ? (p.precioUnit / pts[0].precioUnit - 1) * 100 : 0;
                          return (
                            <tr key={p.cant} className="rw"
                              style={on ? { background: "#FDF0F7", boxShadow: "inset 3px 0 0 #C4177C" } : undefined}>
                              <td className="ta-r mono">
                                <b>{fmtNum(p.cant, 0)}</b>
                                {on ? <span style={{ color: "#C4177C", fontSize: 9.5, marginLeft: 5 }}>ACTUAL</span> : null}
                              </td>
                              <td className="ta-r mono" style={{ color: "#767D76" }}>{fmtNum(p.pliegos, 1)}</td>
                              <td className="ta-r mono" style={{ color: "#767D76" }}>{usd(p.costoTotal)}</td>
                              <td className="ta-r mono">{usd(p.costoUnit, 4)}</td>
                              <td className="ta-r mono"><b>{usd(p.precioUnit, 4)}</b></td>
                              <td className="ta-r mono">{usd(p.ventaTotal)}</td>
                              <td className="ta-r mono" style={{ color: "#15794F" }}>{usd(p.gananciaTotal)}</td>
                              <td className="ta-r mono" style={{ color: dif < 0 ? "#15794F" : dif > 0 ? "#B33" : "#767D76" }}>
                                {dif === 0 ? "—" : (dif > 0 ? "+" : "") + fmtNum(dif, 1) + "%"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    {pts.map((p) => (
                      <button type="button" key={p.cant} className="btn g sm" onClick={() => up("cantidad", p.cant)}>
                        Usar {fmtNum(p.cant, 0)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* ───────────────────────── ticket / desglose ───────────────────────── */}
        <div className="tick">
          <div className="tk">
            <div className="tkh">
              <b>Desglose</b>
              <span className="mono">{fmtNum(r.pliegos, 2)} cortes · {fmtNum(r.piezas, 0)} pzs</span>
            </div>
            <div className="bar">
              {r.lineas.map((l, i) => (
                <i key={l.k} style={{
                  width: (r.costoTotal > 0 ? (l.monto / r.costoTotal) * 100 : 0) + "%",
                  background: TINTAS[i % TINTAS.length],
                }} />
              ))}
            </div>

            <div style={{ padding: "9px 0 3px" }}>
              {r.lineas.length === 0 ? (
                <div className="li" style={{ color: "#767D76" }}>Elige papel, cantidad y acabados para ver el costo.</div>
              ) : null}
              {r.lineas.map((l, i) => (
                <div className="li" key={l.k}>
                  <span className="dot" style={{ background: TINTAS[i % TINTAS.length] }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    {l.label}
                    <span className="d mono">{l.detalle}</span>
                  </span>
                  <span className="a mono">{usd(l.monto)}</span>
                </div>
              ))}
            </div>

            <div className="sep" />
            <div className="tot big"><span>Costo total</span><span className="a mono">{usd(r.costoTotal)}</span></div>
            <div className="tot"><span>Costo unitario</span><span className="a mono">{usd(r.costoUnit, 4)}</span></div>
            <div className="sep" />
            <div className="tot" style={{ color: "#767D76" }}>
              <span>Costo protegido ×{fmtNum(r.dif, 3)}</span><span className="a mono">{usd(r.costoProt, 4)}</span>
            </div>
            <div className="tot" style={{ color: "#767D76" }}>
              <span>Utilidad protegida</span><span className="a mono">{usd(r.utilProt, 4)}</span>
            </div>
            {n(form.comision) > 0 ? (
              <div className="tot" style={{ color: "#767D76" }}>
                <span>Comisión {fmtNum(n(form.comision), 0)}%</span>
                <span className="a mono">{usd(r.precioUnit - r.precioSinCom, 4)}</span>
              </div>
            ) : null}
            <div style={{ height: 10 }} />

            <div className="price">
              <div className="lb">Precio unitario de venta</div>
              <div className="v mono">{usd(r.precioUnit, 4)}</div>
              <div className="sub mono">
                <span>Venta total <b>{usd(r.ventaTotal)}</b></span>
                <span>Ganancia <b>{usd(r.gananciaTotal)}</b></span>
              </div>
              <div className="sub mono">
                <span>Bs {fmtNum(r.precioBs, 2)}</span>
                <span>MercadoLibre {usd(r.precioML, 4)}</span>
              </div>
            </div>
          </div>
          <div className="tear" />

          {!form.trabajoId ? (
            <div className="hint" style={{ marginTop: 12, cursor: "pointer" }}
              onClick={() => up("guardarComoTrabajo", !form.guardarComoTrabajo)}>
              <button type="button" className={form.guardarComoTrabajo ? "chk on" : "chk"}
                aria-label="Guardar como trabajo repetido">
                {form.guardarComoTrabajo ? <Check size={10} strokeWidth={4} /> : null}
              </button>
              <span>Guardar también como trabajo repetido</span>
            </div>
          ) : (
            <div className="hint" style={{ marginTop: 12 }}>
              Esta cotización queda enlazada al trabajo repetido.
            </div>
          )}

          {error ? (
            <div className="warn" style={{ marginTop: 10 }}>{error}</div>
          ) : null}

          <button type="button" className="btn w" onClick={guardar} disabled={pendiente}>
            <Save size={14} />{pendiente ? "Guardando…" : "Guardar cotización"}
          </button>
          <button type="button" className="btn g w" onClick={() => { setForm(nuevoForm(cfg)); setError(null); }}>
            <RotateCcw size={13} />Limpiar y empezar otra
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── subcomponentes ─────────────────────────── */

function F({ l, children, hint }: { l: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="fl">{l}</label>
      {children}
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

function T({ l, v, set, ph, num }: {
  l: string; v: string | number; set: (v: string) => void; ph?: string; num?: boolean;
}) {
  return (
    <F l={l}>
      <input className={num ? "in mono" : "in"} type="text" inputMode={num ? "decimal" : "text"}
        value={v} placeholder={ph || ""} onChange={(e) => set(e.target.value)} />
    </F>
  );
}

function Montaje({ W, H, w, h, info }: { W: number; H: number; w: number; h: number; info: MontajeInfo }) {
  if (!info.cap || !w || !h) return null;
  const k = Math.min(150 / W, 118 / H);
  const pw = (info.rot ? h : w) * k, ph = (info.rot ? w : h) * k;
  const cells = [];
  for (let rr = 0; rr < Math.min(info.filas, 40); rr++) {
    for (let cc = 0; cc < Math.min(info.cols, 40); cc++) {
      cells.push(
        <rect key={rr + "-" + cc} x={4 + cc * (pw + 1.4)} y={4 + rr * (ph + 1.4)}
          width={pw} height={ph} fill="rgba(11,143,168,.16)" stroke="#0B8FA8" strokeWidth="0.6" />,
      );
    }
  }
  return (
    <svg width={W * k + 8} height={H * k + 8} style={{ maxWidth: "100%" }}>
      <rect x="0.5" y="0.5" width={W * k + 7} height={H * k + 7} fill="#fff" stroke="#C4CBC5" />
      {cells}
    </svg>
  );
}

type Punto = { cant: number; precioUnit: number };

function Curva({ pts, actual }: { pts: Punto[]; actual: number }) {
  if (pts.length < 2) return null;
  const W = 620, H = 128, ml = 8, mr = 8, mt = 12, mb = 24;
  const vals = pts.map((p) => p.precioUnit);
  const max = Math.max(...vals), min = Math.min(...vals);
  const span = max - min || max || 1;
  const x = (i: number) => ml + (i * (W - ml - mr)) / (pts.length - 1);
  const y = (v: number) => mt + (1 - (v - min) / span) * (H - mt - mb) * 0.86;
  const linea = pts.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.precioUnit).toFixed(1)).join(" ");
  const area = linea + " L" + x(pts.length - 1).toFixed(1) + " " + (H - mb) + " L" + ml + " " + (H - mb) + " Z";
  return (
    <svg viewBox={"0 0 " + W + " " + H} width="100%" style={{ display: "block", marginTop: 4 }}>
      <line x1={ml} y1={H - mb} x2={W - mr} y2={H - mb} stroke="#C4CBC5" strokeWidth="1" />
      <path d={area} fill="rgba(11,143,168,.10)" />
      <path d={linea} fill="none" stroke="#0B8FA8" strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const on = actual > 0 && p.cant === actual;
        return (
          <g key={p.cant}>
            {on ? <line x1={x(i)} y1={mt} x2={x(i)} y2={H - mb} stroke="#C4177C" strokeWidth="1" strokeDasharray="3 3" /> : null}
            <circle cx={x(i)} cy={y(p.precioUnit)} r={on ? 4.5 : 3}
              fill={on ? "#C4177C" : "#FCFCFB"} stroke={on ? "#C4177C" : "#0B8FA8"} strokeWidth="2" />
            <text x={x(i)} y={y(p.precioUnit) - 9} textAnchor="middle"
              style={{ fontSize: 10.5, fontFamily: "ui-monospace,Menlo,monospace", fill: on ? "#C4177C" : "#171B19", fontWeight: 700 }}>
              {usd(p.precioUnit, p.precioUnit < 1 ? 3 : 2)}
            </text>
            <text x={x(i)} y={H - 8} textAnchor="middle"
              style={{ fontSize: 10, fontFamily: "ui-monospace,Menlo,monospace", fill: "#767D76" }}>
              {fmtNum(p.cant, 0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
