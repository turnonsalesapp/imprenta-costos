import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { ClienteForm } from "../ClienteForm";

export const dynamic = "force-dynamic";

export default async function NuevoClientePage() {
  await requireRol("ADMIN", "VENDEDOR");

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Link href="/clientes" className="text-sm text-kraft hover:text-tinta">← Clientes</Link>
      </div>
      <header className="mt-3 mb-5">
        <h1 className="text-lg font-bold tracking-tight">Nuevo cliente</h1>
      </header>
      <ClienteForm modo="crear" />
    </>
  );
}
