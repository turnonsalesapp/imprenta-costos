import { requireUsuario } from "@/lib/auth";
import { cargarResumen } from "@/lib/resumen";
import { ETIQUETA_ROL } from "@/lib/roles";
import { fmtNum, usd } from "@/lib/calculo";

export const dynamic = "force-dynamic";

/**
 * Inicio. El contenido lo decide el rol EN EL SERVIDOR: `cargarResumen` para
 * TALLER no consulta ni devuelve precios, así que esta página tampoco los puede
 * pintar. No hay ramas ocultas en el cliente.
 */
export default async function Inicio() {
  const usuario = await requireUsuario();
  const resumen = await cargarResumen(usuario.rol);

  return (
    <>
      <header>
        <h1 className="text-lg font-bold tracking-tight">
          Hola, {usuario.nombre.split(" ")[0]}
        </h1>
        <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">
          {ETIQUETA_ROL[usuario.rol]}
        </p>
      </header>

      {resumen.rol === "TALLER" ? (
        // ── Vista de taller: solo producción, sin un solo número de dinero ──
        <section className="mt-8">
          <Titulo>Órdenes de producción</Titulo>
          <div className="grid grid-cols-3 gap-3">
            <Tarjeta k="Pendientes" v={fmtNum(resumen.ordenes.pendientes, 0)} />
            <Tarjeta k="En proceso" v={fmtNum(resumen.ordenes.enProceso, 0)} />
            <Tarjeta k="Terminadas" v={fmtNum(resumen.ordenes.terminadas, 0)} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-kraft">
            El tablero del taller con las órdenes por entregar llega en la Fase 5.
            Tu usuario nunca ve costos, márgenes ni precios.
          </p>
        </section>
      ) : (
        // ── Vista con precios: ADMIN y VENDEDOR ──
        <>
          <section className="mt-8">
            <Titulo>Catálogo y cotizaciones</Titulo>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tarjeta k="Papeles" v={fmtNum(resumen.papeles, 0)} />
              <Tarjeta k="Acabados" v={fmtNum(resumen.acabados, 0)} />
              <Tarjeta k="Cotizaciones" v={fmtNum(resumen.cotizaciones, 0)} />
              <Tarjeta k="Órdenes activas" v={fmtNum(resumen.ordenes.pendientes + resumen.ordenes.enProceso, 0)} />
            </div>
          </section>

          <section className="mt-6">
            <Titulo>Precios del día</Titulo>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Tarjeta k="Tasa BCV" v={fmtNum(resumen.precios.tasaBCV, 2)} />
              <Tarjeta k="Margen por defecto" v={`${fmtNum(resumen.precios.margen, 0)}%`} />
              <Tarjeta k="Pliego más barato" v={usd(resumen.precios.pliegoMasBarato, 4)} />
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
      {children}
    </h2>
  );
}

function Tarjeta({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-sm border border-regla bg-hoja px-3 py-3">
      <div className="text-[11px] text-kraft">{k}</div>
      <div className="tabular mt-1 font-mono text-lg font-bold">{v}</div>
    </div>
  );
}
