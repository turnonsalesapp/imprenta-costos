import { requireRol } from "@/lib/auth";
import { MEDIDAS, fmtNum, usd } from "@/lib/calculo";
import {
  obtenerConfig, listarPapeles, listarAcabados, historicoTasas,
} from "@/lib/variables";
import {
  editarPapelAction, alternarPapelAction, editarAcabadoAction, alternarAcabadoAction,
} from "@/app/actions/variables";
import { ConfigForm } from "./ConfigForm";
import { CrearPapelForm } from "./CrearPapelForm";
import { CrearAcabadoForm } from "./CrearAcabadoForm";

export const dynamic = "force-dynamic";

const medidas = Object.keys(MEDIDAS);
const inCls = "rounded-sm border border-regla bg-white px-2 py-1 text-sm outline-none focus:border-cian";
const btnGuardar = "rounded-sm bg-tinta px-2.5 py-1 text-xs font-bold text-hoja hover:opacity-90";
const btnAlt = "rounded-sm border border-regla px-2.5 py-1 text-xs font-medium text-kraft hover:border-tinta hover:text-tinta";

export default async function VariablesPage() {
  await requireRol("ADMIN");
  const [cfg, papeles, acabados, tasas] = await Promise.all([
    obtenerConfig(), listarPapeles(), listarAcabados(), historicoTasas(8),
  ]);

  return (
    <>
      <header>
        <h1 className="text-lg font-bold tracking-tight">Variables</h1>
        <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">Del negocio · solo administración</p>
      </header>

      {/* Valores por defecto */}
      <section className="mt-6">
        <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">Valores por defecto</h2>
        <ConfigForm cfg={cfg} />
      </section>

      {/* Histórico de tasas */}
      <section className="mt-6">
        <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">Últimas tasas registradas</h2>
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

      {/* Acabados */}
      <section className="mt-8">
        <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
          Acabados <span className="normal-case text-kraft">· tarifa base para 1/4 de pliego</span>
        </h2>
        <div className="rounded-sm border border-regla bg-hoja">
          <div className="hidden gap-2 border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kraft sm:flex">
            <span className="flex-1">Acabado</span>
            <span className="w-20 text-right">Costo</span>
            <span className="w-24">Se cobra</span>
            <span className="w-28">Al cambiar tamaño</span>
            <span className="w-16 text-right">Orden</span>
            <span className="w-32" />
          </div>
          {acabados.map((a) => (
            <form key={a.id} action={editarAcabadoAction}
              className={`flex flex-wrap items-center gap-2 border-b border-suave px-4 py-1.5 ${a.activo ? "" : "opacity-50"}`}>
              <input type="hidden" name="id" value={a.id} />
              <input name="label" defaultValue={a.label} className={`min-w-[10rem] flex-1 ${inCls}`} />
              <input name="costo" defaultValue={String(a.costo)} inputMode="decimal" className={`w-20 text-right font-mono ${inCls}`} />
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
              <input name="orden" defaultValue={String(a.orden)} inputMode="numeric" className={`w-16 text-right font-mono ${inCls}`} />
              <span className="flex w-32 justify-end gap-1.5">
                <button type="submit" className={btnGuardar}>Guardar</button>
                <button type="submit" formAction={alternarAcabadoAction} className={btnAlt}>
                  {a.activo ? "Quitar" : "Activar"}
                </button>
              </span>
            </form>
          ))}
          <CrearAcabadoForm />
        </div>
      </section>

      {/* Papeles */}
      <section className="mt-8">
        <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
          Papeles <span className="normal-case text-kraft">· {papeles.length} referencias</span>
        </h2>
        <div className="rounded-sm border border-regla bg-hoja">
          <div className="hidden gap-2 border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kraft sm:flex">
            <span className="flex-1">Referencia</span>
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

      <p className="mt-4 text-[11px] leading-relaxed text-kraft">
        Al “quitar” un papel o acabado no se borra: sale de las cotizaciones nuevas, pero las
        guardadas lo siguen mostrando por su copia congelada. Cambiar un precio aquí solo afecta
        a lo que cotices de ahora en adelante.
      </p>
    </>
  );
}
