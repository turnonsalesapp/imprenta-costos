import { requireRol } from "@/lib/auth";
import { cargarConfig } from "@/lib/config";
import { obtenerConfig } from "@/lib/variables";
import { listarClientesSimple } from "@/lib/clientes";
import { cargarProveedorEnForm } from "@/lib/cotizaciones";
import { nuevoFormProveedor, type FormProveedor } from "@/lib/cotizacion-form";
import { CalculadoraProveedor } from "./CalculadoraProveedor";

export const dynamic = "force-dynamic";

/**
 * Cotización de un trabajo tercerizado a un proveedor. Solo ADMIN/VENDEDOR.
 * Se parte del costo del proveedor y se aplica el mismo diferencial y margen.
 * Con ?desde=<id> duplica y con ?editar=<id> edita un borrador de proveedor.
 */
export default async function CotizarProveedorPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; editar?: string }>;
}) {
  await requireRol("ADMIN", "VENDEDOR");
  const [cfg, clientes, dc] = await Promise.all([
    cargarConfig(), listarClientesSimple(), obtenerConfig(),
  ]);
  const sp = await searchParams;

  let cargado: Partial<FormProveedor> | null = null;
  let modo: "nueva" | "copia" | "editar" = "nueva";
  if (sp.editar) {
    cargado = await cargarProveedorEnForm(sp.editar, "editar");
    if (cargado) modo = "editar";
  } else if (sp.desde) {
    cargado = await cargarProveedorEnForm(sp.desde, "copia");
    if (cargado) modo = "copia";
  }

  const formInicial: FormProveedor = { ...nuevoFormProveedor(cfg), ...(cargado ?? {}) };
  const banners = {
    nueva: "",
    copia: "Copiada de otra cotización de proveedor · revisa y guarda como nueva",
    editar: "Editando un borrador · al guardar se actualiza esta misma cotización",
  };

  return (
    <>
      <header className="mb-5">
        <h1 className="text-lg font-bold tracking-tight">
          {modo === "editar" ? "Editar cotización de proveedor" : "Cotización de proveedor"}
        </h1>
        <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">Trabajo tercerizado</p>
      </header>

      <CalculadoraProveedor
        cfg={cfg}
        clientes={clientes}
        formInicial={formInicial}
        banner={banners[modo]}
        margenMin={dc.margenMin}
      />
    </>
  );
}
