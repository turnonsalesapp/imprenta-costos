import { requireRol } from "@/lib/auth";
import { cargarConfig } from "@/lib/config";
import { Calculadora } from "./Calculadora";

export const dynamic = "force-dynamic";

/**
 * Nueva cotización. Solo ADMIN y VENDEDOR (TALLER no cotiza). La configuración
 * se carga en el servidor y se pasa a la calculadora para el cálculo en vivo;
 * al guardar, el servidor recalcula y congela por su cuenta.
 */
export default async function CotizarPage() {
  await requireRol("ADMIN", "VENDEDOR");
  const cfg = await cargarConfig();

  return (
    <>
      <header className="mb-5">
        <h1 className="text-lg font-bold tracking-tight">Nueva cotización</h1>
        <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">
          Calculadora
        </p>
      </header>

      <Calculadora cfg={cfg} />
    </>
  );
}
