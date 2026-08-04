"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { EstadoCotizacion, ProspectoEstado } from "@prisma/client";
import { usd } from "@/lib/calculo";
import { actualizarProspectoAction } from "@/app/actions/crm";
import { TipoBadges } from "./TipoBadges";
import type { FilaTablero, FilaOportunidad } from "./TableroCotizaciones";

// Etiqueta y color de estado, replicados aquí (EstadoBadge vive en un módulo
// server-only y no puede importarse a un componente cliente). Mismo mapa visual.
const ESTADO_CLASE: Record<EstadoCotizacion, string> = {
  BORRADOR: "bg-suave text-kraft",
  PENDIENTE: "bg-[#FFF9E6] text-[#5C4A00]",
  APROBADA: "bg-[#EDE9FB] text-[#5B3E8F]",
  ENVIADA: "bg-[#E6F4F8] text-cian",
  GANADA: "bg-[#EDF9F1] text-exito",
  RECHAZADA: "bg-[#FDEDED] text-[#8A1C1C]",
  VENCIDA: "bg-[#FBEBD9] text-[#8A4B00]",
};
const ESTADO_LABEL: Record<EstadoCotizacion, string> = {
  BORRADOR: "Cotización",
  PENDIENTE: "Pendiente de aprobación",
  APROBADA: "Aprobada",
  ENVIADA: "Enviada al cliente",
  GANADA: "Ganada",
  RECHAZADA: "Perdida",
  VENCIDA: "Vencida",
};

function BadgeEstado({ estado }: { estado: EstadoCotizacion }) {
  return (
    <span className={`inline-block shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${ESTADO_CLASE[estado]}`}>
      {ESTADO_LABEL[estado]}
    </span>
  );
}

/**
 * Vista previa que se abre al hacer clic en el cuerpo de una tarjeta del tablero.
 * Es solo una prueba de interacción: la cotización se muestra en modo lectura (con
 * su precio de venta, sin costos ni margen) y la oportunidad en modo edición
 * (nombre, cliente, contacto, detalle y estado NUEVO/CONTACTADO). Cierra con
 * Escape, clic en el telón o el botón ✕.
 */

export type PreviewSel =
  | { tipo: "cotizacion"; fila: FilaTablero }
  | { tipo: "oportunidad"; op: FilaOportunidad };

// Solo los dos estados «activos» son editables desde esta columna; convertir o
// descartar tienen sus propios accesos.
const ESTADOS_EDITABLES: { estado: ProspectoEstado; label: string }[] = [
  { estado: "NUEVO", label: "Nuevo" },
  { estado: "CONTACTADO", label: "Contactado" },
];

export function TarjetaPreview({
  sel,
  onClose,
  onGuardado,
  onDescartar,
}: {
  sel: PreviewSel;
  onClose: () => void;
  onGuardado: (op: FilaOportunidad) => void;
  onDescartar: (id: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // Clic fuera del panel (en el telón) cierra.
        if (!panelRef.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-sm border border-regla bg-hoja"
      >
        {sel.tipo === "cotizacion" ? (
          <VistaCotizacion fila={sel.fila} onClose={onClose} />
        ) : (
          <EditarOportunidad
            op={sel.op}
            onClose={onClose}
            onGuardado={onGuardado}
            onDescartar={onDescartar}
          />
        )}
      </div>
    </div>
  );
}

function Cabecera({ eyebrow, onClose }: { eyebrow: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-regla bg-suave px-4 py-2.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">{eyebrow}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="-mr-1 rounded-sm p-1 text-kraft hover:bg-regla/40 hover:text-tinta"
      >
        <X size={15} />
      </button>
    </div>
  );
}

function VistaCotizacion({ fila, onClose }: { fila: FilaTablero; onClose: () => void }) {
  return (
    <>
      <Cabecera eyebrow={`Cotización · N° ${fila.numero}`} onClose={onClose} />
      <div className="overflow-y-auto px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 break-words text-base font-bold leading-snug tracking-tight">
            {fila.titulo}
          </h2>
          <BadgeEstado estado={fila.estado} />
        </div>

        {fila.clienteNombre && (
          <p className="mt-1 text-sm text-kraft">{fila.clienteNombre}</p>
        )}

        {fila.tipos.length > 0 && (
          <div className="-ml-1.5 mt-2 flex flex-wrap items-center gap-y-1">
            <TipoBadges tipos={fila.tipos} />
          </div>
        )}

        <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-suave pt-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">
            Precio de venta
          </span>
          <span className="font-mono text-lg font-bold tabular">{usd(fila.ventaTotal)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-regla px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-sm border border-regla px-3 py-1.5 text-sm font-medium text-kraft hover:border-tinta hover:text-tinta"
        >
          Cerrar
        </button>
        <Link
          href={`/cotizaciones/${fila.id}`}
          className="rounded-sm bg-tinta px-3 py-1.5 text-sm font-bold text-hoja hover:opacity-90"
        >
          Abrir cotización
        </Link>
      </div>
    </>
  );
}

function EditarOportunidad({
  op,
  onClose,
  onGuardado,
  onDescartar,
}: {
  op: FilaOportunidad;
  onClose: () => void;
  onGuardado: (op: FilaOportunidad) => void;
  onDescartar: (id: string) => void;
}) {
  const [nombre, setNombre] = useState(op.nombre);
  const [clienteNombre, setClienteNombre] = useState(op.clienteNombre ?? "");
  const [contacto, setContacto] = useState(op.contacto ?? "");
  const [detalle, setDetalle] = useState(op.detalle ?? "");
  const [estado, setEstado] = useState<ProspectoEstado>(op.estado);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [pendiente, startTransition] = useTransition();

  function guardar() {
    setError(null);
    setGuardado(false);
    if (!nombre.trim()) {
      setError("El nombre de la oportunidad es obligatorio.");
      return;
    }
    startTransition(async () => {
      const res = await actualizarProspectoAction(op.id, {
        nombre: nombre.trim(),
        clienteNombre: clienteNombre.trim() || null,
        contacto: contacto.trim() || null,
        detalle: detalle.trim() || null,
        estado,
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
      onGuardado({
        id: op.id,
        nombre: nombre.trim(),
        clienteNombre: clienteNombre.trim() || null,
        contacto: contacto.trim() || null,
        detalle: detalle.trim() || null,
        estado,
      });
      setGuardado(true);
    });
  }

  const input =
    "mt-1 block w-full rounded-sm border border-regla bg-white px-2.5 py-1.5 text-base outline-none focus:border-cian sm:text-sm";
  const label = "text-[10px] font-bold uppercase tracking-widest text-kraft";

  return (
    <>
      <Cabecera eyebrow="Oportunidad · Editar" onClose={onClose} />

      <div className="overflow-y-auto px-4 py-4">
        {error && (
          <div className="mb-3 rounded-sm border border-[#E4B3B3] bg-[#FDECED] px-3 py-2 text-xs text-[#8A1C1C]">
            {error}
          </div>
        )}
        {guardado && !error && (
          <div className="mb-3 rounded-sm border border-[#BFE3CC] bg-[#EDF9F1] px-3 py-2 text-xs text-exito">
            Guardado.
          </div>
        )}

        <div className="space-y-3">
          <label className="block">
            <span className={label}>Nombre</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={input}
              placeholder="Trabajo o encargo"
            />
          </label>
          <label className="block">
            <span className={label}>Cliente</span>
            <input
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className={input}
              placeholder="Nombre del cliente"
            />
          </label>
          <label className="block">
            <span className={label}>Contacto</span>
            <input
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              className={`${input} font-mono`}
              placeholder="Teléfono o correo"
            />
          </label>
          <label className="block">
            <span className={label}>Detalle</span>
            <textarea
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              rows={3}
              className={`${input} resize-y`}
              placeholder="Notas de la oportunidad"
            />
          </label>
          <label className="block">
            <span className={label}>Estado</span>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as ProspectoEstado)}
              className={input}
            >
              {ESTADOS_EDITABLES.map((o) => (
                <option key={o.estado} value={o.estado}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-suave pt-3">
          <Link
            href="/cotizacion-nueva"
            className="text-[11px] font-medium text-cian hover:underline"
          >
            Convertir a cotización
          </Link>
          <button
            type="button"
            onClick={() => onDescartar(op.id)}
            className="ml-auto text-[11px] font-medium text-kraft hover:text-[#8A1C1C]"
          >
            Descartar
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-regla px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-sm border border-regla px-3 py-1.5 text-sm font-medium text-kraft hover:border-tinta hover:text-tinta"
        >
          Cerrar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={pendiente}
          className="rounded-sm bg-tinta px-3 py-1.5 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-40"
        >
          {pendiente ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </>
  );
}
