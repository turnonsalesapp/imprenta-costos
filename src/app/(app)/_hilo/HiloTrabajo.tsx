"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Trash2, Download, Paperclip, AlertTriangle, RefreshCw, X } from "lucide-react";
import {
  agregarComentarioAction, eliminarComentarioAction,
  subirAdjuntoAction, eliminarAdjuntoAction,
} from "@/app/actions/comentarios";

/**
 * Hilo del trabajo (cliente): comentarios e información + adjuntos. Mismo hilo en
 * la cotización (ADMIN/VENDEDOR) y en la orden (TALLER). NO muestra precios: es
 * seguro para el taller. Estética de la app: filete, rounded-sm, cifras mono.
 */

export type ComentarioUI = {
  id: string;
  autorId: string | null;
  autorNombre: string;
  texto: string;
  fecha: string;
};

export type AdjuntoUI = {
  id: string;
  autorId: string | null;
  autorNombre: string;
  nombre: string;
  tipo: string;
  tamano: number;
  fecha: string;
};

/** Destino del hilo: exactamente una cotización O una oportunidad (prospecto). */
export type DestinoHilo =
  | { cotizacionId: string; prospectoId?: undefined }
  | { prospectoId: string; cotizacionId?: undefined };

type Props = DestinoHilo & {
  usuario: { id: string; rol: string };
  comentarios: ComentarioUI[];
  adjuntos: AdjuntoUI[];
  /** Se invoca tras crear/borrar en el hilo. Útil cuando el hilo se muestra en un
   *  modal (que no re-renderiza por revalidatePath) y debe recargarse a mano. */
  onCambio?: () => void;
};

/** Escribe en el FormData el campo del destino que corresponda. */
function setDestino(fd: FormData, destino: DestinoHilo): void {
  if (destino.cotizacionId) fd.set("cotizacionId", destino.cotizacionId);
  else if (destino.prospectoId) fd.set("prospectoId", destino.prospectoId);
}

function puedeBorrar(usuario: { id: string; rol: string }, autorId: string | null): boolean {
  const esAdmin = usuario.rol === "ADMIN" || usuario.rol === "SUPERADMIN";
  return esAdmin || (autorId != null && autorId === usuario.id);
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function HiloTrabajo({ usuario, comentarios, adjuntos, onCambio, ...destino }: Props) {
  return (
    <div className="mt-8 space-y-6">
      <Comentarios destino={destino} usuario={usuario} comentarios={comentarios} onCambio={onCambio} />
      <Adjuntos destino={destino} usuario={usuario} adjuntos={adjuntos} onCambio={onCambio} />
    </div>
  );
}

/* ─────────────────────────── comentarios ─────────────────────────── */

function Comentarios({
  destino, usuario, comentarios, onCambio,
}: {
  destino: DestinoHilo;
  usuario: { id: string; rol: string };
  comentarios: ComentarioUI[];
  onCambio?: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function enviar() {
    const valor = texto.trim();
    if (!valor) return;
    const fd = new FormData();
    setDestino(fd, destino);
    fd.set("texto", valor);
    iniciar(async () => {
      const r = await agregarComentarioAction(fd);
      if (r.error) setError(r.error);
      else {
        setError(null);
        setTexto("");
        onCambio?.();
      }
    });
  }

  return (
    <section className="rounded-sm border border-regla bg-hoja">
      <h2 className="border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
        Comentarios e información
      </h2>

      {comentarios.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-kraft">
          Aún no hay comentarios. Escribe el primero abajo.
        </p>
      ) : (
        <ul className="divide-y divide-suave">
          {comentarios.map((c) => (
            <li key={c.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold">{c.autorNombre}</span>
                  <span className="font-mono text-[11px] text-kraft">{c.fecha}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{c.texto}</p>
              </div>
              {puedeBorrar(usuario, c.autorId) && (
                <BotonBorrar
                  accion={eliminarComentarioAction}
                  id={c.id}
                  confirmacion="¿Eliminar este comentario?"
                  etiqueta="Eliminar comentario"
                  onCambio={onCambio}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-regla p-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          placeholder="Añade un comentario o información del trabajo…"
          className="block w-full rounded-sm border border-regla bg-white px-3 py-2 text-base outline-none focus:border-cian sm:text-sm"
        />
        {error && <p className="mt-1 text-xs text-[#8A1C1C]">{error}</p>}
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={enviar}
            disabled={pendiente || !texto.trim()}
            className="rounded-sm bg-tinta px-4 py-2 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-40"
          >
            {pendiente ? "Guardando…" : "Comentar"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── adjuntos ─────────────────────────── */

function Adjuntos({
  destino, usuario, adjuntos, onCambio,
}: {
  destino: DestinoHilo;
  usuario: { id: string; rol: string };
  adjuntos: AdjuntoUI[];
  onCambio?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ultimo, setUltimo] = useState<File | null>(null); // para reintentar
  const [pendiente, iniciar] = useTransition();

  function subir(file: File) {
    setUltimo(file);
    const fd = new FormData();
    setDestino(fd, destino);
    fd.set("archivo", file);
    iniciar(async () => {
      const r = await subirAdjuntoAction(fd);
      if (r.error) {
        setError(r.error); // se conserva `ultimo` para reintentar
      } else {
        setError(null);
        setUltimo(null);
        onCambio?.();
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <section className="rounded-sm border border-regla bg-hoja">
      <div className="flex items-center justify-between gap-2 border-b border-regla bg-suave px-4 py-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-kraft">Adjuntos</h2>
        <label className="cursor-pointer">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-regla bg-white px-2.5 py-1 text-xs font-medium text-kraft hover:border-tinta hover:text-tinta">
            <Paperclip size={14} />
            {pendiente ? "Subiendo…" : "Subir archivo"}
          </span>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            disabled={pendiente}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subir(f);
            }}
          />
        </label>
      </div>

      {/* Aviso de error visible, con reintentar (conserva el último archivo). */}
      {error && (
        <div className="mx-3 mt-3 flex items-start gap-2 rounded-sm border border-[#E7B8B8] bg-[#FDECED] px-3 py-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#8A1C1C]" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#8A1C1C]">No se pudo subir el archivo</p>
            <p className="mt-0.5 break-words text-xs text-[#8A1C1C]">{error}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {ultimo && (
              <button
                type="button"
                onClick={() => ultimo && subir(ultimo)}
                disabled={pendiente}
                className="inline-flex items-center gap-1 rounded-sm border border-[#8A1C1C] px-2 py-1 text-[11px] font-bold text-[#8A1C1C] hover:bg-[#8A1C1C] hover:text-hoja disabled:opacity-40"
              >
                <RefreshCw size={12} />
                {pendiente ? "Reintentando…" : "Reintentar"}
              </button>
            )}
            <button
              type="button"
              onClick={() => { setError(null); setUltimo(null); }}
              aria-label="Descartar aviso"
              className="rounded-sm p-1 text-[#8A1C1C] hover:bg-[#F6D9DA]"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {adjuntos.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-kraft">
          Aún no hay adjuntos. Sube artes, referencias o pruebas (máx. 8 MB).
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3">
          {adjuntos.map((a) => {
            const href = `/api/adjuntos/${a.id}`;
            const esImagen = a.tipo.startsWith("image/");
            return (
              <li key={a.id} className="flex flex-col rounded-sm border border-regla bg-hoja">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-sm bg-suave"
                  title={a.nombre}
                >
                  {esImagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={href} alt={a.nombre} className="h-full w-full object-cover" />
                  ) : (
                    <FileText size={28} className="text-kraft" />
                  )}
                </a>
                <div className="flex items-start gap-1 p-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium" title={a.nombre}>
                      {a.nombre}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-kraft">
                      <span>{fmtBytes(a.tamano)}</span>
                      <a href={href} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 hover:text-tinta" title="Descargar">
                        <Download size={12} />
                      </a>
                    </div>
                  </div>
                  {puedeBorrar(usuario, a.autorId) && (
                    <BotonBorrar
                      accion={eliminarAdjuntoAction}
                      id={a.id}
                      confirmacion={`¿Eliminar «${a.nombre}»?`}
                      etiqueta="Eliminar adjunto"
                      onCambio={onCambio}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ─────────────────────────── borrar (comentario/adjunto) ─────────────────────────── */

function BotonBorrar({
  accion, id, confirmacion, etiqueta, onCambio,
}: {
  accion: (fd: FormData) => Promise<{ error: string | null }>;
  id: string;
  confirmacion: string;
  etiqueta: string;
  onCambio?: () => void;
}) {
  const [pendiente, iniciar] = useTransition();
  function borrar() {
    if (!window.confirm(confirmacion)) return;
    const fd = new FormData();
    fd.set("id", id);
    iniciar(async () => {
      const r = await accion(fd);
      if (r.error) window.alert(r.error);
      else onCambio?.();
    });
  }
  return (
    <button
      type="button"
      onClick={borrar}
      disabled={pendiente}
      aria-label={etiqueta}
      title={etiqueta}
      className="shrink-0 rounded-sm p-1.5 text-kraft hover:bg-suave hover:text-[#C0563B] disabled:opacity-40"
    >
      <Trash2 size={15} />
    </button>
  );
}
