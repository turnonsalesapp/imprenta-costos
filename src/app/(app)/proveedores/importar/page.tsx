import { requireRol } from "@/lib/auth";
import { listarProveedores } from "@/lib/proveedores";
import { PageHeader } from "@/app/_components/ui";
import { ImportadorLista } from "./ImportadorLista";

export const dynamic = "force-dynamic";

export default async function ImportarProveedoresPage() {
  await requireRol("ADMIN");
  const proveedores = await listarProveedores();

  return (
    <>
      <PageHeader
        title="Importar lista de precios"
        eyebrow="Previsualiza el diff antes de aplicar"
        back={{ href: "/proveedores", label: "Proveedores" }}
      />

      <div className="mt-8">
        <ImportadorLista
          proveedores={proveedores.map((p) => ({ id: p.id, nombre: p.nombre }))}
        />
      </div>
    </>
  );
}
