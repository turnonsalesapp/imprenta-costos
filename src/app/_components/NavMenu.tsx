"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

/** Un enlace suelto dentro de un grupo (o el ítem directo "Inicio"). */
export type NavEnlace = { href: string; label: string };

/**
 * Estructura de la navegación: o un enlace directo (p. ej. Inicio) o un grupo
 * desplegable con sus ítems. La arma el servidor (Nav.tsx) según el rol; aquí
 * solo se dibuja. Esconder un grupo es comodidad visual, no seguridad: cada
 * página exige su rol en el servidor.
 */
export type NavGrupo =
  | { tipo: "enlace"; href: string; label: string }
  | { tipo: "grupo"; label: string; items: NavEnlace[] };

/** ¿La ruta actual cae dentro de este enlace? Exacto para "/", por prefijo en el resto. */
function rutaActiva(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Navegación de escritorio con grupos desplegables. Un clic (o el hover) abre el
 * panel del grupo; se cierra al hacer clic fuera, con Escape, o al navegar. El
 * grupo que contiene la ruta actual queda resaltado. Estética del sistema: filete
 * fino, `bg-hoja`, sin sombras fuertes.
 */
export function NavMenu({ grupos }: { grupos: NavGrupo[] }) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera de la barra o al pulsar Escape.
  useEffect(() => {
    if (abierto === null) return;
    function fuera(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(null);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(null);
    }
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  return (
    <nav
      ref={ref}
      className="hidden min-w-0 flex-1 items-center gap-1 text-sm lg:flex"
      aria-label="Principal"
    >
      {grupos.map((g, i) => {
        if (g.tipo === "enlace") {
          const activo = rutaActiva(g.href, pathname);
          return (
            <Link
              key={g.href}
              href={g.href}
              onClick={() => setAbierto(null)}
              aria-current={activo ? "page" : undefined}
              className={`rounded-sm px-2.5 py-1.5 ${
                activo ? "font-medium text-tinta" : "text-kraft hover:text-tinta"
              }`}
            >
              {g.label}
            </Link>
          );
        }

        const activo = g.items.some((it) => rutaActiva(it.href, pathname));
        const open = abierto === i;
        return (
          <div
            key={g.label}
            className="relative"
            onMouseEnter={() => setAbierto(i)}
            onMouseLeave={() => setAbierto((a) => (a === i ? null : a))}
          >
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="menu"
              onClick={() => setAbierto((a) => (a === i ? null : i))}
              className={`flex items-center gap-1 rounded-sm px-2.5 py-1.5 ${
                activo || open ? "font-medium text-tinta" : "text-kraft hover:text-tinta"
              }`}
            >
              {g.label}
              <ChevronDown
                size={14}
                className={`transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute left-0 top-full z-50 flex min-w-[11rem] flex-col rounded-sm border border-regla bg-hoja py-1"
              >
                {g.items.map((it) => {
                  const itActivo = rutaActiva(it.href, pathname);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      role="menuitem"
                      onClick={() => setAbierto(null)}
                      aria-current={itActivo ? "page" : undefined}
                      className={`px-4 py-2 text-sm ${
                        itActivo
                          ? "bg-suave font-medium text-tinta"
                          : "text-kraft hover:bg-suave hover:text-tinta"
                      }`}
                    >
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
