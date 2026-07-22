import Link from "next/link";
import type { Sesion } from "@/lib/auth";
import { ETIQUETA_ROL, puedeAdministrar, puedeVerPrecios } from "@/lib/roles";
import { logoutAction } from "@/app/actions/auth";

/**
 * Barra de navegación. Los enlaces se arman según el rol, pero eso es solo
 * comodidad visual: el control real está en el servidor (cada página exige su
 * rol). Nunca dependemos de esconder un enlace para proteger nada.
 */
export function Nav({ usuario }: { usuario: Sesion }) {
  return (
    <header className="no-print border-b border-regla bg-hoja">
      <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-4 w-4 overflow-hidden rounded-[2px]">
            <i className="flex-1 bg-cian" />
            <i className="flex-1 bg-magenta" />
            <i className="flex-1 bg-amarillo" />
            <i className="flex-1 bg-tinta" />
          </span>
          <span className="text-sm font-bold tracking-tight">Imprenta</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-kraft hover:text-tinta">
            Inicio
          </Link>
          <Link href="/taller" className="text-kraft hover:text-tinta">
            Taller
          </Link>
          {puedeVerPrecios(usuario.rol) && (
            <>
              <Link href="/cotizar" className="text-kraft hover:text-tinta">
                Cotizar
              </Link>
              <Link href="/cotizar-proveedor" className="text-kraft hover:text-tinta">
                Cotizar prov.
              </Link>
              <Link href="/cotizaciones" className="text-kraft hover:text-tinta">
                Cotizaciones
              </Link>
              <Link href="/clientes" className="text-kraft hover:text-tinta">
                Clientes
              </Link>
            </>
          )}
          {puedeAdministrar(usuario.rol) && (
            <>
              <Link href="/variables" className="text-kraft hover:text-tinta">
                Variables
              </Link>
              <Link href="/inventario" className="text-kraft hover:text-tinta">
                Inventario
              </Link>
              <Link href="/consumo" className="text-kraft hover:text-tinta">
                Consumo
              </Link>
              <Link href="/usuarios" className="text-kraft hover:text-tinta">
                Usuarios
              </Link>
              <Link href="/auditoria" className="text-kraft hover:text-tinta">
                Auditoría
              </Link>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-right leading-tight">
            <div className="text-sm font-medium">{usuario.nombre}</div>
            <div className="text-[10px] uppercase tracking-widest text-kraft">
              {ETIQUETA_ROL[usuario.rol]}
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-sm border border-regla px-2.5 py-1 text-xs font-medium text-kraft hover:border-tinta hover:text-tinta"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
