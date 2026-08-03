import { requireRol } from "@/lib/auth";
import { cargarConfig } from "@/lib/config";
import { obtenerConfig } from "@/lib/variables";
import { listarClientesSimple } from "@/lib/clientes";
import { cargarGranFormatoEnForm } from "@/lib/cotizaciones";
import { listarMaterialesGF } from "@/lib/materiales-gf";
import { listarProductosGF } from "@/lib/productos-gf";
import { puedeVerEstructura } from "@/lib/roles";
import { nuevoFormGranFormato, type FormGranFormato } from "@/lib/cotizacion-form";
import { PageHeader } from "@/app/_components/ui";
import { CalculadoraGranFormato } from "./CalculadoraGranFormato";

export const dynamic = "force-dynamic";

/**
 * Cotización de impresión de GRAN FORMATO (tercerizada). Solo ADMIN/VENDEDOR.
 * El costo del material (por m²) sale del catálogo y se le aplica el mismo
 * diferencial y margen. ?desde=<id> duplica, ?editar=<id> edita un borrador.
 */
export default async function CotizarGranFormatoPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; editar?: string }>;
}) {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  const [cfg, clientes, dc, materiales, productos] = await Promise.all([
    cargarConfig(), listarClientesSimple(), obtenerConfig(), listarMaterialesGF(), listarProductosGF(),
  ]);
  const sp = await searchParams;

  let cargado: Partial<FormGranFormato> | null = null;
  let modo: "nueva" | "copia" | "editar" = "nueva";
  if (sp.editar) {
    cargado = await cargarGranFormatoEnForm(sp.editar, "editar");
    if (cargado) modo = "editar";
  } else if (sp.desde) {
    cargado = await cargarGranFormatoEnForm(sp.desde, "copia");
    if (cargado) modo = "copia";
  }

  const formInicial: FormGranFormato = { ...nuevoFormGranFormato(cfg), ...(cargado ?? {}) };
  const banners = {
    nueva: "",
    copia: "Copiada de otra cotización · revisa y guarda como nueva",
    editar: "Editando un borrador · al guardar se actualiza esta misma cotización",
  };

  return (
    <>
      <PageHeader
        title={modo === "editar" ? "Editar cotización de gran formato" : "Cotización de gran formato"}
        eyebrow="Impresión por m² o producto terminado · tercerizado"
      />

      <div className="mt-8">
        {materiales.length === 0 && productos.length === 0 ? (
          <div className="rounded-sm border border-regla bg-hoja px-4 py-8 text-center text-sm text-kraft">
            No hay materiales ni productos de gran formato cargados. Un administrador los agrega en <b>Variables</b>.
          </div>
        ) : (
          <CalculadoraGranFormato
            cfg={cfg}
            clientes={clientes}
            materiales={materiales}
            productos={productos}
            ojeteCosto={dc.gfOjeteCosto}
            ojeteCm={dc.gfOjeteCm}
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
