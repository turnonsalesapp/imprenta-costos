import { requireRol } from "@/lib/auth";
import { listarAuditoria } from "@/lib/auditoria";
import { PageHeader } from "@/app/_components/ui";

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
      <PageHeader title="Auditoría" eyebrow="Operaciones sensibles · solo lectura" />

      {/* Móvil (<768px): cada registro es una tarjeta (acción arriba, actor y
          fecha como metadatos, detalle debajo). La tabla aparece desde md. */}
      <ul className="mt-8 space-y-3 md:hidden">
        {filas.length === 0 ? (
          <li className="rounded-sm border border-regla bg-hoja px-4 py-8 text-center text-sm text-kraft">
            Sin registros todavía.
          </li>
        ) : filas.map((f) => (
          <li key={f.id} className="rounded-sm border border-regla bg-hoja p-4">
            <div className="font-medium">{ETIQUETA_ACCION[f.accion] ?? f.accion}</div>
            <div className="mt-1 text-[11px] text-kraft">
              {f.actorNombre ?? "—"} · <span className="font-mono">
                {f.fecha.toLocaleDateString("es-VE")} {f.fecha.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="mt-2 text-[13px] text-kraft">{f.detalle ?? "—"}</div>
          </li>
        ))}
      </ul>

      {/* Escritorio (≥768px): tabla completa. */}
      <div className="mt-8 hidden overflow-x-auto rounded-sm border border-regla bg-hoja md:block">
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
