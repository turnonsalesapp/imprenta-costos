import { requireRol } from "@/lib/auth";
import { cargarConfig } from "@/lib/config";
import { obtenerConfig } from "@/lib/variables";
import { listarClientesSimple } from "@/lib/clientes";
import { cargarGranFormatoEnForm } from "@/lib/cotizaciones";
import { listarMaterialesGF } from "@/lib/materiales-gf";
import { nuevoFormGranFormato, type FormGranFormato } from "@/lib/cotizacion-form";
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
  await requireRol("ADMIN", "VENDEDOR");
  const [cfg, clientes, dc, materiales] = await Promise.all([
    cargarConfig(), listarClientesSimple(), obtenerConfig(), listarMaterialesGF(),
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
      <header className="mb-5">
        <h1 className="text-lg font-bold tracking-tight">
          {modo === "editar" ? "Editar cotización de gran formato" : "Cotización de gran formato"}
        </h1>
        <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">Impresión tercerizada · por m²</p>
      </header>

      {materiales.length === 0 ? (
        <div className="rounded-sm border border-regla bg-hoja px-4 py-8 text-center text-sm text-kraft">
          No hay materiales de gran formato cargados. Un administrador los agrega en <b>Variables</b>.
        </div>
      ) : (
        <CalculadoraGranFormato
          cfg={cfg}
          clientes={clientes}
          materiales={materiales}
          ojeteCosto={dc.gfOjeteCosto}
          ojeteCm={dc.gfOjeteCm}
          formInicial={formInicial}
          banner={banners[modo]}
          margenMin={dc.margenMin}
        />
      )}
    </>
  );
}
