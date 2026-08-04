"use client";

import { useRef, useState, useTransition } from "react";
import type { Conteos, ResultadoImport } from "@/lib/migracion";
import type { Reconciliacion } from "@/lib/trello";
import {
  resetAction, previewCrmAction, importarCrmAction, previewProdAction, importarProduccionAction,
} from "@/app/actions/migracion";

/** Panel de migración inicial (solo ADMIN): borra e importa desde el navegador. */
export function PanelMigracion({ conteos }: { conteos: Conteos }) {
  return (
    <div className="mt-8 space-y-6">
      <Paso n={1} titulo="Borrar los datos actuales">
        <Reset conteos={conteos} />
      </Paso>
      <Paso n={2} titulo="Importar Oportunidades (tablero CRM de Trello)">
        <CajaImport
          preview={previewCrmAction}
          importar={importarCrmAction}
          flags={[
            { name: "perdidos", label: "Incluir «Perdidos»" },
            { name: "done", label: "Incluir «Done»" },
            { name: "clientes", label: "Incluir «Clientes»" },
          ]}
          etiquetaBoton="Importar oportunidades"
        />
      </Paso>
      <Paso n={3} titulo="Importar Órdenes en proceso (tablero Producción de Trello)">
        <CajaImport
          preview={previewProdAction}
          importar={importarProduccionAction}
          flags={[{ name: "cobrado", label: "Incluir histórico «Cobrado»" }]}
          etiquetaBoton="Importar órdenes"
        />
      </Paso>
    </div>
  );
}

function Paso({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-regla bg-hoja">
      <h2 className="flex items-center gap-2 border-b border-regla bg-suave px-4 py-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-tinta text-[11px] font-bold text-hoja">{n}</span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-kraft">{titulo}</span>
      </h2>
      <div className="p-4">{children}</div>
    </section>
  );
}

/* ─────────────────────────── paso 1: reset ─────────────────────────── */

function Reset({ conteos }: { conteos: Conteos }) {
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function borrar() {
    if (!window.confirm("Esto borra TODAS las cotizaciones, órdenes de producción y oportunidades. ¿Continuar?")) return;
    const fd = new FormData();
    fd.set("confirmar", confirmar);
    iniciar(async () => {
      const r = await resetAction(fd);
      if (r.error) { setError(r.error); setOk(null); }
      else {
        setError(null);
        setOk(`Borrado: ${r.resultado?.ordenes ?? 0} órdenes, ${r.resultado?.cotizaciones ?? 0} cotizaciones, ${r.resultado?.oportunidades ?? 0} oportunidades, ${r.resultado?.actividades ?? 0} actividades.`);
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-tinta">
        Hay <b>{conteos.cotizaciones}</b> cotizaciones (con <b>{conteos.ordenes}</b> órdenes / {conteos.piezas} piezas),
        {" "}<b>{conteos.oportunidades}</b> oportunidades y {conteos.actividades} actividades.
      </p>
      <p className="rounded-sm border border-[#E7B8B8] bg-[#FDECED] px-3 py-2 text-xs text-[#8A1C1C]">
        Borra cotizaciones, órdenes de producción, oportunidades y actividades (y sus comentarios/adjuntos).
        Conserva catálogo, configuración, usuarios, clientes e inventario. <b>No se puede deshacer.</b>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-[11px] font-medium text-kraft">Escribe <b className="font-mono">BORRAR</b> para confirmar:</label>
        <input
          value={confirmar} onChange={(e) => setConfirmar(e.target.value)}
          className="w-32 rounded-sm border border-regla bg-white px-2 py-1 font-mono text-sm outline-none focus:border-cian"
        />
        <button
          onClick={borrar} disabled={pendiente || confirmar.trim().toUpperCase() !== "BORRAR"}
          className="rounded-sm bg-[#8A1C1C] px-4 py-1.5 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-40"
        >
          {pendiente ? "Borrando…" : "Borrar todo"}
        </button>
      </div>
      {error && <p className="text-xs text-[#8A1C1C]">{error}</p>}
      {ok && <p className="rounded-sm border border-regla bg-[#EDF9F1] px-3 py-2 text-xs font-medium text-exito">✅ {ok}</p>}
    </div>
  );
}

/* ─────────────────────────── pasos 2 y 3: importar ─────────────────────────── */

type AccionFile = (fd: FormData) => Promise<{ error: string | null; recon?: Reconciliacion }>;
type AccionImport = (fd: FormData) => Promise<{ error: string | null; resultado?: ResultadoImport }>;

function CajaImport({
  preview, importar, flags, etiquetaBoton,
}: {
  preview: AccionFile;
  importar: AccionImport;
  flags: { name: string; label: string }[];
  etiquetaBoton: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const [recon, setRecon] = useState<Reconciliacion | null>(null);
  const [resultado, setResultado] = useState<ResultadoImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function fd() {
    const f = new FormData();
    if (archivo) f.set("archivo", archivo);
    for (const fl of flags) if (marcados[fl.name]) f.set(fl.name, "on");
    return f;
  }
  function previsualizar() {
    setResultado(null); setError(null);
    iniciar(async () => {
      const r = await preview(fd());
      if (r.error) setError(r.error); else setRecon(r.recon ?? null);
    });
  }
  function aplicar() {
    if (!window.confirm("¿Importar ahora en la base de datos?")) return;
    setError(null);
    iniciar(async () => {
      const r = await importar(fd());
      if (r.error) setError(r.error);
      else { setResultado(r.resultado ?? null); setRecon(r.resultado?.recon ?? null); }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef} type="file" accept=".json,application/json"
          onChange={(e) => { setArchivo(e.target.files?.[0] ?? null); setRecon(null); setResultado(null); }}
          className="text-sm"
        />
        {flags.map((fl) => (
          <label key={fl.name} className="inline-flex items-center gap-1 text-[11px] text-kraft">
            <input type="checkbox" checked={!!marcados[fl.name]}
              onChange={(e) => setMarcados((m) => ({ ...m, [fl.name]: e.target.checked }))} />
            {fl.label}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={previsualizar} disabled={pendiente || !archivo}
          className="rounded-sm border border-regla px-3 py-1.5 text-sm font-medium text-kraft hover:border-tinta hover:text-tinta disabled:opacity-40">
          {pendiente ? "…" : "Previsualizar"}
        </button>
        <button onClick={aplicar} disabled={pendiente || !archivo || !recon}
          className="rounded-sm bg-tinta px-4 py-1.5 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-40">
          {etiquetaBoton}
        </button>
      </div>

      {error && <p className="text-xs text-[#8A1C1C]">{error}</p>}

      {recon && (
        <div className="overflow-x-auto rounded-sm border border-regla">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-regla bg-suave text-left text-[10px] uppercase tracking-widest text-kraft">
                <th className="px-3 py-1.5 font-bold">Lista</th>
                <th className="px-3 py-1.5 text-right font-bold">Tarjetas</th>
                <th className="px-3 py-1.5 font-bold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-suave">
              {recon.listas.map((l) => (
                <tr key={l.nombre}>
                  <td className="px-3 py-1.5">{l.nombre}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{l.total}</td>
                  <td className={`px-3 py-1.5 ${l.accion.startsWith("Omitida") ? "text-kraft" : "text-tinta"}`}>{l.accion}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-regla px-3 py-1.5 text-[11px] text-kraft">
            {recon.totalActivas} tarjetas = <b>{recon.aCrear} a importar</b> + {recon.omitidas} omitidas
            {recon.enArchivadas ? ` · ${recon.enArchivadas} en listas archivadas` : ""} · {recon.cuadra ? "✓ cuadra" : "✗ descuadre"}
          </p>
        </div>
      )}

      {resultado && (
        <p className="rounded-sm border border-regla bg-[#EDF9F1] px-3 py-2 text-xs font-medium text-exito">
          ✅ Importado: {resultado.creados} creados, {resultado.duplicados} ya existían (de {resultado.esperados} esperados).
          {resultado.creados + resultado.duplicados === resultado.esperados ? " Nada se perdió." : " ⚠️ Revisa el descuadre."}
        </p>
      )}
    </div>
  );
}
