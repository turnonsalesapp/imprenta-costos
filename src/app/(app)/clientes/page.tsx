import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { listarClientes } from "@/lib/clientes";
import { PageHeader, EmptyState } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRol("ADMIN", "VENDEDOR");
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const clientes = await listarClientes(q);

  return (
    <>
      <PageHeader
        title="Clientes"
        eyebrow={`${clientes.length} ${clientes.length === 1 ? "cliente" : "clientes"}`}
      >
        <Link href="/clientes/nuevo" className="rounded-sm bg-tinta px-3 py-2 text-sm font-bold text-hoja hover:opacity-90">
          Nuevo cliente
        </Link>
      </PageHeader>

      <form method="get" className="mt-8 flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Buscar</span>
          <input name="q" defaultValue={q} placeholder="Nombre, RIF o contacto"
            className="mt-1 block w-full rounded-sm border border-regla bg-hoja px-3 py-1.5 text-base outline-none focus:border-cian sm:w-64 sm:text-sm" />
        </label>
        <button type="submit" className="rounded-sm border border-regla px-3 py-1.5 text-sm font-medium hover:border-tinta">
          Buscar
        </button>
        {q && (
          <Link href="/clientes" className="px-1 py-1.5 text-sm text-kraft underline hover:text-tinta">Limpiar</Link>
        )}
      </form>

      {clientes.length === 0 ? (
        <EmptyState title={q ? "Ningún resultado" : "Todavía no hay clientes"}>
          {q ? "Prueba con otro término." : "Crea el primero para empezar a llevar su histórico."}
        </EmptyState>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-sm border border-regla bg-hoja">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-regla bg-suave text-left text-[10px] uppercase tracking-widest text-kraft">
                <th className="px-4 py-2 font-bold">Nombre</th>
                <th className="px-4 py-2 font-bold">RIF</th>
                <th className="px-4 py-2 font-bold">Teléfono</th>
                <th className="px-4 py-2 text-right font-bold">Cotizaciones</th>
                <th className="px-4 py-2 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-suave">
              {clientes.map((c) => (
                <tr key={c.id} className={`hover:bg-suave ${c.activo ? "" : "opacity-50"}`}>
                  <td className="px-4 py-2.5">
                    <Link href={`/clientes/${c.id}`} className="font-medium hover:text-cian">{c.nombre}</Link>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[13px] text-kraft">{c.rif ?? "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-[13px] text-kraft">{c.telefono ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{c.cotizaciones}</td>
                  <td className="px-4 py-2.5">
                    <span className={c.activo ? "text-xs font-medium text-exito" : "text-xs font-medium text-kraft"}>
                      {c.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
