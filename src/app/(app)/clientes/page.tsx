import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { listarClientes } from "@/lib/clientes";

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
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Clientes</h1>
          <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">
            {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
          </p>
        </div>
        <Link href="/clientes/nuevo" className="rounded-sm bg-tinta px-3 py-2 text-sm font-bold text-hoja hover:opacity-90">
          Nuevo cliente
        </Link>
      </header>

      <form method="get" className="mt-5 flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Buscar</span>
          <input name="q" defaultValue={q} placeholder="Nombre, RIF o contacto"
            className="mt-1 block w-64 rounded-sm border border-regla bg-hoja px-3 py-1.5 text-sm outline-none focus:border-cian" />
        </label>
        <button type="submit" className="rounded-sm border border-regla px-3 py-1.5 text-sm font-medium hover:border-tinta">
          Buscar
        </button>
        {q && (
          <Link href="/clientes" className="px-1 py-1.5 text-sm text-kraft underline hover:text-tinta">Limpiar</Link>
        )}
      </form>

      {clientes.length === 0 ? (
        <div className="mt-6 rounded-sm border border-regla bg-hoja px-4 py-12 text-center">
          <b className="block text-sm">{q ? "Ningún resultado" : "Todavía no hay clientes"}</b>
          <p className="mt-1 text-sm text-kraft">
            {q ? "Prueba con otro término." : "Crea el primero para empezar a llevar su histórico."}
          </p>
        </div>
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
