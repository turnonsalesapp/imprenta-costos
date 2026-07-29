"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Save, RotateCcw, Check, Plus } from "lucide-react";
import {
  calcCapacidad, medidaCorte, TAMANOS, n, fmtNum, usd,
  type Config, type Acabado, type Montaje as MontajeInfo,
} from "@/lib/calculo";
import { calcularOffset, type EntradaOffset, type OffsetAcab } from "@/lib/calculo-offset";
import { nuevoFormOffset, type FormOffset } from "@/lib/cotizacion-form";
import type { ClienteSimple } from "@/lib/clientes";
import type { EquipoItem } from "@/lib/equipos";
import { guardarOffsetAction } from "@/app/actions/cotizaciones";
import { agregarItemDraft, type EmbedCotizador } from "@/lib/draft-cotizacion";
import { F, T, PrecioManual, TarjetaTasas } from "../cotizar/campos";
import { PanelBorrador } from "../cotizar/PanelBorrador";
import "../cotizar/calc.css";

const TINTAS = ["#0B8FA8", "#C4177C", "#C79400", "#171B19", "#5B8C5A", "#8A5FBF", "#C0563B"];

export function CalculadoraOffset({
  cfg, clientes, equipos, offDefaults, formInicial, banner, margenMin, embed,
}: {
  cfg: Config;
  clientes: ClienteSimple[];
  equipos: EquipoItem[];
  offDefaults: { plancha: number; planchaMedio: number; planchaPliego: number; arranque: number; millar: number; tinta: number };
  formInicial: FormOffset;
  banner?: string;
  margenMin?: number;
  embed?: EmbedCotizador;
}) {
  const [form, setForm] = useState<FormOffset>(() => formInicial);
  const [escalas, setEscalas] = useState("1000, 2000, 5000, 10000");
  const [margenes, setMargenes] = useState("20, 25, 30, 35, 40");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const up = <K extends keyof FormOffset>(k: K, v: FormOffset[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setAcabado = (id: string, on: boolean, q: number | string) =>
    setForm((f) => ({ ...f, acabados: { ...f.acabados, [id]: { on, q } } }));

  const elegirCliente = (id: string) => {
    const c = clientes.find((x) => x.id === id);
    setForm((f) => ({ ...f, clienteId: id, cliente: id ? (c?.nombre ?? f.cliente) : f.cliente }));
  };

  // Al elegir prensa: toma sus colores por pasada y costos de corrida.
  const elegirEquipo = (id: string) => {
    const eq = equipos.find((x) => x.id === id);
    setForm((f) => eq
      ? { ...f, equipoId: id, coloresPasada: eq.coloresPasada, costoMillar: eq.costoMillar, costoArranque: eq.costoArranque }
      : { ...f, equipoId: id });
  };

  const papel = cfg.papeles.find((p) => p.id === form.papelId) ?? null;
  const frac = (TAMANOS.find((t) => t.id === form.tamano) ?? TAMANOS[0]).frac;
  const [W, H] = medidaCorte(papel?.med ?? "70x100", frac);
  const auto = calcCapacidad(n(form.anchoPza), n(form.altoPza), W, H, n(cfg.pinza), n(cfg.sep));

  // Costo de plancha según el tamaño elegido.
  const planchaPorTamano = (t: string): number => {
    const fr = (TAMANOS.find((x) => x.id === t) ?? TAMANOS[0]).frac;
    return fr >= 1 ? offDefaults.planchaPliego : fr >= 0.5 ? offDefaults.planchaMedio : offDefaults.plancha;
  };
  const elegirTamano = (t: string) =>
    setForm((f) => ({ ...f, tamano: t, costoPlancha: planchaPorTamano(t) }));

  useEffect(() => {
    if (form.capAuto && auto.cap > 0 && String(auto.cap) !== String(form.capacidad)) {
      setForm((f) => ({ ...f, capacidad: auto.cap }));
    }
  }, [auto.cap, form.capAuto, form.capacidad]);

  // Solo los acabados del módulo OFFSET (costos propios, distintos al digital).
  const acabadosOffset = useMemo(() => cfg.acabados.filter((a) => a.modulo === "offset"), [cfg.acabados]);
  const catalogoAcab: OffsetAcab[] = useMemo(
    () => acabadosOffset.map((a) => ({ id: a.id, label: a.label, costo: a.costo, unidad: a.unidad, escala: a.escala })),
    [acabadosOffset],
  );

  const entrada = (over?: Partial<EntradaOffset>): EntradaOffset => ({
    papelNombre: papel?.nombre ?? "Papel",
    precioPliego: papel ? n(papel.precio) / Math.max(1, n(papel.hojas)) : 0,
    medida: papel?.med ?? "70x100", tamano: form.tamano,
    anchoPza: form.anchoPza, altoPza: form.altoPza,
    capacidadManual: form.capAuto ? "" : form.capacidad,
    cantidad: form.cantidad, merma: form.merma, pinza: cfg.pinza, sep: cfg.sep,
    colores: form.colores, coloresPasada: form.coloresPasada, caras: form.caras,
    costoPlancha: form.costoPlancha, costoArranque: form.costoArranque, costoMillar: form.costoMillar,
    costoTinta: form.costoTinta,
    acabados: form.acabados, catalogoAcab,
    margen: form.margen, comision: form.comision, ml: form.ml,
    tasaBCV: form.tasaBCV, binCompra: form.binCompra, binVenta: form.binVenta,
    difManual: form.difManual, dif: form.dif, precioManual: form.precioManual,
    ...over,
  });

  const r = useMemo(() => calcularOffset(entrada()), [form, cfg]);
  const rBase = useMemo(() => calcularOffset(entrada({ precioManual: "" })), [form, cfg]);
  const manualOn = n(form.precioManual) > 0;
  const alternarManual = () =>
    setForm((f) => ({ ...f, precioManual: n(f.precioManual) > 0 ? "" : Number(rBase.precioUnit.toFixed(4)) || "" }));

  const precioPliego = papel ? n(papel.precio) / Math.max(1, n(papel.hojas)) : 0;

  const pts = useMemo(() => {
    const qs = escalas.split(/[,;\s]+/).map((v) => Math.round(n(v))).filter((v) => v > 0)
      .filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b).slice(0, 8);
    return qs.map((cant) => {
      const c = calcularOffset(entrada({ cantidad: cant, precioManual: "" }));
      return { cant, pliegos: c.pliegos, costoUnit: c.costoUnit, precioUnit: c.precioUnit, ventaTotal: c.ventaTotal, gananciaTotal: c.gananciaTotal };
    });
  }, [escalas, form, cfg]);

  const ptsMargen = useMemo(() => {
    const ms = margenes.split(/[,;\s]+/).map((v) => n(v)).filter((v) => v > 0)
      .filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b).slice(0, 8);
    return ms.map((mg) => {
      const c = calcularOffset(entrada({ margen: mg, precioManual: "" }));
      return { margen: mg, precioUnit: c.precioUnit, ventaTotal: c.ventaTotal, gananciaTotal: c.gananciaTotal };
    });
  }, [margenes, form, cfg]);

  // Acabados sueltos vs. agrupados (selector excluyente), como en digital.
  const { sueltos, grupos } = useMemo(() => {
    const sueltos: Acabado[] = [];
    const grupos: Record<string, Acabado[]> = {};
    for (const a of acabadosOffset) {
      if (a.grupo) (grupos[a.grupo] ??= []).push(a); else sueltos.push(a);
    }
    for (const g of Object.values(grupos)) g.sort((x, y) => x.costo - y.costo);
    return { sueltos, grupos };
  }, [acabadosOffset]);

  const elegirGrupo = (opciones: Acabado[], id: string) =>
    setForm((f) => {
      const ac = { ...f.acabados };
      for (const o of opciones) ac[o.id] = { on: o.id === id, q: 1 };
      return { ...f, acabados: ac };
    });

  function guardar() {
    setError(null);
    if (!form.cliente.trim() && !form.trabajo.trim()) { setError("Falta el cliente o el trabajo."); return; }
    if (!papel) { setError("Elige el papel."); return; }
    if (n(form.anchoPza) <= 0 || n(form.altoPza) <= 0) { setError("Indica el ancho y el alto de la pieza (mm)."); return; }
    startTransition(async () => {
      const res = await guardarOffsetAction(form);
      if (res?.error) setError(res.error);
    });
  }

  function agregarACotizacion() {
    setError(null);
    if (!papel) { setError("Elige el papel."); return; }
    if (n(form.anchoPza) <= 0 || n(form.altoPza) <= 0) { setError("Indica el ancho y el alto de la pieza (mm)."); return; }
    const resumen = { titulo: form.trabajo.trim() || `Offset ${papel.nombre}`, cantidad: r.cant, ventaTotal: r.ventaTotal, tipoLabel: "Offset" };
    if (embed) { embed.onAgregar(form, resumen); return; }
    agregarItemDraft("OFFSET", form, resumen, { cliente: form.cliente, clienteId: form.clienteId });
  }

  // Arma un ítem a partir de un volumen del comparador (mismo trabajo, otro tiraje).
  function volumenItem(cant: number, ventaTotal: number) {
    const base = form.trabajo.trim() || `Offset ${papel?.nombre ?? ""}`;
    return {
      form: { ...form, cantidad: cant, editarId: "" },
      resumen: { titulo: `${base} (${fmtNum(cant, 0)} u)`, cantidad: cant, ventaTotal, tipoLabel: "Offset" },
    };
  }
  function volumenesACotizacion(items: { form: unknown; resumen: { titulo: string; cantidad: number; ventaTotal: number; tipoLabel: string } }[]) {
    if (!papel) { setError("Elige el papel."); return; }
    if (n(form.anchoPza) <= 0 || n(form.altoPza) <= 0) { setError("Indica el ancho y el alto de la pieza (mm)."); return; }
    if (embed) { embed.onAgregarVarios(items); return; }
    for (const it of items) agregarItemDraft("OFFSET", it.form, it.resumen, { cliente: form.cliente, clienteId: form.clienteId });
  }

  const caras2 = n(form.caras) >= 2;

  return (
    <div className="pr">
      {banner ? (
        <div className="warn" style={{ marginBottom: 14, background: "#E6F4F8", borderColor: "#9AD3E0", color: "#0B5C6E" }}>{banner}</div>
      ) : null}
      <div className="grid">
        <div>
          <section className="card">
            <div className="ch"><b>Datos del trabajo</b><span className="mt">offset · producción propia</span></div>
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
                <T l="Trabajo" v={form.trabajo} set={(v) => up("trabajo", v)} ph="Ej. Volantes media carta" />
              </div>
              <div style={{ marginTop: 10 }}>
                <T l="Descripción (opcional)" v={form.descripcion} set={(v) => up("descripcion", v)} ph="Se autogenera con medida, papel y colores" />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="ch"><b>Formato y material</b><span className="mt mono">corte {W}×{H} mm</span></div>
            <div className="cb">
              <div className="rowg c4">
                <T l="Ancho pza (mm)" v={form.anchoPza} set={(v) => up("anchoPza", v)} num ph="216" />
                <T l="Alto pza (mm)" v={form.altoPza} set={(v) => up("altoPza", v)} num ph="140" />
                <T l="Cantidad" v={form.cantidad} set={(v) => up("cantidad", v)} num ph="1000" />
                <F l="Merma (%)"><input className="in mono" type="text" inputMode="decimal" value={form.merma} onChange={(e) => up("merma", e.target.value)} /></F>
              </div>

              <div className="rowg c2" style={{ marginTop: 10 }}>
                <F l="Papel">
                  <select className="in" value={form.papelId} onChange={(e) => up("papelId", e.target.value)}>
                    <option value="">— Selecciona el papel —</option>
                    {cfg.papeles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  {papel ? <div className="hint mono">{usd(precioPliego, 4)} el pliego · {usd(precioPliego * frac, 4)} el corte</div> : null}
                </F>
                <F l="Tamaño de pliego (prensa)" hint="Plancha según el tamaño">
                  <select className="in" value={form.tamano} onChange={(e) => elegirTamano(e.target.value)}>
                    {TAMANOS.map((t) => <option key={t.id} value={t.id}>{t.id}</option>)}
                  </select>
                </F>
              </div>

              <div className="rowg c2" style={{ marginTop: 10 }}>
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
                </F>
              </div>

              <div style={{ marginTop: 12 }}>
                <label className="fl">Montaje en el corte</label>
                <Montaje W={W} H={H} w={n(form.anchoPza)} h={n(form.altoPza)} info={auto} />
                {auto.cap === 0 && n(form.anchoPza) > 0 ? (
                  <div className="hint">La pieza no entra en el corte.</div>
                ) : (
                  <div className="hint mono">{auto.cols}×{auto.filas}{auto.rot ? " rotado" : ""} · pinza {cfg.pinza} mm · sep {cfg.sep} mm</div>
                )}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="ch"><b>Impresión offset</b><span className="mt mono">{r.nPlanchas} plancha{r.nPlanchas !== 1 ? "s" : ""} · {r.pasadas} pasada{r.pasadas !== 1 ? "s" : ""}</span></div>
            <div className="cb">
              <F l="Prensa (equipo)">
                {equipos.length ? (
                  <select className="in" value={form.equipoId} onChange={(e) => elegirEquipo(e.target.value)}>
                    <option value="">— Sin especificar —</option>
                    {equipos.map((eq) => (
                      <option key={eq.id} value={eq.id}>{eq.nombre} · {eq.coloresPasada} color{eq.coloresPasada !== 1 ? "es" : ""}/pasada</option>
                    ))}
                  </select>
                ) : (
                  <div className="hint">No hay equipos cargados. Un administrador los define en <b>Variables</b>.</div>
                )}
              </F>
              <div className="rowg c3" style={{ marginTop: 10 }}>
                <T l="Colores por cara" v={form.colores} set={(v) => up("colores", v)} num ph="4" />
                <T l="Colores por pasada" v={form.coloresPasada} set={(v) => up("coloresPasada", v)} num ph="4" />
                <F l="Caras">
                  <select className="in" value={String(form.caras)} onChange={(e) => up("caras", e.target.value)}>
                    <option value="1">Solo tiro (1 cara)</option>
                    <option value="2">Tiro y retiro (2 caras)</option>
                  </select>
                </F>
              </div>
              <div className="rowg c4" style={{ marginTop: 10 }}>
                <T l={`Plancha ${form.tamano.replace(" Pliego", "").replace("Pliego", "pliego")} ($)`} v={form.costoPlancha} set={(v) => up("costoPlancha", v)} num ph={String(offDefaults.planchaPliego)} />
                <T l="Arranque/cara ($)" v={form.costoArranque} set={(v) => up("costoArranque", v)} num ph={String(offDefaults.arranque)} />
                <T l="Millar/pasada ($)" v={form.costoMillar} set={(v) => up("costoMillar", v)} num ph={String(offDefaults.millar)} />
                <T l="Tinta/millar/color ($)" v={form.costoTinta} set={(v) => up("costoTinta", v)} num ph={String(offDefaults.tinta)} />
              </div>
              <div className="hint mono" style={{ marginTop: 8 }}>
                {fmtNum(r.pliegos, 0)} pliegos · {r.millaresImp} millar{r.millaresImp !== 1 ? "es" : ""} · {r.pasadas} pasada{r.pasadas !== 1 ? "s" : ""}/cara · {caras2 ? "2 caras" : "1 cara"}
              </div>
            </div>
          </section>

          {acabadosOffset.length ? (
            <section className="card">
              <div className="ch"><b>Acabados</b><span className="mt">marca lo que lleva el trabajo</span></div>
              <div className="cb">
                <div className="acs">
                  {sueltos.map((a) => {
                    const st = form.acabados[a.id] || { on: false, q: 1 };
                    const u = a.unidad === "pliego" ? "por pliego" : a.unidad === "elemento" ? "por pieza" : a.unidad === "millar" ? "por millar" : "por trabajo";
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
                          <input type="text" inputMode="decimal" value={st.q} onChange={(e) => setAcabado(a.id, true, e.target.value)} />
                        ) : null}
                      </div>
                    );
                  })}
                  {Object.entries(grupos).map(([g, opciones]) => {
                    const sel = opciones.find((o) => form.acabados[o.id]?.on) ?? null;
                    const titulo = g.charAt(0).toUpperCase() + g.slice(1);
                    return (
                      <div key={g} className={sel ? "ac on" : "ac"}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="nm">{titulo}</div>
                          <div className="un mono">{sel ? `${usd(sel.costo, n(sel.costo) < 1 ? 3 : 2)} por trabajo` : "sin " + titulo.toLowerCase()}</div>
                        </div>
                        <select value={sel?.id ?? ""} onChange={(e) => elegirGrupo(opciones, e.target.value)}
                          style={{ width: 128, border: "1px solid var(--rule)", borderRadius: 2, padding: "3px 5px", fontSize: 11.5, background: "#fff" }}>
                          <option value="">Ninguno</option>
                          {opciones.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          <TarjetaTasas
            tasaBCV={form.tasaBCV} binCompra={form.binCompra} binVenta={form.binVenta}
            margen={form.margen} comision={form.comision} ml={form.ml}
            difManual={form.difManual} dif={form.dif}
            difAuto={r.difAuto} binProm={r.binProm} difActual={r.dif}
            set={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
            toggleManual={() => setForm((f) => ({ ...f, difManual: !f.difManual, dif: f.difManual ? "" : r.difAuto.toFixed(4) }))}
          />

          <section className="card">
            <div className="ch"><b>Comparador por cantidad</b><span className="mt">el arranque se diluye con el tiraje</span></div>
            <div className="cb">
              <F l="Cantidades a comparar" hint="Separadas por coma. Máximo 8.">
                <input className="in mono" type="text" value={escalas} onChange={(e) => setEscalas(e.target.value)} />
              </F>
              {pts.length >= 1 && r.precioUnit > 0 ? (
                <div className="tw" style={{ marginTop: 12 }}>
                  <table>
                    <thead><tr><th className="ta-r">Cantidad</th><th className="ta-r">Pliegos</th><th className="ta-r">Costo unit.</th><th className="ta-r">Precio unit.</th><th className="ta-r">Ganancia</th><th /></tr></thead>
                    <tbody>
                      {pts.map((p) => {
                        const on = r.cant > 0 && p.cant === r.cant;
                        return (
                          <tr key={p.cant} className="rw" style={on ? { background: "#FDF0F7", boxShadow: "inset 3px 0 0 #C4177C" } : undefined}>
                            <td className="ta-r mono"><b>{fmtNum(p.cant, 0)}</b></td>
                            <td className="ta-r mono" style={{ color: "#767D76" }}>{fmtNum(p.pliegos, 0)}</td>
                            <td className="ta-r mono">{usd(p.costoUnit, 4)}</td>
                            <td className="ta-r mono"><b>{usd(p.precioUnit, 4)}</b></td>
                            <td className="ta-r mono" style={{ color: "#15794F" }}>{usd(p.gananciaTotal)}</td>
                            <td className="ta-r">
                              <span style={{ display: "inline-flex", gap: 4 }}>
                                {!on ? <button type="button" className="btn g sm" onClick={() => up("cantidad", p.cant)}>Usar</button> : <span style={{ fontSize: 10, color: "#767D76" }}>actual</span>}
                                <button type="button" className="btn g sm" title="Agregar este volumen como ítem" onClick={() => volumenesACotizacion([volumenItem(p.cant, p.ventaTotal)])}>＋ ítem</button>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="btn sm" onClick={() => volumenesACotizacion(pts.map((p) => volumenItem(p.cant, p.ventaTotal)))}>
                      Agregar los {pts.length} volúmenes como ítems
                    </button>
                  </div>
                </div>
              ) : <div className="hint" style={{ marginTop: 10 }}>Elige papel y medida para comparar.</div>}
            </div>
          </section>

          <section className="card">
            <div className="ch"><b>Comparador por margen</b><span className="mt">mismo costo, distinta rentabilidad</span></div>
            <div className="cb">
              <F l="Márgenes a comparar (%)" hint="Separados por coma. Máximo 8.">
                <input className="in mono" type="text" value={margenes} onChange={(e) => setMargenes(e.target.value)} />
              </F>
              {r.precioUnit > 0 ? (
                <div className="tw" style={{ marginTop: 12 }}>
                  <table>
                    <thead><tr><th className="ta-r">Margen</th><th className="ta-r">Precio unit.</th><th className="ta-r">Venta total</th><th className="ta-r">Ganancia</th><th /></tr></thead>
                    <tbody>
                      {ptsMargen.map((p) => {
                        const actual = n(form.margen) === p.margen;
                        return (
                          <tr key={p.margen} className="rw" style={actual ? { background: "#FDF0F7", boxShadow: "inset 3px 0 0 #C4177C" } : undefined}>
                            <td className="ta-r mono"><b>{fmtNum(p.margen, 0)}%</b></td>
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
              ) : <div className="hint" style={{ marginTop: 10 }}>Elige papel y medida para comparar.</div>}
            </div>
          </section>
        </div>

        {/* Ticket */}
        <div className="tick">
          <div className="tk">
            <div className="tkh"><b>Desglose</b><span className="mono">{fmtNum(r.pliegos, 0)} pliegos · {fmtNum(r.cant, 0)} pzs</span></div>
            <div className="bar">
              {r.lineas.map((l, i) => (
                <i key={l.k} style={{ width: (r.costoTotal > 0 ? (l.monto / r.costoTotal) * 100 : 0) + "%", background: TINTAS[i % TINTAS.length] }} />
              ))}
            </div>
            <div style={{ padding: "9px 0 3px" }}>
              {r.lineas.length === 0 ? <div className="li" style={{ color: "#767D76" }}>Elige papel, medida y colores.</div> : null}
              {r.lineas.map((l, i) => (
                <div className="li" key={l.k}>
                  <span className="dot" style={{ background: TINTAS[i % TINTAS.length] }} />
                  <span style={{ flex: 1, minWidth: 0 }}>{l.label}<span className="d mono">{l.detalle}</span></span>
                  <span className="a mono">{usd(l.monto)}</span>
                </div>
              ))}
            </div>
            <div className="sep" />
            <div className="tot big"><span>Costo total</span><span className="a mono">{usd(r.costoTotal)}</span></div>
            <div className="tot"><span>Costo unitario</span><span className="a mono">{usd(r.costoUnit, 4)}</span></div>
            <div className="sep" />
            <div className="tot" style={{ color: "#767D76" }}><span>Costo protegido ×{fmtNum(r.dif, 3)}</span><span className="a mono">{usd(r.costoProt, 4)}</span></div>
            <div className="tot" style={{ color: "#767D76" }}><span>Utilidad protegida</span><span className="a mono">{usd(r.utilProt, 4)}</span></div>
            <div style={{ height: 10 }} />
            <div className="price">
              <div className="lb">Precio unitario de venta{r.manual ? <span style={{ color: "#C4177C", fontSize: 9.5, marginLeft: 6 }}>A MANO</span> : null}</div>
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
            <PrecioManual valor={form.precioManual} onChange={(v) => up("precioManual", v)} activo={manualOn} onToggle={alternarManual} sugerido={rBase.precioUnit} />
          </div>
          <div className="tear" />

          {margenMin != null && r.cant > 0 && n(form.margen) < margenMin ? (
            <div className="warn" style={{ marginTop: 10 }}>
              El margen ({fmtNum(n(form.margen), 0)}%) está por debajo del mínimo ({fmtNum(margenMin, 0)}%).
            </div>
          ) : null}
          {error ? <div className="warn" style={{ marginTop: 10 }}>{error}</div> : null}

          {embed ? (
            <>
              <button type="button" className="btn w" onClick={agregarACotizacion}>
                <Plus size={14} />{embed.editando ? "Guardar ítem" : "Agregar ítem"}
              </button>
              <button type="button" className="btn g w" onClick={embed.onCancelar}>
                <RotateCcw size={13} />Cancelar
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn w" onClick={guardar} disabled={pendiente}>
                <Save size={14} />{pendiente ? "Guardando…" : form.editarId ? "Guardar cambios" : "Guardar cotización"}
              </button>
              {!form.editarId ? (
                <button type="button" className="btn g w" onClick={agregarACotizacion}>
                  <Plus size={14} />Agregar a la cotización
                </button>
              ) : null}
              <button type="button" className="btn g w" onClick={() => { setForm(nuevoFormOffset(cfg, offDefaults)); setError(null); }}>
                <RotateCcw size={13} />Limpiar
              </button>
              {!form.editarId ? <PanelBorrador /> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Montaje({ W, H, w, h, info }: { W: number; H: number; w: number; h: number; info: MontajeInfo }) {
  if (!info.cap || !w || !h) return null;
  const k = Math.min(150 / W, 118 / H);
  const pw = (info.rot ? h : w) * k, ph = (info.rot ? w : h) * k;
  const cells = [];
  for (let rr = 0; rr < Math.min(info.filas, 60); rr++) {
    for (let cc = 0; cc < Math.min(info.cols, 60); cc++) {
      cells.push(
        <rect key={rr + "-" + cc} x={4 + cc * (pw + 1.2)} y={4 + rr * (ph + 1.2)}
          width={pw} height={ph} fill="rgba(11,143,168,.16)" stroke="#0B8FA8" strokeWidth="0.5" />,
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
