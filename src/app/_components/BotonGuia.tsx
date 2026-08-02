"use client";

/** Botón «?» que reabre la visita guiada (la escucha VisitaGuiada). */
export function BotonGuia() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("abrir-guia"))}
      className="rounded-sm border border-regla px-2 py-1 text-xs font-bold text-kraft hover:border-tinta hover:text-tinta"
      aria-label="Abrir la visita guiada"
      title="Visita guiada"
    >
      ?
    </button>
  );
}
