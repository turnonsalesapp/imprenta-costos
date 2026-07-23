import { requireRol } from "@/lib/auth";
import { cargarConfig } from "@/lib/config";
import { obtenerConfig } from "@/lib/variables";
import { listarClientesSimple } from "@/lib/clientes";
import { cargarTrabajoEnForm } from "@/lib/trabajos";
import { cargarCotizacionEnForm } from "@/lib/cotizaciones";
import { interpretarActivo } from "@/lib/interpretar";
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
  const usuario = await requireRol("ADMIN", "VENDEDOR");

  const [cfg, clientes, dc, interpretarHabilitado] = await Promise.all([
    cargarConfig(), listarClientesSimple(), obtenerConfig(), interpretarActivo(usuario.id),
  ]);
  const sp = await searchParams;

  let modo: "nueva" | "recotizar" | "copia" | "editar" = "nueva";
  let itemsIniciales: FormCotizacion[] = [nuevoForm(cfg)];

  if (sp.editar) {
    const its = await cargarCotizacionEnForm(sp.editar, "editar");
    if (its?.length) { itemsIniciales = its.map((f) => ({ ...nuevoForm(cfg), ...f })); modo = "editar"; }
  } else if (sp.desde) {
    const its = await cargarCotizacionEnForm(sp.desde, "copia");
    if (its?.length) { itemsIniciales = its.map((f) => ({ ...nuevoForm(cfg), ...f })); modo = "copia"; }
  } else if (sp.trabajo) {
    const t = await cargarTrabajoEnForm(sp.trabajo);
    if (t) { itemsIniciales = [{ ...nuevoForm(cfg), ...t }]; modo = "recotizar"; }
  }

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
        itemsIniciales={itemsIniciales}
        banner={banners[modo]}
        margenMin={dc.margenMin}
        interpretarHabilitado={interpretarHabilitado}
      />
    </>
  );
}
