"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { EstadoCotizacion, TipoCotizacion, ProspectoEstado } from "@prisma/client";
import { usd } from "@/lib/calculo";
import { moverEstadoAction } from "@/app/actions/cotizaciones";
import { moverProspectoAction } from "@/app/actions/crm";
import { TipoBadges } from "./TipoBadges";
import { TarjetaPreview, type PreviewSel } from "./TarjetaPreview";

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
  tipos: TipoCotizacion[];
};

/** Oportunidad = prospecto activo del CRM (estados NUEVO/CONTACTADO). Vive en la
 *  primera columna del tablero; sigue siendo un Prospecto hasta que se cotiza. */
export type FilaOportunidad = {
  id: string;
  nombre: string;
  clienteNombre: string | null;
  contacto: string | null;
  detalle: string | null;
  estado: ProspectoEstado;
};

// Cada columna hereda el color del badge de su estado (mismo lenguaje visual que
// EstadoBadge), tintando solo la cabecera; el cuerpo queda neutro.
const COLUMNAS: {
  label: string; estado: EstadoCotizacion; incluye: EstadoCotizacion[]; head: string;
}[] = [
  { label: "Cotización", estado: "BORRADOR", incluye: ["BORRADOR"], head: "bg-suave text-kraft" },
  { label: "Pendiente de aprobación", estado: "PENDIENTE", incluye: ["PENDIENTE"], head: "bg-[#FFF9E6] text-[#5C4A00]" },
  { label: "Aprobadas", estado: "APROBADA", incluye: ["APROBADA"], head: "bg-[#EDE9FB] text-[#5B3E8F]" },
  { label: "Enviadas al cliente", estado: "ENVIADA", incluye: ["ENVIADA"], head: "bg-[#E6F4F8] text-cian" },
  { label: "Ganadas", estado: "GANADA", incluye: ["GANADA"], head: "bg-[#EDF9F1] text-exito" },
  { label: "Perdidas", estado: "RECHAZADA", incluye: ["RECHAZADA", "VENCIDA"], head: "bg-[#FDECED] text-[#8A1C1C]" },
];

// Opciones del selector de cada tarjeta (todas las metas posibles).
const OPCIONES: { estado: EstadoCotizacion; label: string }[] = [
  { estado: "BORRADOR", label: "Cotización" },
  { estado: "PENDIENTE", label: "Pendiente de aprobación" },
  { estado: "APROBADA", label: "Aprobada (interna)" },
  { estado: "ENVIADA", label: "Enviada al cliente" },
  { estado: "GANADA", label: "Ganada" },
  { estado: "RECHAZADA", label: "Perdida" },
  { estado: "VENCIDA", label: "Vencida" },
];

export function TableroCotizaciones({
  usuario,
  filasIniciales,
  oportunidadesIniciales = [],
}: {
  usuario: { id: string; rol: string };
  filasIniciales: FilaTablero[];
  oportunidadesIniciales?: FilaOportunidad[];
}) {
  const [filas, setFilas] = useState<FilaTablero[]>(filasIniciales);
  const [oportunidades, setOportunidades] = useState<FilaOportunidad[]>(oportunidadesIniciales);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewSel | null>(null);
  const [, startTransition] = useTransition();

  // Refleja en la tarjeta los cambios guardados en la oportunidad desde la vista
  // previa (estado local, sin recargar). Si pasó a un estado no activo, se retira.
  function oportunidadActualizada(op: FilaOportunidad) {
    setOportunidades((os) => os.map((o) => (o.id === op.id ? op : o)));
    setPreview({ tipo: "oportunidad", op });
  }

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

  // Descartar una oportunidad: mueve el prospecto a DESCARTADO en el CRM (no la
  // convierte en cotización). Se retira de la columna de forma optimista.
  function descartar(id: string) {
    const prev = oportunidades;
    setOportunidades((os) => os.filter((o) => o.id !== id));
    setPreview(null);
    setError(null);
    startTransition(async () => {
      const res = await moverProspectoAction(id, "DESCARTADO");
      if (res?.error) { setOportunidades(prev); setError(res.error); }
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
        {/* Columna 0 — Oportunidades (prospectos activos del CRM). No participa en
            el arrastre de estados: solo lista y ofrece convertir o descartar. */}
        <section className="flex min-w-[188px] flex-1 flex-col overflow-hidden rounded-sm border border-regla bg-suave/60">
          <div className="flex items-center gap-2 bg-[#E6F4F8] px-3 py-2 text-cian">
            <span className="text-[10px] font-bold uppercase tracking-widest">Oportunidades</span>
            <span className="ml-auto font-mono text-[11px] opacity-70">{oportunidades.length}</span>
          </div>

          <div className="flex max-h-[70vh] min-h-[56px] flex-1 flex-col gap-2 overflow-y-auto p-2">
            {oportunidades.map((o) => (
              <article
                key={o.id}
                className="rounded-sm border border-regla bg-hoja"
              >
                <div
                  role="button"
                  tabIndex={0}
                  title="Ver / editar oportunidad"
                  onClick={() => setPreview({ tipo: "oportunidad", op: o })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setPreview({ tipo: "oportunidad", op: o });
                    }
                  }}
                  className="cursor-pointer rounded-t-sm p-2.5 transition-colors hover:bg-suave/50"
                >
                  <div
                    className="line-clamp-2 break-words text-sm font-medium leading-snug"
                  >
                    {o.nombre}
                  </div>
                  {o.clienteNombre && (
                    <div className="mt-0.5 truncate text-[11px] text-kraft">{o.clienteNombre}</div>
                  )}
                  {o.contacto && (
                    <div className="mt-0.5 truncate font-mono text-[11px] text-kraft">{o.contacto}</div>
                  )}
                  {o.detalle && (
                    <p className="mt-1 truncate text-[11px] text-kraft">{o.detalle}</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-suave px-2.5 pb-2 pt-2">
                  <Link
                    href="/cotizacion-nueva"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[11px] font-medium text-cian hover:underline"
                  >
                    Convertir a cotización
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); descartar(o.id); }}
                    className="rounded-sm px-1.5 py-1 text-[11px] font-medium text-kraft hover:text-[#8A1C1C]"
                  >
                    Descartar
                  </button>
                </div>
              </article>
            ))}
            {oportunidades.length === 0 && (
              <div className="px-1 py-5 text-center text-[11px] text-kraft">Sin oportunidades</div>
            )}
          </div>
        </section>

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
              className={`flex min-w-[188px] flex-1 flex-col overflow-hidden rounded-sm border bg-suave/60 ${activa ? "border-cian ring-1 ring-cian" : "border-regla"}`}
            >
              <div className={`flex items-center gap-2 px-3 py-2 ${col.head}`}>
                <span className="text-[10px] font-bold uppercase tracking-widest">{col.label}</span>
                <span className="ml-auto font-mono text-[11px] opacity-70">{cards.length}</span>
              </div>

              <div className="flex max-h-[70vh] min-h-[56px] flex-1 flex-col gap-2 overflow-y-auto p-2">
                {cards.map((c) => (
                  <article
                    key={c.id}
                    draggable
                    onDragStart={() => setArrastrando(c.id)}
                    onDragEnd={() => { setArrastrando(null); setSobre(null); }}
                    className={`cursor-grab rounded-sm border border-regla bg-hoja active:cursor-grabbing ${arrastrando === c.id ? "opacity-50" : ""}`}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      title="Ver vista previa"
                      onClick={() => setPreview({ tipo: "cotizacion", fila: c })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setPreview({ tipo: "cotizacion", fila: c });
                        }
                      }}
                      className="cursor-pointer rounded-t-sm p-2.5 transition-colors hover:bg-suave/50"
                    >
                      {c.tipos.length > 0 && (
                        <div className="-ml-1.5 flex flex-wrap items-center gap-y-1">
                          <TipoBadges tipos={c.tipos} />
                        </div>
                      )}
                      <div className="mt-1 flex items-start justify-between gap-2">
                        <span
                          className="line-clamp-2 min-w-0 break-words text-sm font-medium leading-snug"
                        >
                          {c.titulo}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-kraft">N° {c.numero}</span>
                      </div>
                      {c.clienteNombre && (
                        <div className="mt-0.5 truncate text-[11px] text-kraft">{c.clienteNombre}</div>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2 border-t border-suave pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Total</span>
                        <span className="font-mono text-sm font-bold">{usd(c.ventaTotal)}</span>
                      </div>
                    </div>

                    <div className="px-2.5 pb-2.5">
                      <select
                        value={c.estado}
                        onChange={(e) => mover(c.id, e.target.value as EstadoCotizacion)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        aria-label="Cambiar estado"
                        className="w-full rounded-sm border border-regla bg-hoja px-1.5 py-1 text-[11px] text-kraft outline-none focus:border-cian"
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
        Haz clic en el cuerpo de una tarjeta para ver su vista previa.
      </p>

      {preview && (
        <TarjetaPreview
          sel={preview}
          usuario={usuario}
          onClose={() => setPreview(null)}
          onGuardado={oportunidadActualizada}
          onDescartar={descartar}
        />
      )}
    </div>
  );
}
