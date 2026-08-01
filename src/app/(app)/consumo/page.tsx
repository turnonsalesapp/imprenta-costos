import { requireRol } from "@/lib/auth";
import { consumoPapelPorMes, type FilaConsumo } from "@/lib/consumo";
import { fmtNum } from "@/lib/calculo";
import { PageHeader, EmptyState } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

function nombreMes(mes: string): string {
  const d = new Date(mes + "-01T00:00:00");
  const s = d.toLocaleDateString("es-VE", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function ConsumoPage() {
  await requireRol("ADMIN");
  const filas = await consumoPapelPorMes();

  // Agrupar por mes conservando el orden (ya viene ordenado por mes desc).
  const meses: { mes: string; filas: FilaConsumo[] }[] = [];
  for (const f of filas) {
    let g = meses.find((m) => m.mes === f.mes);
    if (!g) { g = { mes: f.mes, filas: [] }; meses.push(g); }
    g.filas.push(f);
  }

  return (
    <>
      <PageHeader title="Consumo de papel" eyebrow="Por mes · cotizaciones aprobadas" />

      {meses.length === 0 ? (
        <EmptyState title="Todavía no hay consumo que reportar">
          Aparece aquí cuando haya cotizaciones en estado Aprobada.
        </EmptyState>
      ) : (
        <div className="mt-8 space-y-6">
          {meses.map((g) => {
            const totalPliegos = g.filas.reduce((s, f) => s + f.pliegos, 0);
            return (
              <section key={g.mes} className="rounded-sm border border-regla bg-hoja">
                <div className="flex items-baseline justify-between border-b border-regla bg-suave px-4 py-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest">{nombreMes(g.mes)}</span>
                  <span className="tabular font-mono text-[12px] text-kraft">
                    {fmtNum(totalPliegos, 0)} pliegos en total
                  </span>
                </div>

                {/* Móvil (<768px): cada fila del mes es una tarjeta, así se ve
                    todo por línea sin scroll horizontal. La tabla aparece desde md. */}
                <div className="space-y-3 p-3 md:hidden">
                  {g.filas.map((f) => (
                    <div key={f.papel} className="rounded-sm border border-regla bg-hoja p-4">
                      <div className="font-medium">{f.papel}</div>
                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-suave pt-3">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">Cortes</div>
                          <div className="tabular mt-0.5 font-mono text-sm text-kraft">{fmtNum(f.cortes, 1)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">Pliegos completos</div>
                          <div className="tabular mt-0.5 font-mono text-sm font-bold">{fmtNum(f.pliegos, 0)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Escritorio (≥768px): tabla completa. */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-widest text-kraft">
                        <th className="px-4 py-2 font-bold">Papel</th>
                        <th className="px-4 py-2 text-right font-bold">Cortes</th>
                        <th className="px-4 py-2 text-right font-bold">Pliegos completos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-suave">
                      {g.filas.map((f) => (
                        <tr key={f.papel} className="hover:bg-suave">
                          <td className="px-4 py-2">{f.papel}</td>
                          <td className="tabular px-4 py-2 text-right font-mono text-kraft">{fmtNum(f.cortes, 1)}</td>
                          <td className="tabular px-4 py-2 text-right font-mono font-bold">{fmtNum(f.pliegos, 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-kraft">
        Los pliegos completos son lo que hay que comprar: un corte de 1/4 de pliego consume
        0,25 de pliego. Incluye la merma. Solo cuenta cotizaciones aprobadas.
      </p>
    </>
  );
}
