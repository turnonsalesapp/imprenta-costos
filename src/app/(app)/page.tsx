import Link from "next/link";
import { requireUsuario } from "@/lib/auth";
import { cargarResumen } from "@/lib/resumen";
import { ETIQUETA_ROL, puedeCotizar } from "@/lib/roles";
import { fmtNum, usd } from "@/lib/calculo";
import { PageHeader, SectionTitle, KPI } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

/**
 * Inicio. El contenido lo decide el rol EN EL SERVIDOR: `cargarResumen` para
 * TALLER no consulta ni devuelve precios, así que esta página tampoco los puede
 * pintar. No hay ramas ocultas en el cliente.
 */
export default async function Inicio() {
  const usuario = await requireUsuario();
  const resumen = await cargarResumen(usuario);

  return (
    <>
      <PageHeader title={`Hola, ${usuario.nombre.split(" ")[0]}`} eyebrow={ETIQUETA_ROL[usuario.rol]} />

      {resumen.rol === "TALLER" ? (
        // ── Vista de taller: solo producción, sin un solo número de dinero ──
        <section className="mt-8">
          <SectionTitle acento="bg-cian">Órdenes de producción</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            <KPI k="Pendientes" v={fmtNum(resumen.ordenes.pendientes, 0)} />
            <KPI k="En proceso" v={fmtNum(resumen.ordenes.enProceso, 0)} />
            <KPI k="Terminadas" v={fmtNum(resumen.ordenes.terminadas, 0)} />
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
            <SectionTitle acento="bg-cian">Catálogo y cotizaciones</SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KPI k="Papeles" v={fmtNum(resumen.papeles, 0)} />
              <KPI k="Acabados" v={fmtNum(resumen.acabados, 0)} />
              <KPI k="Cotizaciones" v={fmtNum(resumen.cotizaciones, 0)} />
              <KPI k="Órdenes activas" v={fmtNum(resumen.ordenes.pendientes + resumen.ordenes.enProceso, 0)} />
            </div>
          </section>

          <section className="mt-6">
            <SectionTitle acento="bg-magenta">Precios del día</SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KPI k="Tasa BCV" v={fmtNum(resumen.precios.tasaBCV, 2)} />
              {/* Margen y costo por pliego son estructura de costos: solo si la ve. */}
              {resumen.precios.margen != null && (
                <KPI k="Margen por defecto" v={`${fmtNum(resumen.precios.margen, 0)}%`} />
              )}
              {resumen.precios.pliegoMasBarato != null && (
                <KPI k="Pliego más barato" v={usd(resumen.precios.pliegoMasBarato, 4)} />
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
