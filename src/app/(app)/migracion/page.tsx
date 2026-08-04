import { requireRol } from "@/lib/auth";
import { contarTransaccional } from "@/lib/migracion";
import { PageHeader } from "@/app/_components/ui";
import { PanelMigracion } from "./PanelMigracion";

export const dynamic = "force-dynamic";

export default async function MigracionPage() {
  await requireRol("ADMIN");
  const conteos = await contarTransaccional();

  return (
    <>
      <PageHeader title="Migración inicial" eyebrow="Solo administración · una vez" />
      <p className="mt-3 max-w-2xl text-sm text-kraft">
        Prepara el sistema desde el navegador, sin terminal: borra los datos de prueba e importa
        los tableros de Trello (exporta cada tablero en Trello como <b>JSON</b> y súbelo aquí). Sigue
        los pasos en orden. Cada importación te deja previsualizar antes de aplicar.
      </p>
      <PanelMigracion conteos={conteos} />
    </>
  );
}
