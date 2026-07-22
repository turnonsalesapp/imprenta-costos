"use client";

import { useMemo, useState, useTransition } from "react";
import { Save, RotateCcw } from "lucide-react";
import { precioDesdeCosto, n, fmtNum, usd } from "@/lib/calculo";
import { nuevoFormProveedor, type FormProveedor } from "@/lib/cotizacion-form";
import type { Config } from "@/lib/calculo";
import type { ClienteSimple } from "@/lib/clientes";
import { guardarProveedorAction } from "@/app/actions/cotizaciones";
import "../cotizar/calc.css";

export function CalculadoraProveedor({
  cfg,
  clientes,
  formInicial,
  banner,
  margenMin,
}: {
  cfg: Config;
  clientes: ClienteSimple[];
  formInicial: FormProveedor;
  banner?: string;
  margenMin?: number;
}) {
  const [form, setForm] = useState<FormProveedor>(() => formInicial);
  const [margenes, setMargenes] = useState("20, 25, 30, 35, 40");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const up = <K extends keyof FormProveedor>(k: K, v: FormProveedor[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const elegirCliente = (id: string) => {
    if (!id) { setForm((f) => ({ ...f, clienteId: "" })); return; }
    const c = clientes.find((x) => x.id === id);
    setForm((f) => ({ ...f, clienteId: id, cliente: c?.nombre ?? f.cliente }));
  };

  const params = {
    margen: form.margen, comision: form.comision, ml: form.ml,
    tasaBCV: form.tasaBCV, binCompra: form.binCompra, binVenta: form.binVenta,
    difManual: form.difManual, dif: form.dif,
  };
  const cant = Math.max(0, Math.round(n(form.cantidad)));
  const r = useMemo(() => precioDesdeCosto(n(form.costoTotal), cant, params), [form, cant]);

  const ptsMargen = useMemo(() => {
    const ms = margenes.split(/[,;\s]+/).map((v) => n(v)).filter((v) => v > 0)
      .filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b).slice(0, 8);
    return ms.map((mg) => {
      const c = precioDesdeCosto(n(form.costoTotal), cant, { ...params, margen: mg });
      return { margen: mg, precioUnit: c.precioUnit, ventaTotal: c.ventaTotal, gananciaTotal: c.gananciaTotal };
    });
  }, [margenes, form, cant]);

  function guardar() {
    setError(null);
    if (!form.cliente.trim() && !form.trabajo.trim()) { setError("Falta el cliente o el trabajo."); return; }
    if (n(form.costoTotal) <= 0) { setError("Indica el costo del proveedor."); return; }
    if (cant <= 0) { setError("Indica la cantidad."); return; }
    startTransition(async () => {
      const res = await guardarProveedorAction(form);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="pr">
      {banner ? (
        <div className="warn" style={{ marginBottom: 14, background: "#E6F4F8", borderColor: "#9AD3E0", color: "#0B5C6E" }}>{banner}</div>
      ) : null}
      <div className="grid">
        <div>
          <section className="card">
            <div className="ch"><b>Datos del trabajo</b></div>
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
                <T l="Trabajo" v={form.trabajo} set={(v) => up("trabajo", v)} ph="Ej. Pendones gran formato" />
              </div>
              <div style={{ marginTop: 10 }}>
                <T l="Descripción" v={form.descripcion} set={(v) => up("descripcion", v)} />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="ch"><b>Proveedor y costo</b><span className="mt">trabajo tercerizado</span></div>
            <div className="cb">
              <div className="rowg c2">
                <T l="Proveedor" v={form.proveedorNombre} set={(v) => up("proveedorNombre", v)} ph="Nombre del proveedor" />
                <T l="Referencia / N° cotización proveedor" v={form.proveedorRef} set={(v) => up("proveedorRef", v)} />
              </div>
              <div className="rowg c2" style={{ marginTop: 10 }}>
                <T l="Cantidad" v={form.cantidad} set={(v) => up("cantidad", v)} num ph="100" />
                <T l="Costo total del proveedor (USD)" v={form.costoTotal} set={(v) => up("costoTotal", v)} num ph="0" />
              </div>
              <div style={{ marginTop: 10 }}>
                <T l="Notas del proveedor" v={form.proveedorNotas} set={(v) => up("proveedorNotas", v)} />
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
            <div className="ch"><b>Comparador por margen</b><span className="mt">mismo costo, distinta rentabilidad</span></div>
            <div className="cb">
              <F l="Márgenes a comparar (%)" hint="Separados por coma. Máximo 8.">
                <input className="in mono" type="text" value={margenes} onChange={(e) => setMargenes(e.target.value)} />
              </F>
              {ptsMargen.length && r.precioUnit > 0 ? (
                <div className="tw" style={{ marginTop: 12 }}>
                  <table>
                    <thead>
                      <tr>
                        <th className="ta-r">Margen</th>
                        <th className="ta-r">Precio unit.</th>
                        <th className="ta-r">Venta total</th>
                        <th className="ta-r">Ganancia</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {ptsMargen.map((p) => {
                        const actual = n(form.margen) === p.margen;
                        return (
                          <tr key={p.margen} className="rw"
                            style={actual ? { background: "#FDF0F7", boxShadow: "inset 3px 0 0 #C4177C" } : undefined}>
                            <td className="ta-r mono"><b>{fmtNum(p.margen, 0)}%</b>{actual ? <span style={{ color: "#C4177C", fontSize: 9.5, marginLeft: 5 }}>ACTUAL</span> : null}</td>
                            <td className="ta-r mono"><b>{usd(p.precioUnit, 4)}</b></td>
                            <td className="ta-r mono">{usd(p.ventaTotal)}</td>
                            <td className="ta-r mono" style={{ color: "#15794F" }}>{usd(p.gananciaTotal)}</td>
                            <td className="ta-r">{!actual ? <button type="button" className="btn g sm" onClick={() => up("margen", p.margen)}>Usar</button> : <span style={{ fontSize: 10, color: "#767D76" }}>actual</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <div className="hint" style={{ marginTop: 10 }}>Indica el costo del proveedor para comparar.</div>}
            </div>
          </section>
        </div>

        {/* Ticket */}
        <div className="tick">
          <div className="tk">
            <div className="tkh"><b>Desglose</b><span className="mono">{fmtNum(cant, 0)} unidades</span></div>
            <div style={{ padding: "9px 0 3px" }}>
              <div className="li"><span style={{ flex: 1 }}>Costo del proveedor<span className="d mono">{form.proveedorNombre || "externo"}</span></span><span className="a mono">{usd(r.costoTotal)}</span></div>
            </div>
            <div className="sep" />
            <div className="tot big"><span>Costo total</span><span className="a mono">{usd(r.costoTotal)}</span></div>
            <div className="tot"><span>Costo unitario</span><span className="a mono">{usd(r.costoUnit, 4)}</span></div>
            <div className="sep" />
            <div className="tot" style={{ color: "#767D76" }}><span>Costo protegido ×{fmtNum(r.dif, 3)}</span><span className="a mono">{usd(r.costoProt, 4)}</span></div>
            <div className="tot" style={{ color: "#767D76" }}><span>Utilidad protegida</span><span className="a mono">{usd(r.utilProt, 4)}</span></div>
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

          {margenMin != null && cant > 0 && n(form.margen) < margenMin ? (
            <div className="warn" style={{ marginTop: 10 }}>
              El margen ({fmtNum(n(form.margen), 0)}%) está por debajo del mínimo ({fmtNum(margenMin, 0)}%).
            </div>
          ) : null}
          {error ? <div className="warn" style={{ marginTop: 10 }}>{error}</div> : null}

          <button type="button" className="btn w" onClick={guardar} disabled={pendiente}>
            <Save size={14} />{pendiente ? "Guardando…" : form.editarId ? "Guardar cambios" : "Guardar cotización"}
          </button>
          <button type="button" className="btn g w" onClick={() => { setForm(nuevoFormProveedor(cfg)); setError(null); }}>
            <RotateCcw size={13} />Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}

function F({ l, children, hint }: { l: string; children: React.ReactNode; hint?: string }) {
  return (<div><label className="fl">{l}</label>{children}{hint ? <div className="hint">{hint}</div> : null}</div>);
}
function T({ l, v, set, ph, num }: { l: string; v: string | number; set: (v: string) => void; ph?: string; num?: boolean }) {
  return (
    <F l={l}>
      <input className={num ? "in mono" : "in"} type="text" inputMode={num ? "decimal" : "text"} value={v} placeholder={ph || ""} onChange={(e) => set(e.target.value)} />
    </F>
  );
}
