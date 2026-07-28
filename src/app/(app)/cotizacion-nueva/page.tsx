import { requireRol } from "@/lib/auth";
import { RevisarCotizacion } from "./RevisarCotizacion";

export const dynamic = "force-dynamic";

/** Revisión del borrador de cotización mixta (ítems de varios tipos) y guardado. */
export default async function CotizacionNuevaPage() {
  await requireRol("ADMIN", "VENDEDOR");
  return (
    <>
      <header className="mb-5">
        <h1 className="text-lg font-bold tracking-tight">Cotización en construcción</h1>
        <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">Ítems de varios tipos en un solo documento</p>
      </header>
      <RevisarCotizacion />
    </>
  );
}
