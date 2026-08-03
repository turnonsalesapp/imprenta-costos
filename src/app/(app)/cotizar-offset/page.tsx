import { requireRol } from "@/lib/auth";
import { cargarConfig } from "@/lib/config";
import { obtenerConfig } from "@/lib/variables";
import { listarClientesSimple } from "@/lib/clientes";
import { cargarOffsetEnForm } from "@/lib/cotizaciones";
import { listarEquipos } from "@/lib/equipos";
import { puedeVerEstructura } from "@/lib/roles";
import { nuevoFormOffset, type FormOffset } from "@/lib/cotizacion-form";
import { PageHeader } from "@/app/_components/ui";
import { CalculadoraOffset } from "./CalculadoraOffset";

export const dynamic = "force-dynamic";

/**
 * Cotización de OFFSET (producción propia). Solo ADMIN/VENDEDOR. El motor suma
 * papel + planchas + arranque + impresión por millar + acabados, y pasa por el
 * mismo diferencial y margen. Al aprobarse genera orden de taller.
 * ?desde=<id> duplica, ?editar=<id> edita un borrador.
 */
export default async function CotizarOffsetPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; editar?: string }>;
}) {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  const [cfg, clientes, dc, equipos] = await Promise.all([
    cargarConfig(), listarClientesSimple(), obtenerConfig(), listarEquipos(),
  ]);
  const sp = await searchParams;
  const offDefaults = {
    plancha: dc.offPlancha, planchaMedio: dc.offPlanchaMedio, planchaPliego: dc.offPlanchaPliego,
    arranque: dc.offArranque, millar: dc.offMillar, tinta: dc.offTinta,
  };

  let cargado: Partial<FormOffset> | null = null;
  let modo: "nueva" | "copia" | "editar" = "nueva";
  if (sp.editar) {
    cargado = await cargarOffsetEnForm(sp.editar, "editar");
    if (cargado) modo = "editar";
  } else if (sp.desde) {
    cargado = await cargarOffsetEnForm(sp.desde, "copia");
    if (cargado) modo = "copia";
  }

  const formInicial: FormOffset = { ...nuevoFormOffset(cfg, offDefaults), ...(cargado ?? {}) };
  const banners = {
    nueva: "",
    copia: "Copiada de otra cotización · revisa y guarda como nueva",
    editar: "Editando un borrador · al guardar se actualiza esta misma cotización",
  };

  return (
    <>
      <PageHeader
        title={modo === "editar" ? "Editar cotización offset" : "Cotización de offset"}
        eyebrow="Producción propia · planchas + arranque + tiraje por millar"
      />

      <div className="mt-8">
        {cfg.papeles.length === 0 ? (
          <div className="rounded-sm border border-regla bg-hoja px-4 py-8 text-center text-sm text-kraft">
            No hay papeles cargados. Un administrador los agrega en <b>Variables</b>.
          </div>
        ) : (
          <CalculadoraOffset
            cfg={cfg}
            clientes={clientes}
            equipos={equipos}
            offDefaults={offDefaults}
            formInicial={formInicial}
            banner={banners[modo]}
            margenMin={dc.margenMin}
            verEstructura={puedeVerEstructura(usuario)}
          />
        )}
      </div>
    </>
  );
}
