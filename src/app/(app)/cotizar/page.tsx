import { requireRol } from "@/lib/auth";
import { cargarConfig } from "@/lib/config";
import { listarClientesSimple } from "@/lib/clientes";
import { cargarTrabajoEnForm } from "@/lib/trabajos";
import { nuevoForm } from "@/lib/cotizacion-form";
import { Calculadora } from "./Calculadora";

export const dynamic = "force-dynamic";

/**
 * Nueva cotización. Solo ADMIN y VENDEDOR (TALLER no cotiza). La configuración
 * se carga en el servidor y se pasa a la calculadora para el cálculo en vivo;
 * al guardar, el servidor recalcula y congela por su cuenta.
 *
 * Con `?trabajo=<id>` recotiza: precarga la receta guardada, pero con las tasas
 * y precios de HOY (que salen de `nuevoForm(cfg)`).
 */
export default async function CotizarPage({
  searchParams,
}: {
  searchParams: Promise<{ trabajo?: string }>;
}) {
  await requireRol("ADMIN", "VENDEDOR");

  const [cfg, clientes] = await Promise.all([cargarConfig(), listarClientesSimple()]);
  const sp = await searchParams;

  let formInicial = nuevoForm(cfg);
  let recotizado = false;
  if (sp.trabajo) {
    const receta = await cargarTrabajoEnForm(sp.trabajo);
    if (receta) {
      formInicial = { ...nuevoForm(cfg), ...receta };
      recotizado = true;
    }
  }

  return (
    <>
      <header className="mb-5">
        <h1 className="text-lg font-bold tracking-tight">
          {recotizado ? "Recotizar trabajo" : "Nueva cotización"}
        </h1>
        <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">
          {recotizado ? "Receta cargada · tasas de hoy" : "Calculadora"}
        </p>
      </header>

      <Calculadora cfg={cfg} clientes={clientes} formInicial={formInicial} recotizado={recotizado} />
    </>
  );
}
