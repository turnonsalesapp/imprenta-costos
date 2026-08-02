"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { CarrilPieza, EstadoPieza, TipoCotizacion } from "@prisma/client";
import { moverPiezaAction } from "@/app/actions/ordenes";
import { TipoBadges } from "../cotizaciones/TipoBadges";

// Espejo de lib/ordenes (server-only): los estados por carril, en orden de columna,
// y sus etiquetas. Se replican aquí porque este es un componente cliente.
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
 * Tablero de producción POR PIEZA (Fase 2). Dos Kanban apilados: Taller (piezas
 * internas) y Compras (piezas tercerizadas). Mismo patrón que TableroCotizaciones:
 * columnas horizontales con drag & drop nativo + selector optimista por tarjeta.
 * El cambio se aplica al instante y, si el servidor falla, se revierte.
 * Sin un solo precio (invariante TALLER-sin-precios).
 */

export type FilaPieza = {
  id: string;
  carril: CarrilPieza;
  tipo: string;
  titulo: string;
  cantidad: number;
  estado: EstadoPieza;
  proveedorNombre: string | null;
  ordenId: string;
  ordenNumero: number;
  cliente: string | null;
  fechaEntrega: string | null;
};

// Cabecera de columna tintada por convención de estatus (tonos suaves de tokens.md):
// neutro en la cola/inicio, azul en proceso/comprado, ámbar en espera/recibido,
// verde al quedar lista/entregada.
const HEAD: Record<EstadoPieza, string> = {
  EN_COLA: "bg-suave text-kraft",
  EN_DISENO: "bg-[#E6F4F8] text-cian",
  ESPERANDO_ARTE: "bg-[#FFF9E6] text-[#5C4A00]",
  EN_IMPRESION: "bg-[#E6F4F8] text-cian",
  EN_ACABADO: "bg-[#E6F4F8] text-cian",
  LISTA: "bg-[#EDF9F1] text-exito",
  POR_COTIZAR: "bg-suave text-kraft",
  COMPRADO: "bg-[#E6F4F8] text-cian",
  RECIBIDO: "bg-[#FFF9E6] text-[#5C4A00]",
  ENTREGADO: "bg-[#EDF9F1] text-exito",
};

function fmtFecha(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("es-VE") : "Sin fecha";
}

export function TableroProduccion({ filasIniciales }: { filasIniciales: FilaPieza[] }) {
  const [filas, setFilas] = useState<FilaPieza[]>(filasIniciales);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function mover(id: string, estado: EstadoPieza) {
    const actual = filas.find((f) => f.id === id);
    if (!actual || actual.estado === estado) return;
    const prev = filas;
    setFilas((fs) => fs.map((f) => (f.id === id ? { ...f, estado } : f)));
    setError(null);
    startTransition(async () => {
      const res = await moverPiezaAction(id, estado);
      if (res?.error) { setFilas(prev); setError(res.error); }
    });
  }

  const internas = filas.filter((f) => f.carril === "INTERNO");
  const tercerizadas = filas.filter((f) => f.carril === "TERCERIZADO");

  return (
    <div className="mt-4 space-y-8">
      {error && (
        <div className="rounded-sm border border-[#E4B3B3] bg-[#FDECED] px-3 py-2 text-sm text-[#8A1C1C]">
          {error}
        </div>
      )}

      <Carril
        titulo="Taller (interno)"
        estados={ESTADOS_PIEZA_INTERNO}
        piezas={internas}
        arrastrando={arrastrando}
        sobre={sobre}
        setArrastrando={setArrastrando}
        setSobre={setSobre}
        mover={mover}
      />

      {tercerizadas.length > 0 && (
        <Carril
          titulo="Compras (tercerizado)"
          estados={ESTADOS_PIEZA_TERCERIZADO}
          piezas={tercerizadas}
          arrastrando={arrastrando}
          sobre={sobre}
          setArrastrando={setArrastrando}
          setSobre={setSobre}
          mover={mover}
        />
      )}

      <p className="text-xs text-kraft">
        Arrastra una pieza a otra columna para cambiar su estado, o usa el selector de la tarjeta.
      </p>
    </div>
  );
}

function Carril({
  titulo, estados, piezas, arrastrando, sobre, setArrastrando, setSobre, mover,
}: {
  titulo: string;
  estados: EstadoPieza[];
  piezas: FilaPieza[];
  arrastrando: string | null;
  sobre: string | null;
  setArrastrando: (v: string | null) => void;
  setSobre: (v: string | null | ((s: string | null) => string | null)) => void;
  mover: (id: string, estado: EstadoPieza) => void;
}) {
  return (
    <section>
      <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">{titulo}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {estados.map((estado) => {
          const cards = piezas.filter((f) => f.estado === estado);
          const clave = `${titulo}:${estado}`;
          const activa = sobre === clave;
          return (
            <section
              key={estado}
              onDragOver={(e) => { e.preventDefault(); setSobre(clave); }}
              onDragLeave={() => setSobre((s) => (s === clave ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setSobre(null);
                if (arrastrando) mover(arrastrando, estado);
                setArrastrando(null);
              }}
              className={`flex min-w-[188px] flex-1 flex-col overflow-hidden rounded-sm border bg-suave/60 ${activa ? "border-cian ring-1 ring-cian" : "border-regla"}`}
            >
              <div className={`flex items-center gap-2 px-3 py-2 ${HEAD[estado]}`}>
                <span className="text-[10px] font-bold uppercase tracking-widest">{ETIQUETA_PIEZA[estado]}</span>
                <span className="ml-auto font-mono text-[11px] opacity-70">{cards.length}</span>
              </div>

              <div className="flex min-h-[56px] flex-1 flex-col gap-2 p-2">
                {cards.map((c) => (
                  <article
                    key={c.id}
                    draggable
                    onDragStart={() => setArrastrando(c.id)}
                    onDragEnd={() => { setArrastrando(null); setSobre(null); }}
                    className={`cursor-grab rounded-sm border border-regla bg-hoja p-2.5 active:cursor-grabbing ${arrastrando === c.id ? "opacity-50" : ""}`}
                  >
                    <div className="-ml-1.5 flex flex-wrap items-center gap-y-1">
                      <TipoBadges tipos={[c.tipo as TipoCotizacion]} />
                    </div>
                    <div className="mt-1 flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-snug">{c.titulo}</span>
                      <Link href={`/taller/${c.ordenId}`} className="shrink-0 font-mono text-[11px] text-kraft hover:text-cian">
                        N° {c.ordenNumero}
                      </Link>
                    </div>
                    {c.cliente && (
                      <div className="mt-0.5 truncate text-[11px] text-kraft">{c.cliente}</div>
                    )}
                    {c.proveedorNombre && (
                      <div className="mt-0.5 truncate text-[11px] text-kraft">Proveedor: {c.proveedorNombre}</div>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-suave pt-2">
                      <span className="font-mono text-[11px] text-kraft">{c.cantidad} pzs</span>
                      <span className="font-mono text-[11px] text-kraft">{fmtFecha(c.fechaEntrega)}</span>
                    </div>
                    <select
                      value={c.estado}
                      onChange={(e) => mover(c.id, e.target.value as EstadoPieza)}
                      aria-label="Cambiar estado"
                      className="mt-1.5 w-full rounded-sm border border-regla bg-hoja px-1.5 py-1 text-[11px] text-kraft outline-none focus:border-cian"
                    >
                      {estados.map((e) => (
                        <option key={e} value={e}>{ETIQUETA_PIEZA[e]}</option>
                      ))}
                    </select>
                  </article>
                ))}
                {cards.length === 0 && (
                  <div className="px-1 py-5 text-center text-[11px] text-kraft">Sin piezas</div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
