import { requireRol } from "@/lib/auth";
import { ClienteForm } from "../ClienteForm";
import { PageHeader } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export default async function NuevoClientePage() {
  await requireRol("ADMIN", "VENDEDOR");

  return (
    <>
      <PageHeader title="Nuevo cliente" back={{ href: "/clientes", label: "Clientes" }} />
      <div className="mt-8">
        <ClienteForm modo="crear" />
      </div>
    </>
  );
}
