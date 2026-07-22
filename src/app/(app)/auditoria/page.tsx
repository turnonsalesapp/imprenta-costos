import { requireRol } from "@/lib/auth";
import { listarAuditoria } from "@/lib/auditoria";

export const dynamic = "force-dynamic";

const ETIQUETA_ACCION: Record<string, string> = {
  "cotizacion.estado": "Estado de cotización",
  "usuario.rol": "Cambio de rol",
  "usuario.activo": "Activación de usuario",
  "usuario.interpretarIA": "Interpretar IA (usuario)",
};

/** Bitácora de operaciones sensibles. Solo ADMIN. */
export default async function AuditoriaPage() {
  await requireRol("ADMIN");
  const filas = await listarAuditoria(150);

  return (
    <>
      <header>
        <h1 className="text-lg font-bold tracking-tight">Auditoría</h1>
        <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">
          Operaciones sensibles · solo lectura
        </p>
      </header>

      <div className="mt-6 overflow-x-auto rounded-sm border border-regla bg-hoja">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-regla bg-suave text-left text-[10px] uppercase tracking-widest text-kraft">
              <th className="px-4 py-2 font-bold">Fecha</th>
              <th className="px-4 py-2 font-bold">Quién</th>
              <th className="px-4 py-2 font-bold">Acción</th>
              <th className="px-4 py-2 font-bold">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-suave">
            {filas.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-3 text-center text-kraft">Sin registros todavía.</td></tr>
            ) : filas.map((f) => (
              <tr key={f.id}>
                <td className="whitespace-nowrap px-4 py-2 font-mono text-[13px] text-kraft">
                  {f.fecha.toLocaleDateString("es-VE")} {f.fecha.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-2">{f.actorNombre ?? "—"}</td>
                <td className="px-4 py-2">{ETIQUETA_ACCION[f.accion] ?? f.accion}</td>
                <td className="px-4 py-2 text-[13px] text-kraft">{f.detalle ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-kraft">
        Se registran cambios de estado de cotización, de rol y de activación de usuarios.
        La bitácora es de solo-agregar: no se edita ni se borra.
      </p>
    </>
  );
}
