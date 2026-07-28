"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Save, RotateCcw, Check, Plus } from "lucide-react";
import { n, fmtNum, usd, type Config } from "@/lib/calculo";
import {
  calcularGF, calcularProductoGF, calcularEtiquetaGF, ojetesPorPerimetro, parseTablaEtq,
  type EntradaGF, type EntradaProductoGF, type EntradaEtiquetaGF, type ResultadoGF,
} from "@/lib/calculo-granformato";
import { nuevoFormGranFormato, type FormGranFormato } from "@/lib/cotizacion-form";
import type { MaterialGFItem } from "@/lib/materiales-gf";
import type { ProductoGFItem } from "@/lib/productos-gf";
import type { ClienteSimple } from "@/lib/clientes";
import { guardarGranFormatoAction } from "@/app/actions/cotizaciones";
import { agregarItemDraft } from "@/lib/draft-cotizacion";
import { F, T, PrecioManual, TarjetaTasas } from "../cotizar/campos";
import "../cotizar/calc.css";

/** Ancho de rollo más angosto que aún cubre la pieza (menos desperdicio). */
function sugerirRollo(anchos: number[], anchoCm: number): number {
  if (!anchos.length) return 0;
  const cubre = anchos.filter((a) => a >= anchoCm);
  return cubre.length ? Math.min(...cubre) : Math.max(...anchos);
}

export function CalculadoraGranFormato({
  cfg, clientes, materiales, productos, ojeteCosto, ojeteCm, formInicial, banner, margenMin,
}: {
  cfg: Config;
  clientes: ClienteSimple[];
  materiales: MaterialGFItem[];
  productos: ProductoGFItem[];
  ojeteCosto: number;
  ojeteCm: number;
  formInicial: FormGranFormato;
  banner?: string;
  margenMin?: number;
}) {
  const [form, setForm] = useState<FormGranFormato>(() => formInicial);
  const [margenes, setMargenes] = useState("20, 25, 30, 35, 40");
  const [cantidades, setCantidades] = useState("1, 2, 5, 10");
  const [error, setError] = useState<string | null>(null);
  const [enDraft, setEnDraft] = useState(0);
  const [pendiente, startTransition] = useTransition();

  const up = <K extends keyof FormGranFormato>(k: K, v: FormGranFormato[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const esProducto = form.modo === "producto";
  const material = materiales.find((m) => m.clave === form.materialId) ?? null;
  const producto = productos.find((p) => p.clave === form.productoId) ?? null;
  const esEtiqueta = !esProducto && material?.modoCobro === "etiqueta";
  const rendEtq = useMemo(() => (esEtiqueta && material ? parseTablaEtq(material.tablaEtq) : []), [esEtiqueta, material]);
  const udsEtq = rendEtq.find((e) => e.tam === form.etqTamano)?.uds ?? 0;

  const elegirCliente = (id: string) => {
    const c = clientes.find((x) => x.id === id);
    setForm((f) => ({ ...f, clienteId: id, cliente: id ? (c?.nombre ?? f.cliente) : f.cliente }));
  };

  // Al elegir material: fija el modo por defecto, sugiere el rollo o el tamaño de etiqueta.
  const elegirMaterial = (clave: string) => {
    const m = materiales.find((x) => x.clave === clave);
    setForm((f) => {
      const modo = m ? m.modoCobro : f.modoCobro;
      const rollo = m && modo === "ancho_rollo" ? sugerirRollo(m.anchos, n(f.anchoCm)) : n(f.anchoRolloCm);
      const tam = m && modo === "etiqueta" ? (parseTablaEtq(m.tablaEtq)[0]?.tam ?? "") : f.etqTamano;
      return { ...f, materialId: clave, modoCobro: modo, anchoRolloCm: rollo || "", etqTamano: tam };
    });
  };

  const costoM2 = material?.costoM2 ?? 0;
  const costoUnit = producto?.costoUnit ?? 0;

  // Parte de precio común a los dos modos (tasas, margen, comisión, ML, manual).
  const comun = () => ({
    margen: form.margen, comision: form.comision, ml: form.ml,
    tasaBCV: form.tasaBCV, binCompra: form.binCompra, binVenta: form.binVenta,
    difManual: form.difManual, dif: form.dif, precioManual: form.precioManual,
  });

  const entrada = (over?: Partial<EntradaGF>): EntradaGF => ({
    materialNombre: material?.nombre ?? "Material",
    anchoCm: form.anchoCm, altoCm: form.altoCm, cantidad: form.cantidad,
    costoM2, modoCobro: form.modoCobro, anchoRolloCm: form.anchoRolloCm,
    ojetesAuto: form.ojetesAuto, ojetes: form.ojetes, ojeteCosto, ojeteCm,
    ...comun(), ...over,
  });

  const entradaProd = (over?: Partial<EntradaProductoGF>): EntradaProductoGF => ({
    productoNombre: producto?.nombre ?? "Producto", costoUnit, cantidad: form.cantidad,
    ...comun(), ...over,
  });

  const entradaEtq = (over?: Partial<EntradaEtiquetaGF>): EntradaEtiquetaGF => ({
    materialNombre: material?.nombre ?? "Etiqueta", tamano: form.etqTamano, cantidad: form.cantidad,
    costoM2, montaje: material?.montaje ?? "", unidadesMontaje: udsEtq,
    ...comun(), ...over,
  });

  // Un solo motor de cálculo según el modo activo.
  const calc = (overGF?: Partial<EntradaGF>, overProd?: Partial<EntradaProductoGF>): ResultadoGF =>
    esProducto ? calcularProductoGF(entradaProd(overProd))
      : esEtiqueta ? calcularEtiquetaGF(entradaEtq(overGF as Partial<EntradaEtiquetaGF>))
        : calcularGF(entrada(overGF));

  const r = useMemo(() => calc(), [form, costoM2, costoUnit, ojeteCosto, ojeteCm]);
  const rBase = useMemo(() => calc({ precioManual: "" }, { precioManual: "" }), [form, costoM2, costoUnit, ojeteCosto, ojeteCm]);
  const manualOn = n(form.precioManual) > 0;
  const alternarManual = () =>
    setForm((f) => ({ ...f, precioManual: n(f.precioManual) > 0 ? "" : Number(rBase.precioUnit.toFixed(4)) || "" }));

  const ptsMargen = useMemo(() => {
    const ms = margenes.split(/[,;\s]+/).map((v) => n(v)).filter((v) => v > 0)
      .filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b).slice(0, 8);
    return ms.map((mg) => {
      const c = calc({ margen: mg, precioManual: "" }, { margen: mg, precioManual: "" });
      return { margen: mg, precioUnit: c.precioUnit, ventaTotal: c.ventaTotal, gananciaTotal: c.gananciaTotal };
    });
  }, [margenes, form, costoM2, costoUnit, ojeteCosto, ojeteCm]);

  // Comparador por cantidad: mismo trabajo, distintos tirajes (un ítem por tiraje).
  const pts = useMemo(() => {
    if (r.cant <= 0 || r.precioUnit <= 0) return [];
    const qs = cantidades.split(/[,;\s]+/).map((v) => Math.round(n(v))).filter((v) => v > 0)
      .filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b).slice(0, 8);
    return qs.map((c) => {
      const cc = calc({ cantidad: c, precioManual: "" }, { cantidad: c, precioManual: "" });
      return { cant: c, costoUnit: cc.costoUnit, precioUnit: cc.precioUnit, ventaTotal: cc.ventaTotal, gananciaTotal: cc.gananciaTotal };
    });
  }, [cantidades, form, costoM2, costoUnit, ojeteCosto, ojeteCm]);

  const ojetesAuto = ojetesPorPerimetro(n(form.anchoCm), n(form.altoCm), ojeteCm);
  const rolloSugerido = material ? sugerirRollo(material.anchos, n(form.anchoCm)) : 0;

  // Materiales agrupados por categoría para el selector.
  const grupos = useMemo(() => {
    const g: { cat: string; items: MaterialGFItem[] }[] = [];
    for (const m of materiales) {
      let x = g.find((y) => y.cat === m.categoria);
      if (!x) { x = { cat: m.categoria, items: [] }; g.push(x); }
      x.items.push(m);
    }
    return g;
  }, [materiales]);

  // Productos terminados agrupados por categoría.
  const gruposProd = useMemo(() => {
    const g: { cat: string; items: ProductoGFItem[] }[] = [];
    for (const p of productos) {
      let x = g.find((y) => y.cat === p.categoria);
      if (!x) { x = { cat: p.categoria, items: [] }; g.push(x); }
      x.items.push(p);
    }
    return g;
  }, [productos]);

  function guardar() {
    setError(null);
    if (!form.cliente.trim() && !form.trabajo.trim()) { setError("Falta el cliente o el trabajo."); return; }
    if (esProducto) {
      if (!producto) { setError("Elige un producto terminado."); return; }
    } else if (esEtiqueta) {
      if (!material) { setError("Elige un material."); return; }
      if (!form.etqTamano) { setError("Elige el tamaño de etiqueta."); return; }
      if (n(form.cantidad) <= 0) { setError("Indica la cantidad de etiquetas."); return; }
    } else {
      if (!material) { setError("Elige un material."); return; }
      if (n(form.anchoCm) <= 0 || n(form.altoCm) <= 0) { setError("Indica el ancho y el alto (cm)."); return; }
    }
    startTransition(async () => {
      const res = await guardarGranFormatoAction(form);
      if (res?.error) setError(res.error);
    });
  }

  function validarItem(): string | null {
    if (esProducto) { if (!producto) return "Elige un producto terminado."; }
    else if (esEtiqueta) {
      if (!material) return "Elige un material.";
      if (!form.etqTamano) return "Elige el tamaño de etiqueta.";
      if (n(form.cantidad) <= 0) return "Indica la cantidad de etiquetas.";
    } else {
      if (!material) return "Elige un material.";
      if (n(form.anchoCm) <= 0 || n(form.altoCm) <= 0) return "Indica el ancho y el alto (cm).";
    }
    return null;
  }

  function agregarACotizacion() {
    setError(null);
    const err = validarItem();
    if (err) { setError(err); return; }
    const titulo = form.trabajo.trim() || producto?.nombre || material?.nombre || "Gran formato";
    const nn = agregarItemDraft("GRAN_FORMATO", form, {
      titulo, cantidad: r.cant, ventaTotal: r.ventaTotal, tipoLabel: "Gran formato",
    }, { cliente: form.cliente, clienteId: form.clienteId });
    setEnDraft(nn);
  }

  // Agrega un volumen del comparador como ítem de la cotización mixta.
  function volumenACotizacion(cantV: number, ventaTotal: number) {
    setError(null);
    const err = validarItem();
    if (err) { setError(err); return; }
    const base = form.trabajo.trim() || producto?.nombre || material?.nombre || "Gran formato";
    const nn = agregarItemDraft("GRAN_FORMATO", { ...form, cantidad: cantV, editarId: "" }, {
      titulo: `${base} (${fmtNum(cantV, 0)} u)`, cantidad: cantV, ventaTotal, tipoLabel: "Gran formato",
    }, { cliente: form.cliente, clienteId: form.clienteId });
    setEnDraft(nn);
  }

  return (
    <div className="pr">
      {banner ? (
        <div className="warn" style={{ marginBottom: 14, background: "#E6F4F8", borderColor: "#9AD3E0", color: "#0B5C6E" }}>{banner}</div>
      ) : null}
      <div className="grid">
        <div>
          <section className="card">
            <div className="ch"><b>Tipo de trabajo</b><span className="mt">tercerizado</span></div>
            <div className="cb">
              <div className="seg" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!esProducto}
                  className={!esProducto ? "seg-b on" : "seg-b"}
                  onClick={() => up("modo", "impresion")}
                >
                  Impresión por m²
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={esProducto}
                  className={esProducto ? "seg-b on" : "seg-b"}
                  onClick={() => up("modo", "producto")}
                >
                  Producto terminado
                </button>
              </div>
              <div className="hint" style={{ marginTop: 8 }}>
                {esProducto
                  ? "Pendones, roll up, arañas y estructuras: costo fijo por unidad del catálogo."
                  : esEtiqueta
                    ? "Etiquetas: se imprimen en láminas de montaje; elige el tamaño y la cantidad."
                    : "Banners y viniles: área (mancha o ancho de rollo) más ojetes. Etiquetas: elige un material de etiqueta."}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="ch"><b>Datos del trabajo</b><span className="mt">gran formato · tercerizado</span></div>
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
                <T l="Trabajo" v={form.trabajo} set={(v) => up("trabajo", v)} ph="Ej. Pendón lona 2×1 m" />
              </div>
              <div style={{ marginTop: 10 }}>
                <T l="Descripción (opcional)" v={form.descripcion} set={(v) => up("descripcion", v)} ph="Se autogenera con material y medida" />
              </div>
            </div>
          </section>

          {esProducto ? (
            <section className="card">
              <div className="ch"><b>Producto terminado</b><span className="mt mono">{producto ? usd(costoUnit) + " / u" : "elige producto"}</span></div>
              <div className="cb">
                <F l="Producto">
                  <select className="in" value={form.productoId} onChange={(e) => up("productoId", e.target.value)}>
                    <option value="">— Selecciona el producto —</option>
                    {gruposProd.map((g) => (
                      <optgroup key={g.cat} label={g.cat}>
                        {g.items.map((p) => (
                          <option key={p.clave} value={p.clave}>
                            {p.nombre}{p.medida ? ` (${p.medida})` : ""} · {usd(p.costoUnit)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </F>
                <div className="rowg c2" style={{ marginTop: 10 }}>
                  <T l="Cantidad" v={form.cantidad} set={(v) => up("cantidad", v)} num ph="1" />
                  {producto?.medida ? (
                    <F l="Medida"><input className="in mono" readOnly value={producto.medida}
                      style={{ background: "#EFF2EF", color: "#767D76" }} /></F>
                  ) : null}
                </div>
              </div>
            </section>
          ) : (
          <>
          <section className="card">
            <div className="ch"><b>Material y medida</b><span className="mt mono">{material ? usd(costoM2) + " / m²" : "elige material"}</span></div>
            <div className="cb">
              <F l="Material">
                <select className="in" value={form.materialId} onChange={(e) => elegirMaterial(e.target.value)}>
                  <option value="">— Selecciona el material —</option>
                  {grupos.map((g) => (
                    <optgroup key={g.cat} label={g.cat}>
                      {g.items.map((m) => <option key={m.clave} value={m.clave}>{m.nombre} · {usd(m.costoM2)}/m²</option>)}
                    </optgroup>
                  ))}
                </select>
              </F>

              {esEtiqueta ? (
                <>
                  <div className="rowg c2" style={{ marginTop: 10 }}>
                    <F l="Tamaño de etiqueta (cm)">
                      <select className="in" value={form.etqTamano} onChange={(e) => up("etqTamano", e.target.value)}>
                        {rendEtq.map((e) => <option key={e.tam} value={e.tam}>{e.tam} cm · {e.uds} por lámina</option>)}
                      </select>
                    </F>
                    <T l="Cantidad de etiquetas" v={form.cantidad} set={(v) => up("cantidad", v)} num ph="1000" />
                  </div>
                  <div className="hint mono" style={{ marginTop: 8 }}>
                    Lámina {material?.montaje} cm · {udsEtq} por lámina · {r.montajes} lámina{r.montajes !== 1 ? "s" : ""} · {fmtNum(r.areaFactM2, 2)} m²
                  </div>
                </>
              ) : (
                <>
                  <div className="rowg c3" style={{ marginTop: 10 }}>
                    <T l="Ancho (cm)" v={form.anchoCm} set={(v) => up("anchoCm", v)} num ph="200" />
                    <T l="Alto (cm)" v={form.altoCm} set={(v) => up("altoCm", v)} num ph="100" />
                    <T l="Cantidad" v={form.cantidad} set={(v) => up("cantidad", v)} num ph="1" />
                  </div>

                  <div className="rowg c2" style={{ marginTop: 10 }}>
                    <F l="Cómo se cobra">
                      <select className="in" value={form.modoCobro} onChange={(e) => up("modoCobro", e.target.value as FormGranFormato["modoCobro"])}>
                        <option value="mancha">Por mancha (área impresa)</option>
                        <option value="ancho_rollo">Por ancho de rollo</option>
                      </select>
                    </F>
                    {form.modoCobro === "ancho_rollo" ? (
                      <F l="Ancho de rollo (cm)" hint={rolloSugerido > 0 ? `Sugerido: ${fmtNum(rolloSugerido, 0)} cm (menos desperdicio)` : undefined}>
                        {material && material.anchos.length ? (
                          <select className="in mono" value={form.anchoRolloCm} onChange={(e) => up("anchoRolloCm", e.target.value)}>
                            {material.anchos.map((a) => <option key={a} value={a}>{fmtNum(a, 0)} cm</option>)}
                          </select>
                        ) : (
                          <input className="in mono" type="text" inputMode="decimal" value={form.anchoRolloCm}
                            onChange={(e) => up("anchoRolloCm", e.target.value)} placeholder="137" />
                        )}
                      </F>
                    ) : (
                      <F l="Área facturable"><input className="in mono" readOnly value={`${fmtNum(r.areaFactM2, 2)} m²`}
                        style={{ background: "#EFF2EF", color: "#767D76" }} /></F>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          {esEtiqueta ? null : (
          <section className="card">
            <div className="ch"><b>Ojetes</b><span className="mt">{usd(ojeteCosto, 2)} c/u · cada {ojeteCm} cm</span></div>
            <div className="cb">
              <div className="hint" style={{ cursor: "pointer" }} onClick={() => up("ojetesAuto", !form.ojetesAuto)}>
                <button type="button" className={form.ojetesAuto ? "chk on" : "chk"} aria-label="Calcular ojetes automáticamente">
                  {form.ojetesAuto ? <Check size={10} strokeWidth={4} /> : null}
                </button>
                <span>Calcular ojetes automáticamente por el perímetro (cada {ojeteCm} cm)</span>
              </div>
              <div className="rowg c2" style={{ marginTop: 10 }}>
                {form.ojetesAuto ? (
                  <F l="Ojetes por pieza (auto)"><input className="in mono" readOnly value={String(ojetesAuto)}
                    style={{ background: "#EFF2EF", color: "#767D76" }} /></F>
                ) : (
                  <T l="Ojetes por pieza" v={form.ojetes} set={(v) => up("ojetes", v)} num ph="0" />
                )}
                <F l="Ojetes en total"><input className="in mono" readOnly value={String(r.ojetesTotal)}
                  style={{ background: "#EFF2EF", color: "#767D76" }} /></F>
              </div>
            </div>
          </section>
          )}
          </>
          )}

          <TarjetaTasas
            tasaBCV={form.tasaBCV} binCompra={form.binCompra} binVenta={form.binVenta}
            margen={form.margen} comision={form.comision} ml={form.ml}
            difManual={form.difManual} dif={form.dif}
            difAuto={r.difAuto} binProm={r.binProm} difActual={r.dif}
            set={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
            toggleManual={() => setForm((f) => ({ ...f, difManual: !f.difManual, dif: f.difManual ? "" : r.difAuto.toFixed(4) }))}
          />

          <section className="card">
            <div className="ch"><b>Comparador por cantidad</b><span className="mt">un ítem por tiraje</span></div>
            <div className="cb">
              <F l="Cantidades a comparar" hint="Separadas por coma. Máximo 8.">
                <input className="in mono" type="text" value={cantidades} onChange={(e) => setCantidades(e.target.value)} />
              </F>
              {pts.length >= 1 ? (
                <>
                  <div className="tw" style={{ marginTop: 12 }}>
                    <table>
                      <thead><tr><th className="ta-r">Cantidad</th><th className="ta-r">Costo unit.</th><th className="ta-r">Precio unit.</th><th className="ta-r">Venta total</th><th className="ta-r">Ganancia</th><th /></tr></thead>
                      <tbody>
                        {pts.map((p) => {
                          const on = r.cant > 0 && p.cant === r.cant;
                          return (
                            <tr key={p.cant} className="rw" style={on ? { background: "#FDF0F7", boxShadow: "inset 3px 0 0 #C4177C" } : undefined}>
                              <td className="ta-r mono"><b>{fmtNum(p.cant, 0)}</b></td>
                              <td className="ta-r mono" style={{ color: "#767D76" }}>{usd(p.costoUnit, 4)}</td>
                              <td className="ta-r mono"><b>{usd(p.precioUnit, 4)}</b></td>
                              <td className="ta-r mono">{usd(p.ventaTotal)}</td>
                              <td className="ta-r mono" style={{ color: "#15794F" }}>{usd(p.gananciaTotal)}</td>
                              <td className="ta-r">
                                <span style={{ display: "inline-flex", gap: 4 }}>
                                  {!on ? <button type="button" className="btn g sm" onClick={() => up("cantidad", p.cant)}>Usar</button> : <span style={{ fontSize: 10, color: "#767D76" }}>actual</span>}
                                  <button type="button" className="btn g sm" title="Agregar este volumen a la cotización" onClick={() => volumenACotizacion(p.cant, p.ventaTotal)}>＋ cotiz</button>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="btn sm" onClick={() => pts.forEach((p) => volumenACotizacion(p.cant, p.ventaTotal))}>
                      Agregar los {pts.length} volúmenes a la cotización
                    </button>
                  </div>
                </>
              ) : <div className="hint" style={{ marginTop: 10 }}>{esProducto ? "Elige un producto para comparar." : "Elige material y medida para comparar."}</div>}
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
              ) : <div className="hint" style={{ marginTop: 10 }}>{esProducto ? "Elige un producto para comparar." : "Elige material y medida para comparar."}</div>}
            </div>
          </section>
        </div>

        {/* Ticket */}
        <div className="tick">
          <div className="tk">
            <div className="tkh"><b>Desglose</b><span className="mono">{esProducto ? `${fmtNum(r.cant, 0)} u` : `${fmtNum(r.areaFactM2, 2)} m² · ${fmtNum(r.cant, 0)} u`}</span></div>
            <div style={{ padding: "9px 0 3px" }}>
              {r.lineas.length === 0 ? <div className="li" style={{ color: "#767D76" }}>{esProducto ? "Elige un producto." : "Elige material y medida."}</div> : null}
              {r.lineas.map((l) => (
                <div className="li" key={l.k}>
                  <span style={{ flex: 1, minWidth: 0 }}>{l.label}<span className="d mono">{l.detalle}</span></span>
                  <span className="a mono">{usd(l.monto)}</span>
                </div>
              ))}
            </div>
            <div className="sep" />
            <div className="tot big"><span>Costo total</span><span className="a mono">{usd(r.costoTotal)}</span></div>
            {esProducto
              ? <div className="tot"><span>Costo por unidad</span><span className="a mono">{usd(r.costoUnit, 4)}</span></div>
              : <div className="tot"><span>Costo por m²</span><span className="a mono">{r.areaFactM2 > 0 ? usd(r.costoTotal / r.areaFactM2, 2) : "—"}</span></div>}
            <div className="sep" />
            <div className="tot" style={{ color: "#767D76" }}><span>Costo protegido ×{fmtNum(r.dif, 3)}</span><span className="a mono">{usd(r.costoProt, 4)}</span></div>
            <div className="tot" style={{ color: "#767D76" }}><span>Utilidad protegida</span><span className="a mono">{usd(r.utilProt, 4)}</span></div>
            <div style={{ height: 10 }} />
            <div className="price">
              <div className="lb">Precio unitario de venta{r.manual ? <span style={{ color: "#C4177C", fontSize: 9.5, marginLeft: 6 }}>A MANO</span> : null}</div>
              <div className="v mono">{usd(r.precioUnit, 4)}</div>
              <div className="sub mono">
                <span>Venta total <b>{usd(r.ventaTotal)}</b></span>
                {esProducto ? <span /> : <span>Precio m² <b>{usd(r.precioM2Venta, 2)}</b></span>}
              </div>
              <div className="sub mono">
                <span>Bs {fmtNum(r.precioBs, 2)}</span>
                <span>Ganancia <b>{usd(r.gananciaTotal)}</b></span>
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

          <button type="button" className="btn w" onClick={guardar} disabled={pendiente}>
            <Save size={14} />{pendiente ? "Guardando…" : form.editarId ? "Guardar cambios" : "Guardar cotización"}
          </button>
          {!form.editarId ? (
            <button type="button" className="btn g w" onClick={agregarACotizacion}>
              <Plus size={14} />Agregar a la cotización
            </button>
          ) : null}
          {enDraft > 0 ? (
            <div className="hint" style={{ marginTop: 8, textAlign: "center" }}>
              Agregado · {enDraft} ítem{enDraft !== 1 ? "s" : ""} en el borrador ·{" "}
              <Link href="/cotizacion-nueva" className="lnk">ver / guardar cotización</Link>
            </div>
          ) : null}
          <button type="button" className="btn g w" onClick={() => { setForm(nuevoFormGranFormato(cfg)); setError(null); }}>
            <RotateCcw size={13} />Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
