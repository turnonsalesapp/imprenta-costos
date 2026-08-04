import Link from "next/link";
import type { Sesion } from "@/lib/auth";
import { ETIQUETA_ROL, puedeAdministrar, puedeVerPrecios, puedeCotizar } from "@/lib/roles";
import { logoutAction } from "@/app/actions/auth";
import { NavMenu, type NavGrupo, type NavEnlace } from "./NavMenu";
import { MenuMovil } from "./MenuMovil";
import { BotonGuia } from "./BotonGuia";

/**
 * Barra de navegación. Los grupos se arman según el rol, pero eso es solo
 * comodidad visual: el control real está en el servidor (cada página exige su
 * rol). Nunca dependemos de esconder un enlace para proteger nada.
 *
 * La navegación se agrupa por proceso (Comercial, Producción, Catálogo,
 * Administración). En escritorio cada grupo es un desplegable (NavMenu); en
 * móvil se colapsan en secciones (MenuMovil).
 */
export function Nav({ usuario }: { usuario: Sesion }) {
  const rol = usuario.rol;

  // Ítems por grupo, filtrados por rol. El grupo se omite si queda vacío.
  const comercial: NavEnlace[] = [];
  if (puedeVerPrecios(rol)) {
    comercial.push({ href: "/crm", label: "Oportunidades" });
    if (puedeCotizar(usuario)) comercial.push({ href: "/cotizacion-nueva", label: "Cotizar" });
    comercial.push(
      { href: "/cotizaciones", label: "Cotizaciones" },
      { href: "/clientes", label: "Clientes" },
    );
  }

  // Producción: Tablero es la pantalla del TALLER (todos los roles); Consumo solo admin.
  const produccion: NavEnlace[] = [{ href: "/taller", label: "Tablero" }];
  if (puedeAdministrar(rol)) produccion.push({ href: "/consumo", label: "Consumo" });

  const catalogo: NavEnlace[] = [];
  const administracion: NavEnlace[] = [];
  if (puedeAdministrar(rol)) {
    catalogo.push(
      { href: "/variables", label: "Variables" },
      { href: "/inventario", label: "Inventario" },
      { href: "/proveedores", label: "Proveedores" },
    );
    administracion.push(
      { href: "/usuarios", label: "Usuarios" },
      { href: "/auditoria", label: "Auditoría" },
      { href: "/migracion", label: "Migración" },
    );
  }

  const grupos: NavGrupo[] = [{ tipo: "enlace", href: "/", label: "Inicio" }];
  if (comercial.length) grupos.push({ tipo: "grupo", label: "Comercial", items: comercial });
  if (produccion.length) grupos.push({ tipo: "grupo", label: "Producción", items: produccion });
  if (catalogo.length) grupos.push({ tipo: "grupo", label: "Catálogo", items: catalogo });
  if (administracion.length) grupos.push({ tipo: "grupo", label: "Administración", items: administracion });

  return (
    <header className="no-print relative border-b border-regla bg-hoja">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-4 w-4 overflow-hidden rounded-[2px]">
            <i className="flex-1 bg-cian" />
            <i className="flex-1 bg-magenta" />
            <i className="flex-1 bg-amarillo" />
            <i className="flex-1 bg-tinta" />
          </span>
          <span className="text-sm font-bold tracking-tight">Imprenta</span>
        </Link>

        {/* Escritorio: grupos con paneles desplegables. */}
        <NavMenu grupos={grupos} />

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="text-right leading-tight">
            <div className="text-sm font-medium">{usuario.nombre}</div>
            <div className="text-[10px] uppercase tracking-widest text-kraft">
              {ETIQUETA_ROL[usuario.rol]}
            </div>
          </div>
          <BotonGuia />
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-sm border border-regla px-2.5 py-1 text-xs font-medium text-kraft hover:border-tinta hover:text-tinta"
            >
              Salir
            </button>
          </form>
          {/* Móvil: menú colapsable con secciones. */}
          <MenuMovil grupos={grupos} />
        </div>
      </div>
    </header>
  );
}
