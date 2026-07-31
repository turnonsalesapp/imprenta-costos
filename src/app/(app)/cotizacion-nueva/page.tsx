import { requireRol } from "@/lib/auth";
import { cargarConfig } from "@/lib/config";
import { obtenerConfig } from "@/lib/variables";
import { listarClientesSimple } from "@/lib/clientes";
import { listarEquipos } from "@/lib/equipos";
import { listarMaterialesGF } from "@/lib/materiales-gf";
import { listarProductosGF } from "@/lib/productos-gf";
import { listarProductosPop } from "@/lib/productos-pop";
import { interpretarActivo } from "@/lib/interpretar";
import { cargarTrabajoEnForm } from "@/lib/trabajos";
import { nuevoForm } from "@/lib/cotizacion-form";
import { tiposQuePuedeCotizar } from "@/lib/roles";
import { Cotizador } from "./Cotizador";

export const dynamic = "force-dynamic";

/**
 * Cotizador unificado (Ruta B): un solo lugar para armar cualquier cotización.
 * Se elige el tipo de cada ítem (digital, offset, proveedor, gran formato,
 * personalizado), se agrega, y se pueden mezclar tipos y cantidades. Un solo
 * guardado. Editar/copiar cualquier cotización carga sus ítems aquí.
 */
export default async function CotizacionNuevaPage({
  searchParams,
}: {
  searchParams: Promise<{ trabajo?: string }>;
}) {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  const [cfg, clientes, dc, equipos, materialesGF, productosGF, productosPop, interpretarHabilitado] = await Promise.all([
    cargarConfig(), listarClientesSimple(), obtenerConfig(), listarEquipos(),
    listarMaterialesGF(), listarProductosGF(), listarProductosPop(), interpretarActivo(usuario.id),
  ]);

  const offDefaults = {
    plancha: dc.offPlancha, planchaMedio: dc.offPlanchaMedio, planchaPliego: dc.offPlanchaPliego,
    arranque: dc.offArranque, millar: dc.offMillar, tinta: dc.offTinta,
  };

  // Recotizar desde una plantilla (trabajo repetido): abre el editor digital
  // ya prellenado con la receta y las tasas de hoy.
  const tiposPermitidos = tiposQuePuedeCotizar(usuario);
  const sp = await searchParams;
  let abrirInicial: Parameters<typeof Cotizador>[0]["abrirInicial"] = undefined;
  if (sp.trabajo && tiposPermitidos.includes("PROPIA")) {
    const t = await cargarTrabajoEnForm(sp.trabajo);
    if (t) {
      abrirInicial = {
        tipo: "PROPIA",
        form: { ...nuevoForm(cfg), ...t },
        meta: { cliente: t.cliente ?? "", clienteId: t.clienteId ?? "", trabajo: t.trabajo ?? "" },
      };
    }
  }

  return (
    <>
      <header className="mb-5">
        <h1 className="text-lg font-bold tracking-tight">Nueva cotización</h1>
        <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">Un solo documento · ítems de cualquier tipo</p>
      </header>
      <Cotizador
        cfg={cfg}
        clientes={clientes}
        equipos={equipos}
        materialesGF={materialesGF}
        productosGF={productosGF}
        productosPop={productosPop}
        offDefaults={offDefaults}
        ojeteCosto={dc.gfOjeteCosto}
        ojeteCm={dc.gfOjeteCm}
        margenMin={dc.margenMin}
        interpretarHabilitado={interpretarHabilitado}
        tiposPermitidos={tiposPermitidos}
        abrirInicial={abrirInicial}
      />
    </>
  );
}
