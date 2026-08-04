"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { NavGrupo } from "./NavMenu";

/**
 * Menú de navegación para pantallas chicas. En escritorio los grupos van en una
 * fila con paneles desplegables (NavMenu); aquí se colapsan tras un botón y los
 * grupos se muestran como secciones (encabezado + sus enlaces). Cierra al navegar.
 */
export function MenuMovil({ grupos }: { grupos: NavGrupo[] }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-sm border border-regla text-kraft hover:border-tinta hover:text-tinta"
      >
        {abierto ? <X size={16} /> : <Menu size={16} />}
      </button>

      {abierto && (
        <>
          {/* Telón para cerrar al tocar afuera */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={cerrar}
          />
          <nav
            aria-label="Principal"
            className="absolute right-4 z-50 mt-2 flex max-h-[80vh] w-60 flex-col overflow-y-auto rounded-sm border border-regla bg-hoja py-1"
          >
            {grupos.map((g) =>
              g.tipo === "enlace" ? (
                <Link
                  key={g.href}
                  href={g.href}
                  onClick={cerrar}
                  className="px-4 py-2 text-sm font-medium text-kraft hover:bg-suave hover:text-tinta"
                >
                  {g.label}
                </Link>
              ) : (
                <div key={g.label} className="mt-1 border-t border-suave pt-1 first:mt-0 first:border-t-0 first:pt-0">
                  <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-kraft">
                    {g.label}
                  </div>
                  {g.items.map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      onClick={cerrar}
                      className="block px-4 py-2 pl-6 text-sm text-kraft hover:bg-suave hover:text-tinta"
                    >
                      {it.label}
                    </Link>
                  ))}
                </div>
              ),
            )}
          </nav>
        </>
      )}
    </div>
  );
}
