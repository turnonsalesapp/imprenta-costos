"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MOCKUPS } from "./mockups";

/**
 * Motor de tutorial reutilizable (visita guiada). Cada tour tiene un `id` propio;
 * se abre solo la primera vez (flag por-tour en localStorage) y se reabre con el
 * evento `abrir-tour:<id>`. El usuario puede cerrarlo o marcar "No volver a
 * mostrar"; siempre puede reabrirlo desde su botón. Un recorrido por pasos (no
 * spotlight anclado) para que funcione igual en todas las pantallas.
 *
 * Cada paso puede llevar una ilustración (`mockup`, clave en MOCKUPS) que muestra
 * cómo se ve el paso. Los pasos sin mockup se ven bien igual (solo texto).
 */

export type PasoTour = {
  eyebrow: string;
  titulo: string;
  cuerpo: string;
  mockup?: string;       // clave en MOCKUPS
  href?: string;
  hrefLabel?: string;
};

const clave = (id: string) => `imprenta.tour.${id}`;

export function Tour({
  id, pasos, autoAbrir = false,
}: { id: string; pasos: PasoTour[]; autoAbrir?: boolean }) {
  const [abierta, setAbierta] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    try {
      if (autoAbrir && !localStorage.getItem(clave(id))) setAbierta(true);
    } catch { /* localStorage no disponible */ }
    const abrir = () => { setI(0); setAbierta(true); };
    const evento = `abrir-tour:${id}`;
    window.addEventListener(evento, abrir);
    return () => window.removeEventListener(evento, abrir);
  }, [id, autoAbrir]);

  // Marca "visto" para que no se abra sola de nuevo (sin ser un opt-out explícito).
  function marcarVisto() {
    try { localStorage.setItem(clave(id), "1"); } catch { /* ignore */ }
  }
  function cerrar() { marcarVisto(); setAbierta(false); }
  function noMostrar() { marcarVisto(); setAbierta(false); }

  if (!abierta) return null;
  const paso = pasos[i];
  const primero = i === 0;
  const ultimo = i === pasos.length - 1;
  const ilustracion = paso.mockup ? MOCKUPS[paso.mockup] : null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-tinta/40 p-4"
      role="dialog" aria-modal="true" aria-label="Visita guiada"
      onClick={cerrar}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-sm border border-regla bg-hoja"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-1.5 shrink-0">
          <i className="flex-1 bg-cian" /><i className="flex-1 bg-magenta" />
          <i className="flex-1 bg-amarillo" /><i className="flex-1 bg-tinta" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">
              {paso.eyebrow}
            </span>
            <button onClick={cerrar} className="text-sm text-kraft hover:text-tinta" aria-label="Cerrar">✕</button>
          </div>

          <h2 className="mt-1 text-lg font-bold tracking-tight">{paso.titulo}</h2>

          {/* Ilustración del paso */}
          {ilustracion ? (
            <div className="mt-3 overflow-hidden rounded-sm border border-regla bg-suave">
              {ilustracion}
            </div>
          ) : null}

          <p className="mt-3 text-sm leading-relaxed text-tinta">{paso.cuerpo}</p>

          {paso.href ? (
            <Link
              href={paso.href} onClick={cerrar}
              className="mt-3 inline-block rounded-sm border border-regla px-3 py-1.5 text-sm font-medium text-kraft hover:border-tinta hover:text-tinta"
            >
              {paso.hrefLabel ?? "Ir"} →
            </Link>
          ) : null}
        </div>

        {/* Pie fijo: progreso + navegación */}
        <div className="shrink-0 border-t border-regla p-4">
          <div className="mb-3 flex items-center justify-center gap-1.5">
            {pasos.map((_, n) => (
              <button
                key={n} onClick={() => setI(n)} aria-label={`Paso ${n + 1}`}
                className={`h-1.5 rounded-[2px] transition-all ${n === i ? "w-4 bg-cian" : "w-1.5 bg-regla hover:bg-kraft"}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <button onClick={noMostrar} className="text-xs text-kraft underline hover:text-tinta">
              No volver a mostrar
            </button>
            <div className="flex items-center gap-2">
              <span className="mr-1 text-xs text-kraft">{i + 1} / {pasos.length}</span>
              {!primero ? (
                <button
                  onClick={() => setI((n) => n - 1)}
                  className="rounded-sm border border-regla px-3 py-1.5 text-sm font-medium text-kraft hover:border-tinta hover:text-tinta"
                >Anterior</button>
              ) : null}
              <button
                onClick={ultimo ? cerrar : () => setI((n) => n + 1)}
                className="rounded-sm bg-tinta px-4 py-1.5 text-sm font-bold text-hoja hover:opacity-90"
              >{ultimo ? "Listo" : "Siguiente"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Botón para (re)abrir un tour por su id. */
export function BotonTour({ id, children, className }: {
  id: string; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(`abrir-tour:${id}`))}
      className={className}
    >
      {children}
    </button>
  );
}
