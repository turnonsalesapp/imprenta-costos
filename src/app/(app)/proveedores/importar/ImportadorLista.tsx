"use client";

import { useRef, useState, useTransition } from "react";
import { previewImportAction, confirmarImportAction } from "@/app/actions/proveedores";
import type { DiffFila, FilaImport } from "@/lib/proveedores";
import { usd } from "@/lib/calculo";

type Proveedor = { id: string; nombre: string };

const ESTADO_LABEL: Record<DiffFila["estado"], string> = {
  sube: "Sube",
  baja: "Baja",
  igual: "Igual",
  nuevo: "Nuevo",
  sin_papel: "Sin papel",
};

const ESTADO_BADGE: Record<DiffFila["estado"], string> = {
  sube: "bg-[#FFF9E6] text-[#5C4A00]",   // ámbar
  baja: "bg-[#EDF9F1] text-exito",       // verde
  igual: "bg-suave text-kraft",          // neutro
  nuevo: "bg-[#E6F4F8] text-cian",       // cian
  sin_papel: "bg-[#FDEDED] text-[#8A1C1C]", // rojo
};

const ORDEN: DiffFila["estado"][] = ["sube", "baja", "igual", "nuevo", "sin_papel"];

function Badge({ estado }: { estado: DiffFila["estado"] }) {
  return (
    <span
      className={`inline-block rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${ESTADO_BADGE[estado]}`}
    >
      {ESTADO_LABEL[estado]}
    </span>
  );
}

/**
 * Flujo de importación de una lista de precios: previsualizar (dry-run) → revisar
 * el diff → confirmar. El client mantiene {diff, filas} del preview en estado.
 */
export function ImportadorLista({ proveedores }: { proveedores: Proveedor[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [proveedorId, setProveedorId] = useState("");
  const [preview, setPreview] = useState<{ diff: DiffFila[]; filas: FilaImport[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ aplicados: number; sinPapel: string[] } | null>(null);
  const [previewPend, startPreview] = useTransition();
  const [confirmPend, startConfirm] = useTransition();

  function previsualizar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResultado(null);
    setPreview(null);
    const fd = new FormData(e.currentTarget);
    startPreview(async () => {
      const r = await previewImportAction(fd);
      if (r.error) {
        setError(r.error);
        return;
      }
      setPreview({ diff: r.diff, filas: r.filas });
    });
  }

  function confirmar() {
    if (!preview) return;
    setError(null);
    startConfirm(async () => {
      const r = await confirmarImportAction(proveedorId, preview.filas);
      if (r.error) {
        setError(r.error);
        return;
      }
      setResultado({ aplicados: r.aplicados, sinPapel: r.sinPapel });
      setPreview(null);
      formRef.current?.reset();
    });
  }

  // Conteos por estado.
  const conteos = preview
    ? ORDEN.map((e) => ({ estado: e, n: preview.diff.filter((d) => d.estado === e).length })).filter((c) => c.n > 0)
    : [];

  const inCls =
    "mt-1 block w-full rounded-sm border border-regla bg-white px-3 py-2 text-base outline-none focus:border-cian sm:text-sm";
  const labelCls = "text-[10px] font-bold uppercase tracking-widest text-kraft";

  return (
    <div className="space-y-6">
      {/* Formulario de carga */}
      <form
        ref={formRef}
        onSubmit={previsualizar}
        className="grid grid-cols-1 gap-3 rounded-sm border border-regla bg-hoja p-4 sm:grid-cols-2"
      >
        <label className="block">
          <span className={labelCls}>Proveedor</span>
          <select
            name="proveedorId"
            required
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            className={inCls}
          >
            <option value="">Elige un proveedor…</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>Archivo (.xlsx)</span>
          <input
            type="file"
            name="archivo"
            accept=".xlsx"
            required
            className="mt-1 block w-full text-sm text-kraft file:mr-3 file:rounded-sm file:border file:border-regla file:bg-suave file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-tinta hover:file:border-tinta"
          />
        </label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={previewPend}
            className="rounded-sm bg-tinta px-4 py-2 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-40"
          >
            {previewPend ? "Leyendo…" : "Previsualizar"}
          </button>
          <a
            href="/api/proveedores/plantilla"
            className="text-sm text-kraft underline hover:text-tinta"
          >
            Descargar plantilla
          </a>
        </div>
      </form>

      {error && (
        <div className="rounded-sm border border-[#E8B4B4] bg-[#FDEDED] px-4 py-2 text-sm text-[#8A1C1C]">
          {error}
        </div>
      )}

      {resultado && (
        <div className="rounded-sm border border-regla bg-[#EDF9F1] px-4 py-3 text-sm text-exito">
          Importación aplicada: <b className="tabular font-mono">{resultado.aplicados}</b>{" "}
          {resultado.aplicados === 1 ? "precio actualizado" : "precios actualizados"}.
          {resultado.sinPapel.length > 0 && (
            <div className="mt-1 text-[13px] text-[#8A4B00]">
              {resultado.sinPapel.length} sin papel en el catálogo: {resultado.sinPapel.join(", ")}.
            </div>
          )}
        </div>
      )}

      {/* Diff */}
      {preview && (
        <section>
          {/* Resumen de conteos */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {conteos.map((c) => (
              <span key={c.estado} className="inline-flex items-center gap-1.5">
                <Badge estado={c.estado} />
                <span className="tabular font-mono text-xs text-kraft">{c.n}</span>
              </span>
            ))}
          </div>

          {preview.diff.length === 0 ? (
            <p className="rounded-sm border border-regla bg-hoja px-4 py-8 text-center text-sm text-kraft">
              El archivo no produjo filas comparables.
            </p>
          ) : (
            <>
              {/* Móvil (<md): tarjetas apiladas. */}
              <ul className="space-y-2 md:hidden">
                {preview.diff.map((d, i) => (
                  <li key={`${d.clave}-${i}`} className="rounded-sm border border-regla bg-hoja p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0">
                        <span className="font-mono text-[11px] text-kraft">{d.clave}</span>
                        <span className="ml-2 text-sm">{d.nombre}</span>
                      </span>
                      <Badge estado={d.estado} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 border-t border-suave pt-2">
                      <div>
                        <div className={labelCls}>Precio resma</div>
                        <div className="tabular mt-0.5 font-mono text-sm">
                          {d.estado === "sin_papel" ? "—" : usd(d.precioResma)}
                        </div>
                      </div>
                      <div>
                        <div className={labelCls}>Anterior</div>
                        <div className="tabular mt-0.5 font-mono text-sm text-kraft">
                          {d.anterior == null ? "—" : usd(d.anterior)}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Escritorio (≥md): tabla completa. */}
              <div className="hidden overflow-x-auto rounded-sm border border-regla bg-hoja md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-regla bg-suave text-left text-[10px] uppercase tracking-widest text-kraft">
                      <th className="px-4 py-2 font-bold">Clave</th>
                      <th className="px-4 py-2 font-bold">Nombre</th>
                      <th className="px-4 py-2 font-bold">Estado</th>
                      <th className="px-4 py-2 text-right font-bold">Precio resma</th>
                      <th className="px-4 py-2 text-right font-bold">Anterior</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-suave">
                    {preview.diff.map((d, i) => (
                      <tr key={`${d.clave}-${i}`}>
                        <td className="px-4 py-2 font-mono text-[13px] text-kraft">{d.clave}</td>
                        <td className="px-4 py-2">{d.nombre}</td>
                        <td className="px-4 py-2"><Badge estado={d.estado} /></td>
                        <td className="tabular px-4 py-2 text-right font-mono">
                          {d.estado === "sin_papel" ? "—" : usd(d.precioResma)}
                        </td>
                        <td className="tabular px-4 py-2 text-right font-mono text-kraft">
                          {d.anterior == null ? "—" : usd(d.anterior)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={confirmar}
                  disabled={confirmPend}
                  className="rounded-sm bg-tinta px-4 py-2 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-40"
                >
                  {confirmPend ? "Aplicando…" : "Confirmar importación"}
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
