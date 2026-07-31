import { requireRol } from "@/lib/auth";
import { cargarConfig } from "@/lib/config";
import { obtenerConfig } from "@/lib/variables";
import { listarClientesSimple } from "@/lib/clientes";
import { cargarPersonalizadoEnForm } from "@/lib/cotizaciones";
import { listarProductosPop } from "@/lib/productos-pop";
import { nuevoFormPersonalizado, type FormPersonalizado } from "@/lib/cotizacion-form";
import { PageHeader } from "@/app/_components/ui";
import { CalculadoraPersonalizado } from "./CalculadoraPersonalizado";

export const dynamic = "force-dynamic";

/**
 * Cotización de PERSONALIZADOS / Material POP (tercerizada). Solo ADMIN/VENDEDOR.
 * Chapas, llaveros, bolígrafos, DTF, sublimación y corte láser: el costo del
 * proveedor (por escala de cantidad o por metro lineal) pasa por el mismo
 * diferencial y margen. ?desde=<id> duplica, ?editar=<id> edita un borrador.
 */
export default async function CotizarPersonalizadoPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; editar?: string }>;
}) {
  await requireRol("ADMIN", "VENDEDOR");
  const [cfg, clientes, dc, productos] = await Promise.all([
    cargarConfig(), listarClientesSimple(), obtenerConfig(), listarProductosPop(),
  ]);
  const sp = await searchParams;

  let cargado: Partial<FormPersonalizado> | null = null;
  let modo: "nueva" | "copia" | "editar" = "nueva";
  if (sp.editar) {
    cargado = await cargarPersonalizadoEnForm(sp.editar, "editar");
    if (cargado) modo = "editar";
  } else if (sp.desde) {
    cargado = await cargarPersonalizadoEnForm(sp.desde, "copia");
    if (cargado) modo = "copia";
  }

  const formInicial: FormPersonalizado = { ...nuevoFormPersonalizado(cfg), ...(cargado ?? {}) };
  const banners = {
    nueva: "",
    copia: "Copiada de otra cotización · revisa y guarda como nueva",
    editar: "Editando un borrador · al guardar se actualiza esta misma cotización",
  };

  return (
    <>
      <PageHeader
        title={modo === "editar" ? "Editar cotización personalizada" : "Cotización de personalizados"}
        eyebrow="Material POP tercerizado · chapas, llaveros, DTF, sublimación, láser"
      />

      <div className="mt-8">
        {productos.length === 0 ? (
          <div className="rounded-sm border border-regla bg-hoja px-4 py-8 text-center text-sm text-kraft">
            No hay productos personalizados cargados. Un administrador los agrega en <b>Variables</b>.
          </div>
        ) : (
          <CalculadoraPersonalizado
            cfg={cfg}
            clientes={clientes}
            productos={productos}
            formInicial={formInicial}
            banner={banners[modo]}
            margenMin={dc.margenMin}
          />
        )}
      </div>
    </>
  );
}
