"use client";

import { useState, useTransition } from "react";
import type { CarrilPieza, EstadoPieza } from "@prisma/client";
import { moverPiezaAction } from "@/app/actions/ordenes";

// Espejo de lib/ordenes (server-only), replicado para el cliente.
const ESTADOS_PIEZA_INTERNO: EstadoPieza[] = [
  "EN_COLA", "EN_DISENO", "ESPERANDO_ARTE", "EN_IMPRESION", "EN_ACABADO", "LISTA",
];
const ESTADOS_PIEZA_TERCERIZADO: EstadoPieza[] = [
  "POR_COTIZAR", "COMPRADO", "RECIBIDO", "ENTREGADO",
];
const ETIQUETA_PIEZA: Record<EstadoPieza, string> = {
  EN_COLA: "En cola de diseño",
  EN_DISENO: "En diseño",
  ESPERANDO_ARTE: "Esperando arte",
  EN_IMPRESION: "En impresión",
  EN_ACABADO: "En acabado",
  LISTA: "Lista",
  POR_COTIZAR: "Por cotizar",
  COMPRADO: "Comprado",
  RECIBIDO: "Recibido",
  ENTREGADO: "Entregado",
};

/**
 * Selector de estado de una pieza en el detalle de la orden (roles gestores).
 * Optimista con useTransition: cambia al instante y revierte si el servidor falla.
 * El TALLER mueve las piezas desde el tablero, no desde aquí.
 */
export function SelectorPieza({
  id, carril, estado,
}: {
  id: string;
  carril: CarrilPieza;
  estado: EstadoPieza;
}) {
  const [valor, setValor] = useState<EstadoPieza>(estado);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const opciones = carril === "INTERNO" ? ESTADOS_PIEZA_INTERNO : ESTADOS_PIEZA_TERCERIZADO;

  function mover(nuevo: EstadoPieza) {
    if (nuevo === valor) return;
    const prev = valor;
    setValor(nuevo);
    setError(null);
    startTransition(async () => {
      const res = await moverPiezaAction(id, nuevo);
      if (res?.error) { setValor(prev); setError(res.error); }
    });
  }

  return (
    <div>
      <select
        value={valor}
        onChange={(e) => mover(e.target.value as EstadoPieza)}
        aria-label="Cambiar estado de la pieza"
        className="rounded-sm border border-regla bg-white px-2 py-1 text-xs outline-none focus:border-cian"
      >
        {opciones.map((e) => (
          <option key={e} value={e}>{ETIQUETA_PIEZA[e]}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-[11px] text-[#8A1C1C]">{error}</p>}
    </div>
  );
}
