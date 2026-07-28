"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Save, RotateCcw, Plus } from "lucide-react";
import { n, fmtNum, usd, type Config } from "@/lib/calculo";
import { calcularPop, parseEscalas, type EntradaPop } from "@/lib/calculo-personalizado";
import { nuevoFormPersonalizado, type FormPersonalizado } from "@/lib/cotizacion-form";
import type { ProductoPopItem } from "@/lib/productos-pop";
import type { ClienteSimple } from "@/lib/clientes";
import { guardarPersonalizadoAction } from "@/app/actions/cotizaciones";
import { agregarItemDraft } from "@/lib/draft-cotizacion";
import { F, T, PrecioManual, TarjetaTasas } from "../cotizar/campos";
import "../cotizar/calc.css";

export function CalculadoraPersonalizado({
  cfg, clientes, productos, formInicial, banner, margenMin,
}: {
  cfg: Config;
  clientes: ClienteSimple[];
  productos: ProductoPopItem[];
  formInicial: FormPersonalizado;
  banner?: string;
  margenMin?: number;
}) {
  const [form, setForm] = useState<FormPersonalizado>(() => formInicial);
  const [margenes, setMargenes] = useState("20, 25, 30, 35, 40");
  const [error, setError] = useState<string | null>(null);
  const [enDraft, setEnDraft] = useState(0);
  const [pendiente, startTransition] = useTransition();

  const up = <K extends keyof FormPersonalizado>(k: K, v: FormPersonalizado[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const producto = productos.find((p) => p.clave === form.productoId) ?? null;
  const lineal = producto?.modo === "lineal";

  const elegirCliente = (id: string) => {
    const c = clientes.find((x) => x.id === id);
    setForm((f) => ({ ...f, clienteId: id, cliente: id ? (c?.nombre ?? f.cliente) : f.cliente }));
  };

  // Al elegir producto: fija el modo (escalas/lineal) del catálogo.
  const elegirProducto = (clave: string) => {
    const p = productos.find((x) => x.clave === clave);
    setForm((f) => ({ ...f, productoId: clave, modo: p ? p.modo : f.modo }));
  };

  const entrada = (over?: Partial<EntradaPop>): EntradaPop => ({
    nombre: producto?.nombre ?? "Producto",
    modo: lineal ? "lineal" : "escalas",
    cantidad: form.cantidad, escalas: producto?.escalas ?? "",
    largoCm: form.largoCm, precioLineal: producto?.precioLineal ?? 0,
    anchoCm: producto?.anchoCm ?? 0, minCm: producto?.minCm ?? 0,
    margen: form.margen, comision: form.comision, ml: form.ml,
    tasaBCV: form.tasaBCV, binCompra: form.binCompra, binVenta: form.binVenta,
    difManual: form.difManual, dif: form.dif, precioManual: form.precioManual,
    ...over,
  });

  const r = useMemo(() => calcularPop(entrada()), [form, producto]);
  const rBase = useMemo(() => calcularPop(entrada({ precioManual: "" })), [form, producto]);
  const manualOn = n(form.precioManual) > 0;
  const alternarManual = () =>
    setForm((f) => ({ ...f, precioManual: n(f.precioManual) > 0 ? "" : Number(rBase.precioUnit.toFixed(4)) || "" }));

  const ptsMargen = useMemo(() => {
    const ms = margenes.split(/[,;\s]+/).map((v) => n(v)).filter((v) => v > 0)
      .filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b).slice(0, 8);
    return ms.map((mg) => {
      const c = calcularPop(entrada({ margen: mg, precioManual: "" }));
      return { margen: mg, precioUnit: c.precioUnit, ventaTotal: c.ventaTotal, gananciaTotal: c.gananciaTotal };
    });
  }, [margenes, form, producto]);

  // Productos agrupados por categoría.
  const grupos = useMemo(() => {
    const g: { cat: string; items: ProductoPopItem[] }[] = [];
    for (const p of productos) {
      let x = g.find((y) => y.cat === p.categoria);
      if (!x) { x = { cat: p.categoria, items: [] }; g.push(x); }
      x.items.push(p);
    }
    return g;
  }, [productos]);

  // Tramos del producto elegido (para mostrar la tabla de escalas).
  const escalas = useMemo(() => (producto && !lineal ? parseEscalas(producto.escalas) : []), [producto, lineal]);
  const cantAplica = Math.max(0, Math.round(n(form.cantidad)));

  // Empujón de venta: el próximo tramo baja el costo unitario → sugiere subir la cantidad.
  const nudge = useMemo(() => {
    if (lineal || !escalas.length || cantAplica <= 0) return null;
    const sig = escalas.find((e) => e.desde > cantAplica);
    if (!sig || sig.precio >= r.costoUnitBase) return null;
    const c = calcularPop(entrada({ cantidad: sig.desde, precioManual: "" }));
    return { desde: sig.desde, precioUnit: c.precioUnit, ventaTotal: c.ventaTotal };
  }, [escalas, cantAplica, lineal, r.costoUnitBase, form, producto]);

  function guardar() {
    setError(null);
    if (!form.cliente.trim() && !form.trabajo.trim()) { setError("Falta el cliente o el trabajo."); return; }
    if (!producto) { setError("Elige un producto."); return; }
    if (lineal && n(form.largoCm) <= 0) { setError("Indica el largo (cm)."); return; }
    if (!lineal && cantAplica <= 0) { setError("Indica la cantidad."); return; }
    startTransition(async () => {
      const res = await guardarPersonalizadoAction(form);
      if (res?.error) setError(res.error);
    });
  }

  function agregarACotizacion() {
    setError(null);
    if (!producto) { setError("Elige un producto."); return; }
    if (lineal && n(form.largoCm) <= 0) { setError("Indica el largo (cm)."); return; }
    if (!lineal && cantAplica <= 0) { setError("Indica la cantidad."); return; }
    const nn = agregarItemDraft("PERSONALIZADO", form, {
      titulo: form.trabajo.trim() || producto.nombre, cantidad: r.cant, ventaTotal: r.ventaTotal, tipoLabel: "Personalizado",
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
            <div className="ch"><b>Datos del trabajo</b><span className="mt">personalizado · tercerizado</span></div>
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
                <T l="Trabajo" v={form.trabajo} set={(v) => up("trabajo", v)} ph="Ej. Chapas evento 5 cm" />
              </div>
              <div style={{ marginTop: 10 }}>
                <T l="Descripción (opcional)" v={form.descripcion} set={(v) => up("descripcion", v)} ph="Se autogenera con el producto" />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="ch"><b>Producto</b><span className="mt mono">{producto ? (lineal ? usd(producto.precioLineal) + " / m" : "por cantidad") : "elige producto"}</span></div>
            <div className="cb">
              <F l="Producto personalizado">
                <select className="in" value={form.productoId} onChange={(e) => elegirProducto(e.target.value)}>
                  <option value="">— Selecciona el producto —</option>
                  {grupos.map((g) => (
                    <optgroup key={g.cat} label={g.cat}>
                      {g.items.map((p) => (
                        <option key={p.clave} value={p.clave}>
                          {p.nombre}{p.modo === "lineal" ? ` · ${usd(p.precioLineal)}/m` : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </F>

              <div className="rowg c2" style={{ marginTop: 10 }}>
                {lineal ? (
                  <>
                    <T l="Largo (cm)" v={form.largoCm} set={(v) => up("largoCm", v)} num
                      ph={producto?.minCm ? `mínimo ${producto.minCm}` : "50"} />
                    <T l="Cantidad (piezas)" v={form.cantidad} set={(v) => up("cantidad", v)} num ph="1" />
                  </>
                ) : (
                  <>
                    <T l="Cantidad" v={form.cantidad} set={(v) => up("cantidad", v)} num ph="1" />
                    <F l="Costo por unidad">
                      <input className="in mono" readOnly value={r.costoUnitBase > 0 ? usd(r.costoUnitBase) : "—"}
                        style={{ background: "#EFF2EF", color: "#767D76" }} />
                    </F>
                  </>
                )}
              </div>

              {lineal && producto ? (
                <div className="hint" style={{ marginTop: 8 }}>
                  Ancho fijo {fmtNum(producto.anchoCm, 0)} cm{producto.minCm ? ` · mínimo ${producto.minCm} cm` : ""} · se factura {fmtNum(r.facturableCm, 0)} cm.
                </div>
              ) : null}

              {escalas.length ? (
                <div className="tw" style={{ marginTop: 12 }}>
                  <table>
                    <thead><tr><th>Desde</th><th className="ta-r">Precio unit.</th><th /></tr></thead>
                    <tbody>
                      {escalas.map((e, i) => {
                        const hasta = escalas[i + 1] ? escalas[i + 1].desde - 1 : null;
                        const aplica = r.costoUnitBase === e.precio && cantAplica >= e.desde &&
                          (hasta == null || cantAplica <= hasta);
                        return (
                          <tr key={e.desde} className="rw" style={aplica ? { background: "#E6F4F8", boxShadow: "inset 3px 0 0 #0B7A93" } : undefined}>
                            <td className="mono">{e.desde}{hasta ? `–${hasta}` : "+"}</td>
                            <td className="ta-r mono">{usd(e.precio)}</td>
                            <td className="ta-r">{aplica ? <span style={{ fontSize: 10, color: "#0B7A93", fontWeight: 700 }}>aplica</span> : null}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {nudge ? (
                <div className="hint" style={{ marginTop: 10, background: "#EDF9F1", border: "1px solid #B7E0C4", borderRadius: 3, padding: "7px 9px", color: "#15794F", display: "block" }}>
                  💡 Subiendo a <b>{fmtNum(nudge.desde, 0)} u</b> el precio baja a <b>{usd(nudge.precioUnit, 4)}</b> c/u
                  {" "}(venta {usd(nudge.ventaTotal)}).{" "}
                  <button type="button" className="lnk" onClick={() => up("cantidad", nudge.desde)}>subir a {fmtNum(nudge.desde, 0)}</button>
                </div>
              ) : null}
            </div>
          </section>

          <TarjetaTasas
            tasaBCV={form.tasaBCV} binCompra={form.binCompra} binVenta={form.binVenta}
            margen={form.margen} comision={form.comision} ml={form.ml}
            difManual={form.difManual} dif={form.dif}
            difAuto={r.difAuto} binProm={r.binProm} difActual={r.dif}
            set={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
            toggleManual={() => setForm((f) => ({ ...f, difManual: !f.difManual, dif: f.difManual ? "" : r.difAuto.toFixed(4) }))}
          />

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
              ) : <div className="hint" style={{ marginTop: 10 }}>Elige un producto y la cantidad para comparar.</div>}
            </div>
          </section>
        </div>

        {/* Ticket */}
        <div className="tick">
          <div className="tk">
            <div className="tkh"><b>Desglose</b><span className="mono">{fmtNum(r.cant, 0)} u</span></div>
            <div style={{ padding: "9px 0 3px" }}>
              {r.lineas.length === 0 ? <div className="li" style={{ color: "#767D76" }}>Elige un producto y la cantidad.</div> : null}
              {r.lineas.map((l) => (
                <div className="li" key={l.k}>
                  <span style={{ flex: 1, minWidth: 0 }}>{l.label}<span className="d mono">{l.detalle}</span></span>
                  <span className="a mono">{usd(l.monto)}</span>
                </div>
              ))}
            </div>
            <div className="sep" />
            <div className="tot big"><span>Costo total</span><span className="a mono">{usd(r.costoTotal)}</span></div>
            <div className="tot"><span>Costo por unidad</span><span className="a mono">{usd(r.costoUnit, 4)}</span></div>
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
                <span />
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
          <button type="button" className="btn g w" onClick={() => { setForm(nuevoFormPersonalizado(cfg)); setError(null); }}>
            <RotateCcw size={13} />Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
