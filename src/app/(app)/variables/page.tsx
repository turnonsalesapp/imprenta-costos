import { requireRol } from "@/lib/auth";
import { MEDIDAS, fmtNum, usd } from "@/lib/calculo";
import {
  obtenerConfig, obtenerMembrete, listarPapeles, listarAcabados, historicoTasas,
  type AcabadoFila,
} from "@/lib/variables";
import {
  editarPapelAction, alternarPapelAction, editarAcabadoAction, alternarAcabadoAction,
  editarMaterialGFAction, alternarMaterialGFAction,
  editarProductoGFAction, alternarProductoGFAction,
  editarProductoPopAction, alternarProductoPopAction,
  editarEquipoAction, alternarEquipoAction,
} from "@/app/actions/variables";
import { listarMaterialesGFAdmin } from "@/lib/materiales-gf";
import { listarProductosGFAdmin } from "@/lib/productos-gf";
import { listarProductosPopAdmin } from "@/lib/productos-pop";
import { listarEquiposAdmin } from "@/lib/equipos";
import { ConfigForm } from "./ConfigForm";
import { CrearPapelForm } from "./CrearPapelForm";
import { CrearAcabadoForm } from "./CrearAcabadoForm";
import { CrearMaterialGFForm } from "./CrearMaterialGFForm";
import { CrearProductoGFForm } from "./CrearProductoGFForm";
import { CrearProductoPopForm } from "./CrearProductoPopForm";
import { CrearEquipoForm } from "./CrearEquipoForm";
import { BotonTasas } from "./BotonTasas";
import { MembreteForm } from "./MembreteForm";
import { PageHeader, SectionTitle } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

const medidas = Object.keys(MEDIDAS);
const inCls = "rounded-sm border border-regla bg-white px-2 py-1 text-sm outline-none focus:border-cian";
const btnGuardar = "rounded-sm bg-tinta px-2.5 py-1 text-xs font-bold text-hoja hover:opacity-90";
const btnAlt = "rounded-sm border border-regla px-2.5 py-1 text-xs font-medium text-kraft hover:border-tinta hover:text-tinta";

export default async function VariablesPage() {
  await requireRol("ADMIN");
  const [cfg, membrete, papeles, acabados, tasas, materialesGF, productosGF, productosPop, equipos] = await Promise.all([
    obtenerConfig(), obtenerMembrete(), listarPapeles(), listarAcabados(), historicoTasas(8),
    listarMaterialesGFAdmin(), listarProductosGFAdmin(), listarProductosPopAdmin(), listarEquiposAdmin(),
  ]);

  return (
    <>
      <PageHeader title="Variables" eyebrow="Del negocio · solo administración" />

      {/* Valores por defecto */}
      <section className="mt-8">
        <SectionTitle>Valores por defecto</SectionTitle>
        <BotonTasas />
        <ConfigForm cfg={cfg} />
      </section>

      {/* Membrete */}
      <section className="mt-6">
        <SectionTitle>Membrete de la cotización</SectionTitle>
        <MembreteForm m={membrete} />
      </section>

      {/* Histórico de tasas */}
      <section className="mt-6">
        <SectionTitle>Últimas tasas registradas</SectionTitle>
        <div className="overflow-x-auto rounded-sm border border-regla bg-hoja">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-regla bg-suave text-left text-[10px] uppercase tracking-widest text-kraft">
                <th className="px-4 py-2 font-bold">Fecha</th>
                <th className="px-4 py-2 text-right font-bold">BCV</th>
                <th className="px-4 py-2 text-right font-bold">Binance compra</th>
                <th className="px-4 py-2 text-right font-bold">Binance venta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-suave">
              {tasas.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-3 text-center text-kraft">Sin registros todavía.</td></tr>
              ) : tasas.map((t, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-[13px] text-kraft">
                    {t.fecha.toLocaleDateString("es-VE")} {t.fecha.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">{fmtNum(t.bcv, 2)}</td>
                  <td className="px-4 py-2 text-right font-mono">{fmtNum(t.binCompra, 2)}</td>
                  <td className="px-4 py-2 text-right font-mono">{fmtNum(t.binVenta, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Acabados — agrupados en bloques por tipo de impresión (digital / offset) */}
      <section className="mt-6">
        <SectionTitle>
          Acabados <span className="normal-case text-kraft">· tarifa base para 1/4 de pliego · en bloques por tipo de impresión</span>
        </SectionTitle>
        <div className="rounded-sm border border-regla bg-hoja">
          {(["digital", "offset"] as const).map((mod) => {
            const grupo = acabados.filter((a) => (a.modulo === "offset" ? "offset" : "digital") === mod);
            if (!grupo.length) return null;
            return (
              <div key={mod}>
                <div className="flex items-baseline gap-2 border-b border-regla bg-tinta px-4 py-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-hoja">
                    {mod === "digital" ? "Impresión digital" : "Impresión offset"}
                  </span>
                  <span className="text-[10px] text-[#9AA39C]">· {grupo.length}</span>
                </div>
                <div className="hidden gap-2 border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kraft sm:flex">
                  <span className="flex-1">Acabado</span>
                  <span className="w-20 text-right">Costo</span>
                  <span className="w-24">Módulo</span>
                  <span className="w-24">Se cobra</span>
                  <span className="w-28">Al cambiar tamaño</span>
                  <span className="w-14 text-right">Orden</span>
                  <span className="w-20">Grupo</span>
                  <span className="w-32" />
                </div>
                {grupo.map((a) => <FilaAcabado key={a.id} a={a} />)}
              </div>
            );
          })}
          <CrearAcabadoForm />
        </div>
      </section>

      {/* Papeles */}
      <section className="mt-6">
        <SectionTitle>
          Papeles <span className="normal-case text-kraft">· {papeles.length} referencias</span>
        </SectionTitle>
        <div className="rounded-sm border border-regla bg-hoja">
          <div className="hidden gap-2 border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kraft sm:flex">
            <span className="flex-1">Referencia</span>
            <span className="w-24">Categoría</span>
            <span className="w-24">Medida</span>
            <span className="w-16 text-right">Hojas</span>
            <span className="w-20 text-right">Precio</span>
            <span className="w-20 text-right">Por pliego</span>
            <span className="w-32" />
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            {papeles.map((p) => (
              <form key={p.id} action={editarPapelAction}
                className={`flex flex-wrap items-center gap-2 border-b border-suave px-4 py-1.5 ${p.activo ? "" : "opacity-50"}`}>
                <input type="hidden" name="id" value={p.id} />
                <input name="nombre" defaultValue={p.nombre} className={`min-w-[12rem] flex-1 ${inCls}`} />
                <input name="categoria" defaultValue={p.categoria} className={`w-24 ${inCls}`} />
                <select name="medida" defaultValue={p.medida} className={`w-24 ${inCls}`}>
                  {medidas.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <input name="hojas" defaultValue={String(p.hojas)} inputMode="numeric" className={`w-16 text-right font-mono ${inCls}`} />
                <input name="precio" defaultValue={String(p.precio)} inputMode="decimal" className={`w-20 text-right font-mono ${inCls}`} />
                <span className="w-20 text-right font-mono text-[12px] text-kraft">
                  {usd(p.precio / Math.max(1, p.hojas), 4)}
                </span>
                <span className="flex w-32 justify-end gap-1.5">
                  <button type="submit" className={btnGuardar}>Guardar</button>
                  <button type="submit" formAction={alternarPapelAction} className={btnAlt}>
                    {p.activo ? "Quitar" : "Activar"}
                  </button>
                </span>
              </form>
            ))}
          </div>
          <CrearPapelForm medidas={medidas} />
        </div>
      </section>

      {/* Materiales de gran formato */}
      <section className="mt-6">
        <SectionTitle>
          Gran formato <span className="normal-case text-kraft">· {materialesGF.length} materiales · costo por m²</span>
        </SectionTitle>
        <div className="rounded-sm border border-regla bg-hoja">
          <div className="hidden gap-2 border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kraft sm:flex">
            <span className="flex-1">Material</span>
            <span className="w-24">Categoría</span>
            <span className="w-20 text-right">Costo/m²</span>
            <span className="w-28">Cobro</span>
            <span className="w-24">Anchos (cm)</span>
            <span className="w-44">Montaje · tabla etiqueta</span>
            <span className="w-32" />
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            {materialesGF.map((m) => (
              <form key={m.id} action={editarMaterialGFAction}
                className={`flex flex-wrap items-center gap-2 border-b border-suave px-4 py-1.5 ${m.activo ? "" : "opacity-50"}`}>
                <input type="hidden" name="id" value={m.id} />
                <input name="nombre" defaultValue={m.nombre} className={`min-w-[11rem] flex-1 ${inCls}`} />
                <input name="categoria" defaultValue={m.categoria} className={`w-24 ${inCls}`} />
                <input name="costoM2" defaultValue={String(m.costoM2)} inputMode="decimal" className={`w-20 text-right font-mono ${inCls}`} />
                <select name="modoCobro" defaultValue={m.modoCobro} className={`w-28 ${inCls}`}>
                  <option value="mancha">Por mancha</option>
                  <option value="ancho_rollo">Ancho de rollo</option>
                  <option value="etiqueta">Etiqueta</option>
                </select>
                <input name="anchosRollo" defaultValue={m.anchosRollo} placeholder="—" className={`w-24 font-mono ${inCls}`} />
                <span className="flex w-44 items-center gap-1">
                  <input name="montaje" defaultValue={m.montaje} placeholder="125x70" title="Montaje (cm)" className={`w-16 font-mono ${inCls}`} />
                  <input name="tablaEtq" defaultValue={m.tablaEtq} placeholder="3x3:660,…" title="Tabla etiqueta" className={`min-w-0 flex-1 font-mono ${inCls}`} />
                </span>
                <span className="flex w-32 justify-end gap-1.5">
                  <button type="submit" className={btnGuardar}>Guardar</button>
                  <button type="submit" formAction={alternarMaterialGFAction} className={btnAlt}>
                    {m.activo ? "Quitar" : "Activar"}
                  </button>
                </span>
              </form>
            ))}
          </div>
          <CrearMaterialGFForm />
        </div>
      </section>

      {/* Productos terminados de gran formato */}
      <section className="mt-6">
        <SectionTitle>
          Gran formato · productos <span className="normal-case text-kraft">· {productosGF.length} productos · costo por unidad</span>
        </SectionTitle>
        <div className="rounded-sm border border-regla bg-hoja">
          <div className="hidden gap-2 border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kraft sm:flex">
            <span className="flex-1">Producto</span>
            <span className="w-24">Categoría</span>
            <span className="w-28">Medida</span>
            <span className="w-20 text-right">Costo/u</span>
            <span className="w-32" />
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            {productosGF.map((p) => (
              <form key={p.id} action={editarProductoGFAction}
                className={`flex flex-wrap items-center gap-2 border-b border-suave px-4 py-1.5 ${p.activo ? "" : "opacity-50"}`}>
                <input type="hidden" name="id" value={p.id} />
                <input name="nombre" defaultValue={p.nombre} className={`min-w-[11rem] flex-1 ${inCls}`} />
                <select name="categoria" defaultValue={p.categoria} className={`w-24 ${inCls}`}>
                  <option value="Pendón">Pendón</option>
                  <option value="Roll Up">Roll Up</option>
                  <option value="Araña">Araña</option>
                  <option value="Estructura">Estructura</option>
                </select>
                <input name="medida" defaultValue={p.medida} placeholder="—" className={`w-28 ${inCls}`} />
                <input name="costoUnit" defaultValue={String(p.costoUnit)} inputMode="decimal" className={`w-20 text-right font-mono ${inCls}`} />
                <span className="flex w-32 justify-end gap-1.5">
                  <button type="submit" className={btnGuardar}>Guardar</button>
                  <button type="submit" formAction={alternarProductoGFAction} className={btnAlt}>
                    {p.activo ? "Quitar" : "Activar"}
                  </button>
                </span>
              </form>
            ))}
          </div>
          <CrearProductoGFForm />
        </div>
      </section>

      {/* Personalizados / Material POP */}
      <section className="mt-6">
        <SectionTitle>
          Personalizados <span className="normal-case text-kraft">· {productosPop.length} productos · Material POP (chapas, llaveros, DTF…)</span>
        </SectionTitle>
        <div className="rounded-sm border border-regla bg-hoja">
          <div className="hidden gap-2 border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kraft sm:flex">
            <span className="flex-1">Producto</span>
            <span className="w-24">Categoría</span>
            <span className="w-24">Cobro</span>
            <span className="w-56">Escalas / lineal</span>
            <span className="w-32" />
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            {productosPop.map((p) => (
              <form key={p.id} action={editarProductoPopAction}
                className={`flex flex-wrap items-center gap-2 border-b border-suave px-4 py-1.5 ${p.activo ? "" : "opacity-50"}`}>
                <input type="hidden" name="id" value={p.id} />
                <input name="nombre" defaultValue={p.nombre} className={`min-w-[11rem] flex-1 ${inCls}`} />
                <input name="categoria" defaultValue={p.categoria} className={`w-24 ${inCls}`} />
                <select name="modo" defaultValue={p.modo} className={`w-24 ${inCls}`}>
                  <option value="escalas">Por cantidad</option>
                  <option value="lineal">Metro lineal</option>
                </select>
                {p.modo === "lineal" ? (
                  <span className="flex w-56 items-center gap-1">
                    <input name="precioLineal" defaultValue={String(p.precioLineal)} inputMode="decimal" title="$/metro" className={`w-16 text-right font-mono ${inCls}`} />
                    <input name="anchoCm" defaultValue={String(p.anchoCm)} inputMode="numeric" title="ancho cm" className={`w-16 text-right font-mono ${inCls}`} />
                    <input name="minCm" defaultValue={String(p.minCm)} inputMode="numeric" title="mínimo cm" className={`w-16 text-right font-mono ${inCls}`} />
                    <input type="hidden" name="escalas" value="" />
                  </span>
                ) : (
                  <span className="w-56">
                    <input name="escalas" defaultValue={p.escalas} placeholder="1:3.5,12:2.2,50:2.1,100:1.5" className={`w-full font-mono ${inCls}`} />
                    <input type="hidden" name="precioLineal" value="0" />
                    <input type="hidden" name="anchoCm" value="0" />
                    <input type="hidden" name="minCm" value="0" />
                  </span>
                )}
                <span className="flex w-32 justify-end gap-1.5">
                  <button type="submit" className={btnGuardar}>Guardar</button>
                  <button type="submit" formAction={alternarProductoPopAction} className={btnAlt}>
                    {p.activo ? "Quitar" : "Activar"}
                  </button>
                </span>
              </form>
            ))}
          </div>
          <CrearProductoPopForm />
        </div>
      </section>

      {/* Equipos (prensas offset) */}
      <section className="mt-6">
        <SectionTitle>
          Equipos <span className="normal-case text-kraft">· {equipos.length} equipos · prensas (colores por pasada)</span>
        </SectionTitle>
        <div className="rounded-sm border border-regla bg-hoja">
          <div className="hidden gap-2 border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kraft sm:flex">
            <span className="flex-1">Equipo</span>
            <span className="w-28 text-right">Colores/pasada</span>
            <span className="w-28 text-right">Millar/pasada</span>
            <span className="w-28 text-right">Arranque/cara</span>
            <span className="w-32" />
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            {equipos.map((eq) => (
              <form key={eq.id} action={editarEquipoAction}
                className={`flex flex-wrap items-center gap-2 border-b border-suave px-4 py-1.5 ${eq.activo ? "" : "opacity-50"}`}>
                <input type="hidden" name="id" value={eq.id} />
                <input name="nombre" defaultValue={eq.nombre} className={`min-w-[11rem] flex-1 ${inCls}`} />
                <input name="coloresPasada" defaultValue={String(eq.coloresPasada)} inputMode="numeric" className={`w-28 text-right font-mono ${inCls}`} />
                <input name="costoMillar" defaultValue={String(eq.costoMillar)} inputMode="decimal" className={`w-28 text-right font-mono ${inCls}`} />
                <input name="costoArranque" defaultValue={String(eq.costoArranque)} inputMode="decimal" className={`w-28 text-right font-mono ${inCls}`} />
                <span className="flex w-32 justify-end gap-1.5">
                  <button type="submit" className={btnGuardar}>Guardar</button>
                  <button type="submit" formAction={alternarEquipoAction} className={btnAlt}>
                    {eq.activo ? "Quitar" : "Activar"}
                  </button>
                </span>
              </form>
            ))}
          </div>
          <CrearEquipoForm />
        </div>
      </section>

      <p className="mt-4 text-[11px] leading-relaxed text-kraft">
        Al “quitar” un papel o acabado no se borra: sale de las cotizaciones nuevas, pero las
        guardadas lo siguen mostrando por su copia congelada. Cambiar un precio aquí solo afecta
        a lo que cotices de ahora en adelante.
      </p>
    </>
  );
}

/** Una fila editable de acabado. Se reutiliza dentro de cada bloque por tipo. */
function FilaAcabado({ a }: { a: AcabadoFila }) {
  return (
    <form action={editarAcabadoAction}
      className={`flex flex-wrap items-center gap-2 border-b border-suave px-4 py-1.5 ${a.activo ? "" : "opacity-50"}`}>
      <input type="hidden" name="id" value={a.id} />
      <input name="label" defaultValue={a.label} className={`min-w-[10rem] flex-1 ${inCls}`} />
      <input name="costo" defaultValue={String(a.costo)} inputMode="decimal" className={`w-20 text-right font-mono ${inCls}`} />
      <select name="modulo" defaultValue={a.modulo} className={`w-24 ${inCls}`}>
        <option value="digital">Digital</option>
        <option value="offset">Offset</option>
      </select>
      <select name="unidad" defaultValue={a.unidad} className={`w-24 ${inCls}`}>
        <option value="pliego">Por corte</option>
        <option value="elemento">Por pieza</option>
        <option value="millar">Por millar</option>
        <option value="trabajo">Por trabajo</option>
      </select>
      <select name="escala" defaultValue={a.escala} className={`w-28 ${inCls}`}>
        <option value="area">Con el área</option>
        <option value="min">Nunca baja</option>
        <option value="fija">Siempre igual</option>
      </select>
      <input name="orden" defaultValue={String(a.orden)} inputMode="numeric" className={`w-14 text-right font-mono ${inCls}`} />
      <input name="grupo" defaultValue={a.grupo ?? ""} placeholder="—" className={`w-20 ${inCls}`} />
      <span className="flex w-32 justify-end gap-1.5">
        <button type="submit" className={btnGuardar}>Guardar</button>
        <button type="submit" formAction={alternarAcabadoAction} className={btnAlt}>
          {a.activo ? "Quitar" : "Activar"}
        </button>
      </span>
    </form>
  );
}
