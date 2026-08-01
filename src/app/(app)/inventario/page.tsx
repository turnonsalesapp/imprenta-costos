import { requireRol } from "@/lib/auth";
import { listarInventario, movimientosRecientes } from "@/lib/inventario";
import { ajusteAction, stockMinAction } from "@/app/actions/inventario";
import { fmtNum } from "@/lib/calculo";
import { EntradaForm } from "./EntradaForm";
import { PageHeader, SectionTitle } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

const inCls = "w-20 rounded-sm border border-regla bg-white px-2 py-1 text-right font-mono text-sm outline-none focus:border-cian";
const btn = "rounded-sm border border-regla px-2 py-1 text-xs font-medium hover:border-tinta";

const ETIQUETA_MOV: Record<string, string> = { ENTRADA: "Entrada", SALIDA: "Salida", AJUSTE: "Ajuste" };

export default async function InventarioPage() {
  await requireRol("ADMIN");
  const [papeles, movs] = await Promise.all([listarInventario(), movimientosRecientes(30)]);
  const bajos = papeles.filter((p) => p.bajo);

  // Agrupar por categoría de material (ya vienen ordenados por categoría).
  const categorias: { nombre: string; filas: typeof papeles }[] = [];
  for (const p of papeles) {
    let g = categorias.find((c) => c.nombre === p.categoria);
    if (!g) { g = { nombre: p.categoria, filas: [] }; categorias.push(g); }
    g.filas.push(p);
  }

  return (
    <>
      <PageHeader title="Inventario de papel" eyebrow="En pliegos completos · baja al terminar cada orden" />

      {bajos.length > 0 && (
        <div className="mt-6 rounded-sm border border-[#E8B4B4] bg-[#FDEDED] px-4 py-2 text-sm text-[#8A1C1C]">
          <b>{bajos.length}</b> {bajos.length === 1 ? "papel está" : "papeles están"} bajo el mínimo:{" "}
          {bajos.map((p) => p.nombre).join(", ")}.
        </div>
      )}

      {/* Registrar entrada de compra */}
      <section className="mt-8">
        <SectionTitle>Registrar entrada</SectionTitle>
        <EntradaForm papeles={papeles.map((p) => ({ id: p.id, nombre: p.nombre }))} />
      </section>

      {/* Stock por papel */}
      <section className="mt-6">
        <SectionTitle>Stock actual</SectionTitle>

        {/* Móvil (<md): cada papel es una tarjeta con su stock y sus controles
            apilados, agrupados por categoría; así se ve todo por línea sin scroll. */}
        <div className="space-y-4 md:hidden">
          {categorias.map((cat) => (
            <div key={cat.nombre}>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
                {cat.nombre}
              </div>
              <ul className="space-y-3">
                {cat.filas.map((p) => (
                  <li key={p.id}
                    className={`rounded-sm border border-regla p-4 ${p.bajo ? "bg-[#FDEDED]" : "bg-hoja"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 text-sm font-medium">
                        {p.nombre}
                        {p.bajo && <span className="ml-2 text-[10px] font-bold uppercase text-[#C0563B]">bajo</span>}
                      </span>
                      <span className={`tabular shrink-0 font-mono text-sm font-bold ${p.bajo ? "text-[#C0563B]" : ""}`}>
                        {fmtNum(p.stock, 0)}
                      </span>
                    </div>
                    <div className="mt-3 space-y-3 border-t border-suave pt-3">
                      <form action={stockMinAction} className="flex items-end gap-2">
                        <input type="hidden" name="papelId" value={p.id} />
                        <label className="block">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Mínimo (aviso)</span>
                          <input name="stockMin" defaultValue={fmtNum(p.stockMin, 0)} inputMode="decimal" className={`mt-1 block ${inCls}`} />
                        </label>
                        <button type="submit" className={btn}>Guardar</button>
                      </form>
                      <form action={ajusteAction} className="flex items-end gap-2">
                        <input type="hidden" name="papelId" value={p.id} />
                        <label className="block">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Ajustar a</span>
                          <input name="stock" placeholder="conteo" inputMode="decimal" className={`mt-1 block ${inCls}`} />
                        </label>
                        <button type="submit" className={btn}>Ajustar</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Escritorio (≥md): tabla ancha completa con controles en línea. */}
        <div className="hidden rounded-sm border border-regla bg-hoja md:block">
          <div className="flex gap-2 border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
            <span className="flex-1">Papel</span>
            <span className="w-24 text-right">Stock</span>
            <span className="w-40">Mínimo (aviso)</span>
            <span className="w-48">Ajustar a</span>
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            {categorias.map((cat) => (
              <div key={cat.nombre}>
                <div className="border-b border-regla bg-suave px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-kraft">
                  {cat.nombre}
                </div>
                {cat.filas.map((p) => (
                  <div key={p.id}
                    className={`flex flex-wrap items-center gap-2 border-b border-suave px-4 py-1.5 ${p.bajo ? "bg-[#FDEDED]" : ""}`}>
                    <span className="min-w-[12rem] flex-1 text-sm">
                      {p.nombre}
                      {p.bajo && <span className="ml-2 text-[10px] font-bold uppercase text-[#C0563B]">bajo</span>}
                    </span>
                    <span className={`tabular w-24 text-right font-mono text-sm font-bold ${p.bajo ? "text-[#C0563B]" : ""}`}>
                      {fmtNum(p.stock, 0)}
                    </span>
                    <form action={stockMinAction} className="flex w-40 items-center gap-1">
                      <input type="hidden" name="papelId" value={p.id} />
                      <input name="stockMin" defaultValue={fmtNum(p.stockMin, 0)} inputMode="decimal" className={inCls} />
                      <button type="submit" className={btn}>Guardar</button>
                    </form>
                    <form action={ajusteAction} className="flex w-48 items-center gap-1">
                      <input type="hidden" name="papelId" value={p.id} />
                      <input name="stock" placeholder="conteo" inputMode="decimal" className={inCls} />
                      <button type="submit" className={btn}>Ajustar</button>
                    </form>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Movimientos recientes */}
      <section className="mt-6">
        <SectionTitle>Movimientos recientes</SectionTitle>

        {/* Móvil (<md): cada movimiento es una tarjeta con sus datos por línea. */}
        <ul className="space-y-3 md:hidden">
          {movs.length === 0 ? (
            <li className="rounded-sm border border-regla bg-hoja px-4 py-8 text-center text-sm text-kraft">
              Sin movimientos todavía.
            </li>
          ) : movs.map((m) => (
            <li key={m.id} className="rounded-sm border border-regla bg-hoja p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm">{m.papel}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-kraft">
                    {m.fecha.toLocaleDateString("es-VE")}
                  </div>
                </div>
                <span className="shrink-0 rounded-sm bg-suave px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-kraft">
                  {ETIQUETA_MOV[m.tipo] ?? m.tipo}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-suave pt-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">Cantidad</div>
                  <div className={`tabular mt-0.5 font-mono text-sm ${m.cantidad < 0 ? "text-[#C0563B]" : "text-exito"}`}>
                    {m.cantidad > 0 ? "+" : ""}{fmtNum(m.cantidad, 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">Saldo</div>
                  <div className="tabular mt-0.5 font-mono text-sm">{fmtNum(m.saldo, 0)}</div>
                </div>
              </div>
              {m.motivo && <div className="mt-2 text-[13px] text-kraft">{m.motivo}</div>}
            </li>
          ))}
        </ul>

        {/* Escritorio (≥md): tabla ancha completa. */}
        <div className="hidden overflow-x-auto rounded-sm border border-regla bg-hoja md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-regla bg-suave text-left text-[10px] uppercase tracking-widest text-kraft">
                <th className="px-4 py-2 font-bold">Fecha</th>
                <th className="px-4 py-2 font-bold">Papel</th>
                <th className="px-4 py-2 font-bold">Tipo</th>
                <th className="px-4 py-2 text-right font-bold">Cantidad</th>
                <th className="px-4 py-2 text-right font-bold">Saldo</th>
                <th className="px-4 py-2 font-bold">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-suave">
              {movs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-3 text-center text-kraft">Sin movimientos todavía.</td></tr>
              ) : movs.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-[13px] text-kraft">
                    {m.fecha.toLocaleDateString("es-VE")}
                  </td>
                  <td className="px-4 py-2">{m.papel}</td>
                  <td className="px-4 py-2">{ETIQUETA_MOV[m.tipo] ?? m.tipo}</td>
                  <td className={`tabular px-4 py-2 text-right font-mono ${m.cantidad < 0 ? "text-[#C0563B]" : "text-exito"}`}>
                    {m.cantidad > 0 ? "+" : ""}{fmtNum(m.cantidad, 0)}
                  </td>
                  <td className="tabular px-4 py-2 text-right font-mono">{fmtNum(m.saldo, 0)}</td>
                  <td className="px-4 py-2 text-[13px] text-kraft">{m.motivo ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
