import { requireRol } from "@/lib/auth";
import { consumoPapelPorMes, type FilaConsumo } from "@/lib/consumo";
import { fmtNum } from "@/lib/calculo";

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
      <header>
        <h1 className="text-lg font-bold tracking-tight">Consumo de papel</h1>
        <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">
          Por mes · cotizaciones aprobadas
        </p>
      </header>

      {meses.length === 0 ? (
        <div className="mt-6 rounded-sm border border-regla bg-hoja px-4 py-12 text-center">
          <b className="block text-sm">Todavía no hay consumo que reportar</b>
          <p className="mt-1 text-sm text-kraft">
            Aparece aquí cuando haya cotizaciones en estado Aprobada.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {meses.map((g) => {
            const totalPliegos = g.filas.reduce((s, f) => s + f.pliegos, 0);
            return (
              <section key={g.mes} className="overflow-x-auto rounded-sm border border-regla bg-hoja">
                <div className="flex items-baseline justify-between border-b border-regla bg-suave px-4 py-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest">{nombreMes(g.mes)}</span>
                  <span className="font-mono text-[12px] text-kraft">
                    {fmtNum(totalPliegos, 0)} pliegos en total
                  </span>
                </div>
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
                        <td className="px-4 py-2 text-right font-mono text-kraft">{fmtNum(f.cortes, 1)}</td>
                        <td className="px-4 py-2 text-right font-mono font-bold">{fmtNum(f.pliegos, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
