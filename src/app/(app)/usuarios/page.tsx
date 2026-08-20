import { requireRol } from "@/lib/auth";
import { db } from "@/lib/db";
import { alternarActivo } from "@/app/actions/usuarios";
import { rolesAsignables, esSuperAdmin } from "@/lib/roles";
import { interpretarDisponible } from "@/lib/interpretar";
import { CrearUsuarioForm } from "./CrearUsuarioForm";
import { SelectorRol } from "./SelectorRol";
import { SelectorInterpretar } from "./SelectorInterpretar";
import { PermisosCotizar } from "./PermisosCotizar";
import { SelectorEstructura } from "./SelectorEstructura";
import { PageHeader } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

/**
 * Administración de usuarios. Solo ADMIN: `requireRol("ADMIN")` redirige al
 * inicio a cualquier otro rol antes de renderizar.
 */
export default async function UsuariosPage() {
  const admin = await requireRol("ADMIN");

  const usuarios = await db.usuario.findMany({
    orderBy: [{ activo: "desc" }, { creadoEn: "asc" }],
    select: {
      id: true, nombre: true, email: true, rol: true, activo: true, interpretarIA: true,
      puedeCotizar: true, tiposCotizar: true, puedeEliminar: true, verEstructura: true,
    },
  });
  const iaDisponible = interpretarDisponible();
  // Roles que ESTE administrador puede asignar (solo SUPERADMIN ve SUPERADMIN).
  const asignables = rolesAsignables(admin.rol);
  // Un ADMIN no puede cambiar el rol de un SUPERADMIN; solo otro SUPERADMIN.
  const rolBloqueado = (rol: (typeof usuarios)[number]["rol"], esYo: boolean) =>
    esYo || (rol === "SUPERADMIN" && !esSuperAdmin(admin.rol));

  return (
    <>
      <PageHeader title="Usuarios" eyebrow="Acceso y roles" />

      <div className="mt-8">
        <CrearUsuarioForm opciones={asignables} />
      </div>

      {/* Móvil (< lg): cada usuario es una tarjeta con sus datos y controles
          apilados, así se ve todo por línea sin scroll horizontal (la tabla es
          demasiado ancha en el teléfono). La tabla aparece a partir de 1024px. */}
      <ul className="mt-6 space-y-3 lg:hidden">
        {usuarios.map((u) => {
          const esYo = u.id === admin.id;
          return (
            <li
              key={u.id}
              className={`rounded-sm border border-regla bg-hoja p-4 ${u.activo ? "" : "opacity-50"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">
                    {u.nombre}
                    {esYo && (
                      <span className="ml-1.5 text-[10px] uppercase tracking-widest text-kraft">
                        (tú)
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 break-all font-mono text-[13px] text-kraft">{u.email}</div>
                </div>
                <span
                  className={
                    u.activo
                      ? "shrink-0 text-xs font-medium text-exito"
                      : "shrink-0 text-xs font-medium text-kraft"
                  }
                >
                  {u.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="mt-3 space-y-3 border-t border-suave pt-3">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-kraft">Rol</div>
                  <SelectorRol id={u.id} rol={u.rol} opciones={asignables} disabled={rolBloqueado(u.rol, esYo)} />
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-kraft">Cotizar / eliminar</div>
                  <PermisosCotizar
                    id={u.id}
                    rol={u.rol}
                    puedeCotizar={u.puedeCotizar}
                    tiposCotizar={u.tiposCotizar}
                    puedeEliminar={u.puedeEliminar}
                  />
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-kraft">Costos</div>
                  <SelectorEstructura id={u.id} rol={u.rol} verEstructura={u.verEstructura} />
                </div>
                {iaDisponible && (
                  <div>
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-kraft">Interpretar IA</div>
                    <SelectorInterpretar id={u.id} valor={u.interpretarIA} disabled={u.rol === "TALLER"} />
                  </div>
                )}
              </div>

              {!esYo && (
                <div className="mt-3 flex justify-end border-t border-suave pt-3">
                  <form action={alternarActivo}>
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      className="rounded-sm border border-regla px-2.5 py-1 text-xs font-medium text-kraft hover:border-tinta hover:text-tinta"
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Escritorio (≥ lg): tabla completa (overflow-x-auto como red de seguridad). */}
      <div className="mt-6 hidden overflow-x-auto rounded-sm border border-regla bg-hoja lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-regla bg-suave text-left text-[10px] uppercase tracking-widest text-kraft">
              <th className="px-4 py-2 font-bold">Nombre</th>
              <th className="px-4 py-2 font-bold">Correo</th>
              <th className="px-4 py-2 font-bold">Rol</th>
              <th className="px-4 py-2 font-bold">Cotizar / eliminar</th>
              <th className="px-4 py-2 font-bold">Costos</th>
              {iaDisponible && <th className="px-4 py-2 font-bold">Interpretar IA</th>}
              <th className="px-4 py-2 font-bold">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-suave">
            {usuarios.map((u) => {
              const esYo = u.id === admin.id;
              return (
                <tr key={u.id} className={u.activo ? "" : "opacity-50"}>
                  <td className="px-4 py-2.5">
                    {u.nombre}
                    {esYo && (
                      <span className="ml-1.5 text-[10px] uppercase tracking-widest text-kraft">
                        (tú)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[13px] text-kraft">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <SelectorRol id={u.id} rol={u.rol} opciones={asignables} disabled={rolBloqueado(u.rol, esYo)} />
                  </td>
                  <td className="px-4 py-2.5">
                    <PermisosCotizar
                      id={u.id}
                      rol={u.rol}
                      puedeCotizar={u.puedeCotizar}
                      tiposCotizar={u.tiposCotizar}
                      puedeEliminar={u.puedeEliminar}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <SelectorEstructura id={u.id} rol={u.rol} verEstructura={u.verEstructura} />
                  </td>
                  {iaDisponible && (
                    <td className="px-4 py-2.5">
                      <SelectorInterpretar id={u.id} valor={u.interpretarIA} disabled={u.rol === "TALLER"} />
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        u.activo
                          ? "text-xs font-medium text-exito"
                          : "text-xs font-medium text-kraft"
                      }
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {!esYo && (
                      <form action={alternarActivo}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          className="rounded-sm border border-regla px-2.5 py-1 text-xs font-medium text-kraft hover:border-tinta hover:text-tinta"
                        >
                          {u.activo ? "Desactivar" : "Activar"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-kraft">
        Al desactivar un usuario se cierran sus sesiones abiertas de inmediato.
        No puedes cambiar tu propio rol ni desactivarte a ti mismo.
        {iaDisponible ? " «Interpretar IA» en «Según el sistema» sigue el interruptor general de Variables; ponlo en Activado o Desactivado para forzarlo en un usuario." : ""}
      </p>
    </>
  );
}
