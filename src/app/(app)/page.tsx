import Link from "next/link";
import { requireUsuario } from "@/lib/auth";
import { cargarResumen } from "@/lib/resumen";
import { ETIQUETA_ROL, puedeCotizar } from "@/lib/roles";
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
      <header className="border-b border-regla pb-5">
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
          <Titulo acento="bg-cian">Órdenes de producción</Titulo>
          <div className="grid grid-cols-3 gap-3">
            <Tarjeta k="Pendientes" v={fmtNum(resumen.ordenes.pendientes, 0)} />
            <Tarjeta k="En proceso" v={fmtNum(resumen.ordenes.enProceso, 0)} />
            <Tarjeta k="Terminadas" v={fmtNum(resumen.ordenes.terminadas, 0)} />
          </div>
          <Link
            href="/taller"
            className="mt-5 inline-block rounded-sm bg-tinta px-4 py-2 text-sm font-bold text-hoja hover:opacity-90"
          >
            Abrir tablero del taller →
          </Link>
          <p className="mt-3 text-xs leading-relaxed text-kraft">
            Tu usuario nunca ve costos, márgenes ni precios.
          </p>
        </section>
      ) : (
        // ── Vista con precios: ADMIN y VENDEDOR ──
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {puedeCotizar(usuario) && (
              <Link
                href="/cotizacion-nueva"
                className="rounded-sm bg-tinta px-4 py-2 text-sm font-bold text-hoja hover:opacity-90"
              >
                Nueva cotización
              </Link>
            )}
            <Link
              href="/cotizaciones"
              className="rounded-sm border border-regla px-4 py-2 text-sm font-medium text-kraft hover:border-tinta hover:text-tinta"
            >
              Ver cotizaciones
            </Link>
          </div>

          <section className="mt-8">
            <Titulo acento="bg-cian">Catálogo y cotizaciones</Titulo>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tarjeta k="Papeles" v={fmtNum(resumen.papeles, 0)} />
              <Tarjeta k="Acabados" v={fmtNum(resumen.acabados, 0)} />
              <Tarjeta k="Cotizaciones" v={fmtNum(resumen.cotizaciones, 0)} />
              <Tarjeta k="Órdenes activas" v={fmtNum(resumen.ordenes.pendientes + resumen.ordenes.enProceso, 0)} />
            </div>
          </section>

          <section className="mt-6">
            <Titulo acento="bg-magenta">Precios del día</Titulo>
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

/**
 * Rótulo de sección con marca de registro CMYK (acento pequeño, según la skill de
 * diseño: color con cuentagotas, nunca relleno grande).
 */
function Titulo({ children, acento = "bg-cian" }: { children: React.ReactNode; acento?: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
      <span className={`h-2 w-2 rounded-[2px] ${acento}`} />
      {children}
    </h2>
  );
}

function Tarjeta({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-sm border border-regla bg-hoja p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">{k}</div>
      <div className="tabular mt-1.5 font-mono text-xl font-bold">{v}</div>
    </div>
  );
}
