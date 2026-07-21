import { requireRol } from "@/lib/auth";
import { db } from "@/lib/db";
import { alternarActivo } from "@/app/actions/usuarios";
import { CrearUsuarioForm } from "./CrearUsuarioForm";
import { SelectorRol } from "./SelectorRol";

export const dynamic = "force-dynamic";

/**
 * Administración de usuarios. Solo ADMIN: `requireRol("ADMIN")` redirige al
 * inicio a cualquier otro rol antes de renderizar.
 */
export default async function UsuariosPage() {
  const admin = await requireRol("ADMIN");

  const usuarios = await db.usuario.findMany({
    orderBy: [{ activo: "desc" }, { creadoEn: "asc" }],
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });

  return (
    <>
      <header>
        <h1 className="text-lg font-bold tracking-tight">Usuarios</h1>
        <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">
          Acceso y roles
        </p>
      </header>

      <div className="mt-6">
        <CrearUsuarioForm />
      </div>

      <div className="mt-6 overflow-x-auto rounded-sm border border-regla bg-hoja">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-regla bg-suave text-left text-[10px] uppercase tracking-widest text-kraft">
              <th className="px-4 py-2 font-bold">Nombre</th>
              <th className="px-4 py-2 font-bold">Correo</th>
              <th className="px-4 py-2 font-bold">Rol</th>
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
                    <SelectorRol id={u.id} rol={u.rol} disabled={esYo} />
                  </td>
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
      </p>
    </>
  );
}
