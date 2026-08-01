"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { EstadoCotizacion } from "@prisma/client";
import { usd } from "@/lib/calculo";
import { moverEstadoAction } from "@/app/actions/cotizaciones";

/**
 * Tablero Kanban de cotizaciones. Cada columna es un estado; se cambia el estado
 * arrastrando la tarjeta a otra columna (drag & drop nativo) o con el selector
 * de la propia tarjeta (alternativa cómoda en móvil/teclado). El cambio es
 * optimista: se mueve al instante y, si el servidor falla, se revierte.
 */

export type FilaTablero = {
  id: string;
  numero: number;
  titulo: string;
  clienteNombre: string | null;
  estado: EstadoCotizacion;
  ventaTotal: number;
};

const COLUMNAS: {
  label: string; estado: EstadoCotizacion; incluye: EstadoCotizacion[]; acento: string;
}[] = [
  { label: "Borrador", estado: "BORRADOR", incluye: ["BORRADOR"], acento: "bg-kraft" },
  { label: "Pendiente de aprobación", estado: "PENDIENTE", incluye: ["PENDIENTE"], acento: "bg-[#5B3E8F]" },
  { label: "Enviada al cliente", estado: "ENVIADA", incluye: ["ENVIADA"], acento: "bg-cian" },
  { label: "Ganadas", estado: "APROBADA", incluye: ["APROBADA"], acento: "bg-exito" },
  { label: "Perdidas", estado: "RECHAZADA", incluye: ["RECHAZADA", "VENCIDA"], acento: "bg-[#B23A48]" },
];

// Opciones del selector de cada tarjeta (todas las metas posibles).
const OPCIONES: { estado: EstadoCotizacion; label: string }[] = [
  { estado: "BORRADOR", label: "Borrador" },
  { estado: "PENDIENTE", label: "Pendiente de aprobación" },
  { estado: "ENVIADA", label: "Enviada al cliente" },
  { estado: "APROBADA", label: "Ganada (Aprobada)" },
  { estado: "RECHAZADA", label: "Perdida (Rechazada)" },
  { estado: "VENCIDA", label: "Vencida" },
];

export function TableroCotizaciones({ filasIniciales }: { filasIniciales: FilaTablero[] }) {
  const [filas, setFilas] = useState<FilaTablero[]>(filasIniciales);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function mover(id: string, estado: EstadoCotizacion) {
    const actual = filas.find((f) => f.id === id);
    if (!actual || actual.estado === estado) return;
    const prev = filas;
    setFilas((fs) => fs.map((f) => (f.id === id ? { ...f, estado } : f)));
    setError(null);
    startTransition(async () => {
      const res = await moverEstadoAction(id, estado);
      if (res?.error) { setFilas(prev); setError(res.error); }
    });
  }

  return (
    <div className="mt-4">
      {error && (
        <div className="mb-3 rounded-sm border border-[#E4B3B3] bg-[#FDECED] px-3 py-2 text-sm text-[#8A1C1C]">
          {error}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNAS.map((col) => {
          const cards = filas.filter((f) => col.incluye.includes(f.estado));
          const activa = sobre === col.label;
          return (
            <section
              key={col.label}
              onDragOver={(e) => { e.preventDefault(); setSobre(col.label); }}
              onDragLeave={() => setSobre((s) => (s === col.label ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setSobre(null);
                if (arrastrando) mover(arrastrando, col.estado);
                setArrastrando(null);
              }}
              className={`flex min-w-[180px] flex-1 flex-col rounded-sm border bg-suave ${activa ? "border-cian ring-1 ring-cian" : "border-regla"}`}
            >
              <div className="flex items-center gap-2 border-b border-regla px-3 py-2">
                <span className={`h-2 w-2 rounded-[2px] ${col.acento}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">{col.label}</span>
                <span className="ml-auto font-mono text-[11px] text-kraft">{cards.length}</span>
              </div>

              <div className="flex min-h-[64px] flex-1 flex-col gap-2 p-2">
                {cards.map((c) => (
                  <article
                    key={c.id}
                    draggable
                    onDragStart={() => setArrastrando(c.id)}
                    onDragEnd={() => { setArrastrando(null); setSobre(null); }}
                    className={`cursor-grab rounded-sm border border-regla bg-hoja p-2.5 active:cursor-grabbing ${arrastrando === c.id ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/cotizaciones/${c.id}`} className="text-sm font-medium leading-snug hover:text-cian">
                        {c.titulo}
                      </Link>
                      <span className="shrink-0 font-mono text-[11px] text-kraft">N° {c.numero}</span>
                    </div>
                    {c.clienteNombre && (
                      <div className="mt-0.5 truncate text-[11px] text-kraft">{c.clienteNombre}</div>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold">{usd(c.ventaTotal)}</span>
                      <select
                        value={c.estado}
                        onChange={(e) => mover(c.id, e.target.value as EstadoCotizacion)}
                        aria-label="Cambiar estado"
                        className="max-w-[9rem] rounded-sm border border-regla bg-white px-1 py-0.5 text-[11px] text-kraft outline-none focus:border-cian"
                      >
                        {OPCIONES.map((o) => (
                          <option key={o.estado} value={o.estado}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </article>
                ))}
                {cards.length === 0 && (
                  <div className="px-1 py-5 text-center text-[11px] text-kraft">Sin cotizaciones</div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-kraft">
        Arrastra una tarjeta a otra columna para cambiar su estado, o usa el selector de la tarjeta.
      </p>
    </div>
  );
}
