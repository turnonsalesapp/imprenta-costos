"use client";

import { useState, useTransition } from "react";
import type { EstadoCobro } from "@prisma/client";
import { cambiarCobroAction } from "@/app/actions/ordenes";

// Espejo de lib/ordenes (server-only), replicado para el cliente.
const ESTADOS_COBRO: EstadoCobro[] = ["NO_FACTURADO", "FACTURADO", "COBRADO"];
const ETIQUETA_COBRO: Record<EstadoCobro, string> = {
  NO_FACTURADO: "No facturado",
  FACTURADO: "Facturado",
  COBRADO: "Cobrado",
};

/**
 * Control de estado de cobro de la orden (ADMIN/VENDEDOR). Optimista con
 * useTransition; revierte si el servidor falla. Sin precios: solo el estado
 * administrativo (facturado/cobrado) y las fechas selladas.
 */
export function SelectorCobro({
  id, estado, fechaFactura, fechaCobro,
}: {
  id: string;
  estado: EstadoCobro;
  fechaFactura: string | null;
  fechaCobro: string | null;
}) {
  const [valor, setValor] = useState<EstadoCobro>(estado);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function cambiar(nuevo: EstadoCobro) {
    if (nuevo === valor) return;
    const prev = valor;
    setValor(nuevo);
    setError(null);
    startTransition(async () => {
      const res = await cambiarCobroAction(id, nuevo);
      if (res?.error) { setValor(prev); setError(res.error); }
    });
  }

  return (
    <div className="h-fit rounded-sm border border-regla bg-hoja p-4">
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-kraft">Cobro</h2>
      <select
        value={valor}
        onChange={(e) => cambiar(e.target.value as EstadoCobro)}
        aria-label="Estado de cobro"
        className="w-full rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian"
      >
        {ESTADOS_COBRO.map((e) => (
          <option key={e} value={e}>{ETIQUETA_COBRO[e]}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-[11px] text-[#8A1C1C]">{error}</p>}

      {(fechaFactura || fechaCobro) && (
        <dl className="mt-3 space-y-1 border-t border-suave pt-3">
          {fechaFactura && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-kraft">Facturada</dt>
              <dd className="font-mono text-[12px]">{new Date(fechaFactura).toLocaleDateString("es-VE")}</dd>
            </div>
          )}
          {fechaCobro && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-kraft">Cobrada</dt>
              <dd className="font-mono text-[12px]">{new Date(fechaCobro).toLocaleDateString("es-VE")}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
