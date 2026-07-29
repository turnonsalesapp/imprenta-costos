import { requireRol } from "@/lib/auth";
import { cargarConfig } from "@/lib/config";
import { obtenerConfig } from "@/lib/variables";
import { listarClientesSimple } from "@/lib/clientes";
import { listarEquipos } from "@/lib/equipos";
import { listarMaterialesGF } from "@/lib/materiales-gf";
import { listarProductosGF } from "@/lib/productos-gf";
import { listarProductosPop } from "@/lib/productos-pop";
import { interpretarActivo } from "@/lib/interpretar";
import { Cotizador } from "./Cotizador";

export const dynamic = "force-dynamic";

/**
 * Cotizador unificado (Ruta B): un solo lugar para armar cualquier cotización.
 * Se elige el tipo de cada ítem (digital, offset, proveedor, gran formato,
 * personalizado), se agrega, y se pueden mezclar tipos y cantidades. Un solo
 * guardado. Editar/copiar cualquier cotización carga sus ítems aquí.
 */
export default async function CotizacionNuevaPage() {
  const usuario = await requireRol("ADMIN", "VENDEDOR");
  const [cfg, clientes, dc, equipos, materialesGF, productosGF, productosPop, interpretarHabilitado] = await Promise.all([
    cargarConfig(), listarClientesSimple(), obtenerConfig(), listarEquipos(),
    listarMaterialesGF(), listarProductosGF(), listarProductosPop(), interpretarActivo(usuario.id),
  ]);

  const offDefaults = {
    plancha: dc.offPlancha, planchaMedio: dc.offPlanchaMedio, planchaPliego: dc.offPlanchaPliego,
    arranque: dc.offArranque, millar: dc.offMillar, tinta: dc.offTinta,
  };

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
      />
    </>
  );
}
