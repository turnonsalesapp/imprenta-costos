import { db } from "@/lib/db";
import { cargarConfig } from "@/lib/config";
import { fmtNum, usd } from "@/lib/calculo";

export const dynamic = "force-dynamic";

/**
 * Página de arranque. Confirma que la aplicación llegó a la base de datos y
 * que los datos iniciales están cargados.
 *
 * La reemplaza la calculadora en la Fase 3 del PLAN.md.
 */
export default async function Home() {
  let estado: "ok" | "sin-tablas" | "sin-conexion" = "ok";
  let detalle = "";
  let papeles = 0, acabados = 0, cotizaciones = 0;
  let cfg = null;

  try {
    [papeles, acabados, cotizaciones] = await Promise.all([
      db.papel.count(), db.acabado.count(), db.cotizacion.count(),
    ]);
    cfg = await cargarConfig();
  } catch (e) {
    detalle = e instanceof Error ? e.message : String(e);
    estado = /does not exist|relation/i.test(detalle) ? "sin-tablas" : "sin-conexion";
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex h-1.5 overflow-hidden rounded-sm">
        <i className="flex-1 bg-cian" />
        <i className="flex-1 bg-magenta" />
        <i className="flex-1 bg-amarillo" />
        <i className="flex-1 bg-tinta" />
      </div>

      <h1 className="mt-6 text-xl font-bold tracking-tight">
        Costos y precios de producción
      </h1>
      <p className="mt-1 text-xs uppercase tracking-widest text-kraft">
        Instalación · Fase 1
      </p>

      {estado === "ok" ? (
        <div className="mt-8 rounded-sm border border-regla bg-hoja">
          <div className="border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest">
            Todo conectado
          </div>
          <dl className="divide-y divide-suave">
            <Fila k="Papeles cargados" v={fmtNum(papeles, 0)} />
            <Fila k="Acabados cargados" v={fmtNum(acabados, 0)} />
            <Fila k="Cotizaciones guardadas" v={fmtNum(cotizaciones, 0)} />
            <Fila k="Tasa BCV" v={cfg ? fmtNum(cfg.tasaBCV, 2) : "—"} />
            <Fila k="Margen por defecto" v={cfg ? `${fmtNum(cfg.margen, 0)}%` : "—"} />
            <Fila
              k="Papel más económico"
              v={
                cfg && cfg.papeles.length
                  ? usd(Math.min(...cfg.papeles.map((p) => p.precio / p.hojas)), 4) + " el pliego"
                  : "—"
              }
            />
          </dl>
        </div>
      ) : (
        <div className="mt-8 rounded-sm border border-[#E8D48A] bg-[#FFF9E6] p-4 text-sm leading-relaxed text-[#5C4A00]">
          <b className="block">
            {estado === "sin-tablas"
              ? "La base responde, pero faltan las tablas"
              : "No hay conexión con la base de datos"}
          </b>
          <p className="mt-1">
            {estado === "sin-tablas" ? (
              <>
                Corre <code className="font-mono">npm run db:migrate</code> y luego{" "}
                <code className="font-mono">npm run db:seed</code>.
              </>
            ) : (
              <>
                Revisa <code className="font-mono">DATABASE_URL</code> en tu archivo{" "}
                <code className="font-mono">.env</code>. Desde tu computadora tiene que ser la
                cadena <b>pública</b> de Railway, la que dice <code className="font-mono">rlwy.net</code>.
              </>
            )}
          </p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-sm bg-white/60 p-2 font-mono text-[11px]">
            {detalle}
          </pre>
        </div>
      )}

      <p className="mt-8 text-xs leading-relaxed text-kraft">
        Esta pantalla es temporal. La reemplaza la calculadora en la Fase 3 del{" "}
        <code className="font-mono">PLAN.md</code>.
      </p>
    </main>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline px-4 py-2.5">
      <dt className="text-sm">{k}</dt>
      <dd className="tabular ml-auto font-mono text-sm font-bold">{v}</dd>
    </div>
  );
}
