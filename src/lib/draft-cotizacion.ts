"use client";

import { useEffect, useState } from "react";
import type { TipoCotizacion } from "@prisma/client";

/**
 * Borrador de cotización MIXTA en el navegador (localStorage). Cada calculadora
 * puede "Agregar a la cotización" un ítem con su tipo y su formulario; una página
 * de revisión los muestra todos (de cualquier tipo) y los guarda juntos.
 */

export type DraftResumen = { titulo: string; cantidad: number; ventaTotal: number; tipoLabel: string };
export type DraftItem = { id: string; tipo: TipoCotizacion; form: unknown; resumen: DraftResumen };
export type Draft = {
  meta: { cliente: string; clienteId: string; trabajo: string; editarId: string };
  items: DraftItem[];
};

const KEY = "cotizacion-draft";
const EVENTO = "draft-cotizacion-cambio";
const VACIO: Draft = { meta: { cliente: "", clienteId: "", trabajo: "", editarId: "" }, items: [] };

export function leerDraft(): Draft {
  if (typeof window === "undefined") return VACIO;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return VACIO;
    const d = JSON.parse(raw) as Draft;
    return { meta: { ...VACIO.meta, ...d.meta }, items: Array.isArray(d.items) ? d.items : [] };
  } catch {
    return VACIO;
  }
}

function guardar(d: Draft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(d));
  window.dispatchEvent(new Event(EVENTO));
}

let contador = 0;
function idLocal(): string {
  contador += 1;
  return `it-${contador}-${(typeof performance !== "undefined" ? performance.now() : contador).toString(36).replace(".", "")}`;
}

/** Agrega un ítem al borrador. Si el borrador no tiene cliente aún, lo toma del ítem. */
export function agregarItemDraft(
  tipo: TipoCotizacion, form: unknown, resumen: DraftResumen,
  cliente?: { cliente?: string; clienteId?: string },
): number {
  const d = leerDraft();
  d.items.push({ id: idLocal(), tipo, form, resumen });
  if (!d.meta.cliente && cliente?.cliente) d.meta.cliente = cliente.cliente;
  if (!d.meta.clienteId && cliente?.clienteId) d.meta.clienteId = cliente.clienteId;
  guardar(d);
  return d.items.length;
}

export function quitarItemDraft(id: string) {
  const d = leerDraft();
  d.items = d.items.filter((x) => x.id !== id);
  guardar(d);
}

export function actualizarMetaDraft(meta: Partial<Draft["meta"]>) {
  const d = leerDraft();
  d.meta = { ...d.meta, ...meta };
  guardar(d);
}

export function vaciarDraft() {
  guardar({ meta: { cliente: "", clienteId: "", trabajo: "", editarId: "" }, items: [] });
}

/** Reemplaza todo el borrador (para reeditar una cotización mixta guardada). */
export function cargarDraft(
  meta: { cliente: string; clienteId: string; trabajo: string; editarId: string },
  items: { tipo: TipoCotizacion; form: unknown; resumen: DraftResumen }[],
) {
  guardar({ meta, items: items.map((i) => ({ id: idLocal(), ...i })) });
}

/** Hook reactivo: se actualiza cuando cambia el borrador (también entre pestañas). */
export function useDraft(): Draft {
  const [draft, setDraft] = useState<Draft>(VACIO);
  useEffect(() => {
    const refrescar = () => setDraft(leerDraft());
    refrescar();
    window.addEventListener(EVENTO, refrescar);
    window.addEventListener("storage", refrescar);
    return () => {
      window.removeEventListener(EVENTO, refrescar);
      window.removeEventListener("storage", refrescar);
    };
  }, []);
  return draft;
}
