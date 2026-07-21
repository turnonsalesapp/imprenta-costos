import { requireRol } from "@/lib/auth";
import { cargarConfig } from "@/lib/config";
import { obtenerConfig } from "@/lib/variables";
import { listarClientesSimple } from "@/lib/clientes";
import { cargarTrabajoEnForm } from "@/lib/trabajos";
import { cargarCotizacionEnForm } from "@/lib/cotizaciones";
import { nuevoForm, type FormCotizacion } from "@/lib/cotizacion-form";
import { Calculadora } from "./Calculadora";

export const dynamic = "force-dynamic";

/**
 * Nueva cotización (solo ADMIN/VENDEDOR). Puede arrancar en blanco, o precargada:
 *  - ?trabajo=<id>  recotiza un trabajo repetido con las tasas de hoy
 *  - ?desde=<id>    duplica una cotización como base para una nueva
 *  - ?editar=<id>   edita una cotización que sigue en borrador
 */
export default async function CotizarPage({
  searchParams,
}: {
  searchParams: Promise<{ trabajo?: string; desde?: string; editar?: string }>;
}) {
  await requireRol("ADMIN", "VENDEDOR");

  const [cfg, clientes, dc] = await Promise.all([
    cargarConfig(), listarClientesSimple(), obtenerConfig(),
  ]);
  const sp = await searchParams;

  let cargado: Partial<FormCotizacion> | null = null;
  let modo: "nueva" | "recotizar" | "copia" | "editar" = "nueva";

  if (sp.editar) {
    cargado = await cargarCotizacionEnForm(sp.editar, "editar");
    if (cargado) modo = "editar";
  } else if (sp.desde) {
    cargado = await cargarCotizacionEnForm(sp.desde, "copia");
    if (cargado) modo = "copia";
  } else if (sp.trabajo) {
    cargado = await cargarTrabajoEnForm(sp.trabajo);
    if (cargado) modo = "recotizar";
  }

  const formInicial: FormCotizacion = { ...nuevoForm(cfg), ...(cargado ?? {}) };

  const titulos: Record<typeof modo, string> = {
    nueva: "Nueva cotización",
    recotizar: "Recotizar trabajo",
    copia: "Nueva cotización (copiada)",
    editar: "Editar borrador",
  };
  const banners: Record<typeof modo, string> = {
    nueva: "",
    recotizar: "Receta cargada · con las tasas de hoy",
    copia: "Copiada de otra cotización · revisa y guarda como nueva",
    editar: "Editando un borrador · al guardar se actualiza esta misma cotización",
  };

  return (
    <>
      <header className="mb-5">
        <h1 className="text-lg font-bold tracking-tight">{titulos[modo]}</h1>
        <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">Calculadora</p>
      </header>

      <Calculadora
        cfg={cfg}
        clientes={clientes}
        formInicial={formInicial}
        banner={banners[modo]}
        margenMin={dc.margenMin}
      />
    </>
  );
}
