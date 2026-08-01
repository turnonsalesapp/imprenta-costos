"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export type Enlace = { href: string; label: string };

/**
 * Menú de navegación para pantallas chicas. En escritorio los enlaces van en una
 * fila (Nav); aquí se colapsan tras un botón para que no se desborden en móvil.
 */
export function MenuMovil({ enlaces }: { enlaces: Enlace[] }) {
  const [abierto, setAbierto] = useState(false);

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
            onClick={() => setAbierto(false)}
          />
          <nav className="absolute right-4 z-50 mt-2 flex w-52 flex-col rounded-sm border border-regla bg-hoja py-1 shadow-lg">
            {enlaces.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                onClick={() => setAbierto(false)}
                className="px-4 py-2 text-sm text-kraft hover:bg-suave hover:text-tinta"
              >
                {e.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
