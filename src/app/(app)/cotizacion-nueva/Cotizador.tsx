"use client";

import { useEffect, useState, useTransition } from "react";
import { Save, Trash2, X, Plus, Pencil } from "lucide-react";
import type { TipoCotizacion } from "@prisma/client";
import { fmtNum, usd, type Config } from "@/lib/calculo";
import type { ClienteSimple } from "@/lib/clientes";
import type { EquipoItem } from "@/lib/equipos";
import type { MaterialGFItem } from "@/lib/materiales-gf";
import type { ProductoGFItem } from "@/lib/productos-gf";
import type { ProductoPopItem } from "@/lib/productos-pop";
import {
  useDraft, leerDraft, agregarItemDraft, reemplazarItemDraft, quitarItemDraft,
  actualizarMetaDraft, vaciarDraft, type EmbedCotizador,
} from "@/lib/draft-cotizacion";
import {
  nuevoForm, nuevoFormProveedor, nuevoFormGranFormato, nuevoFormPersonalizado, nuevoFormOffset,
  type FormCotizacion, type FormProveedor, type FormGranFormato, type FormPersonalizado, type FormOffset,
} from "@/lib/cotizacion-form";
import { guardarMixtaAction } from "@/app/actions/cotizaciones";
import { Calculadora } from "../cotizar/Calculadora";
import { CalculadoraOffset } from "../cotizar-offset/CalculadoraOffset";
import { CalculadoraProveedor } from "../cotizar-proveedor/CalculadoraProveedor";
import { CalculadoraGranFormato } from "../cotizar-granformato/CalculadoraGranFormato";
import { CalculadoraPersonalizado } from "../cotizar-personalizado/CalculadoraPersonalizado";

export type OffDefaults = { plancha: number; planchaMedio: number; planchaPliego: number; arranque: number; millar: number; tinta: number };

export type DatosCotizador = {
  cfg: Config;
  clientes: ClienteSimple[];
  equipos: EquipoItem[];
  materialesGF: MaterialGFItem[];
  productosGF: ProductoGFItem[];
  productosPop: ProductoPopItem[];
  offDefaults: OffDefaults;
  ojeteCosto: number;
  ojeteCm: number;
  margenMin?: number;
  interpretarHabilitado: boolean;
  /** Abre un editor ya prellenado al entrar (recotizar desde plantilla). */
  abrirInicial?: { tipo: TipoCotizacion; form: unknown; meta?: { cliente?: string; clienteId?: string; trabajo?: string } };
};

const TIPOS: { tipo: TipoCotizacion; label: string; hint: string; color: string }[] = [
  { tipo: "PROPIA", label: "Digital", hint: "Impresión digital · producción propia", color: "#0B7A93" },
  { tipo: "OFFSET", label: "Offset", hint: "Producción propia · planchas + tiraje", color: "#2C4A8A" },
  { tipo: "PROVEEDOR", label: "Proveedor", hint: "Trabajo tercerizado", color: "#5B3E8F" },
  { tipo: "GRAN_FORMATO", label: "Gran formato", hint: "Banners, vinil, pendones (tercerizado)", color: "#B23A48" },
  { tipo: "PERSONALIZADO", label: "Personalizado", hint: "Chapas, llaveros, DTF (tercerizado)", color: "#9A6A00" },
];
const LABEL_TIPO: Record<string, string> = Object.fromEntries(TIPOS.map((t) => [t.tipo, t.label]));

type Abierto =
  | { modo: "nuevo"; tipo: TipoCotizacion; form?: unknown }
  | { modo: "editar"; tipo: TipoCotizacion; itemId: string; form: unknown };

export function Cotizador(d: DatosCotizador) {
  const draft = useDraft();
  const [abierto, setAbierto] = useState<Abierto | null>(
    d.abrirInicial ? { modo: "nuevo", tipo: d.abrirInicial.tipo, form: d.abrirInicial.form } : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  // Al entrar desde una plantilla (recotizar), sembramos cliente/título si el
  // borrador está vacío, para que el ítem quede bajo esa cotización.
  useEffect(() => {
    const m = d.abrirInicial?.meta;
    if (!m) return;
    const actual = leerDraft();
    if (actual.items.length === 0 && !actual.meta.editarId && !actual.meta.cliente && !actual.meta.trabajo) {
      actualizarMetaDraft({ cliente: m.cliente ?? "", clienteId: m.clienteId ?? "", trabajo: m.trabajo ?? "" });
    }
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = draft.items.reduce((s, i) => s + (i.resumen?.ventaTotal ?? 0), 0);
  const editando = !!draft.meta.editarId;

  // Formulario inicial para un ítem nuevo del tipo elegido (con el cliente ya puesto).
  const formNuevo = (tipo: TipoCotizacion): unknown => {
    const cli = { cliente: draft.meta.cliente, clienteId: draft.meta.clienteId };
    switch (tipo) {
      case "PROPIA": return { ...nuevoForm(d.cfg), ...cli };
      case "OFFSET": return { ...nuevoFormOffset(d.cfg, d.offDefaults), ...cli };
      case "PROVEEDOR": return { ...nuevoFormProveedor(d.cfg), ...cli };
      case "GRAN_FORMATO": return { ...nuevoFormGranFormato(d.cfg), ...cli };
      case "PERSONALIZADO": return { ...nuevoFormPersonalizado(d.cfg), ...cli };
      default: return nuevoForm(d.cfg);
    }
  };

  const embed: EmbedCotizador | null = abierto && {
    editando: abierto.modo === "editar",
    onAgregar: (form, resumen) => {
      if (abierto.modo === "editar") reemplazarItemDraft(abierto.itemId, form, resumen);
      else agregarItemDraft(abierto.tipo, form, resumen, { cliente: draft.meta.cliente, clienteId: draft.meta.clienteId });
      setAbierto(null);
    },
    onAgregarVarios: (items) => {
      const cli = { cliente: draft.meta.cliente, clienteId: draft.meta.clienteId };
      for (const it of items) agregarItemDraft(abierto.tipo, it.form, it.resumen, cli);
      setAbierto(null);
    },
    onCancelar: () => setAbierto(null),
  };

  function guardar() {
    setError(null);
    if (!draft.items.length) { setError("Agrega al menos un ítem."); return; }
    if (!draft.meta.cliente.trim() && !draft.meta.trabajo.trim()) { setError("Indica el cliente o el título de la cotización."); return; }
    startTransition(async () => {
      const res = await guardarMixtaAction({ meta: draft.meta, items: draft.items.map((i) => ({ tipo: i.tipo, form: i.form })) });
      if (res?.error) setError(res.error);
      else vaciarDraft();
    });
  }

  // ─────────────────────── editor de un ítem (embebido) ───────────────────────
  if (abierto && embed) {
    const form = abierto.modo === "editar" ? abierto.form : (abierto.form ?? formNuevo(abierto.tipo));
    return (
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold">
            {abierto.modo === "editar" ? "Editar ítem" : "Nuevo ítem"} · {LABEL_TIPO[abierto.tipo]}
          </h2>
          <button type="button" onClick={() => setAbierto(null)}
            className="flex items-center gap-1 rounded-sm border border-regla px-2.5 py-1 text-xs font-medium text-kraft hover:border-tinta hover:text-tinta">
            <X size={13} /> Cancelar
          </button>
        </div>
        {abierto.tipo === "PROPIA" && (
          <Calculadora cfg={d.cfg} clientes={d.clientes} itemsIniciales={[form as FormCotizacion]}
            margenMin={d.margenMin} interpretarHabilitado={d.interpretarHabilitado} embed={embed} />
        )}
        {abierto.tipo === "OFFSET" && (
          <CalculadoraOffset cfg={d.cfg} clientes={d.clientes} equipos={d.equipos} offDefaults={d.offDefaults}
            formInicial={form as FormOffset} margenMin={d.margenMin} embed={embed} />
        )}
        {abierto.tipo === "PROVEEDOR" && (
          <CalculadoraProveedor cfg={d.cfg} clientes={d.clientes}
            formInicial={form as FormProveedor} margenMin={d.margenMin} embed={embed} />
        )}
        {abierto.tipo === "GRAN_FORMATO" && (
          <CalculadoraGranFormato cfg={d.cfg} clientes={d.clientes} materiales={d.materialesGF} productos={d.productosGF}
            ojeteCosto={d.ojeteCosto} ojeteCm={d.ojeteCm} formInicial={form as FormGranFormato} margenMin={d.margenMin} embed={embed} />
        )}
        {abierto.tipo === "PERSONALIZADO" && (
          <CalculadoraPersonalizado cfg={d.cfg} clientes={d.clientes} productos={d.productosPop}
            formInicial={form as FormPersonalizado} margenMin={d.margenMin} embed={embed} />
        )}
      </div>
    );
  }

  // ─────────────────────────── lista + guardado ───────────────────────────
  return (
    <div className="max-w-2xl">
      {editando ? (
        <div className="mb-3 rounded-sm border border-[#9AD3E0] bg-[#E6F4F8] px-3 py-2 text-sm text-[#0B5C6E]">
          Editando una cotización guardada · al guardar se actualiza esa misma cotización.
        </div>
      ) : null}

      {/* Cliente y título de la cotización */}
      <div className="rounded-sm border border-regla bg-hoja p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Cliente</span>
            <input value={draft.meta.cliente}
              onChange={(e) => actualizarMetaDraft({ cliente: e.target.value, clienteId: "" })}
              placeholder="Nombre del cliente"
              className="mt-1 block w-full rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian" />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">Título de la cotización</span>
            <input value={draft.meta.trabajo}
              onChange={(e) => actualizarMetaDraft({ trabajo: e.target.value })}
              placeholder="Ej. Paquete de campaña"
              className="mt-1 block w-full rounded-sm border border-regla bg-white px-2 py-1.5 text-sm outline-none focus:border-cian" />
          </label>
        </div>
      </div>

      {/* Agregar ítem: primero se elige el tipo */}
      <div className="mt-4 rounded-sm border border-regla bg-hoja p-4">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
          <Plus size={13} /> Agregar ítem — elige qué cotizar
        </div>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <button key={t.tipo} type="button" title={t.hint}
              onClick={() => { setError(null); setAbierto({ modo: "nuevo", tipo: t.tipo }); }}
              className="flex items-center gap-1.5 rounded-sm border border-regla px-3 py-1.5 text-sm font-medium hover:border-tinta">
              <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: t.color }} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ítems ya agregados */}
      <div className="mt-4 overflow-hidden rounded-sm border border-regla bg-hoja">
        <div className="flex items-center justify-between border-b border-regla bg-suave px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
          <span>{draft.items.length} ítem{draft.items.length !== 1 ? "s" : ""} en esta cotización</span>
          {draft.items.length > 0 && (
            <button type="button" onClick={() => vaciarDraft()} className="flex items-center gap-1 text-kraft hover:text-[#B23A48]">
              <Trash2 size={12} /> Vaciar
            </button>
          )}
        </div>
        {draft.items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-kraft">
            Aún no hay ítems. Elige un tipo arriba y agrégalo; puedes mezclar tipos y cantidades.
          </div>
        ) : (
          <ul className="divide-y divide-suave">
            {draft.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{it.resumen.titulo}</span>
                  <span className="text-[11px] text-kraft">{LABEL_TIPO[it.tipo] ?? it.resumen.tipoLabel} · {fmtNum(it.resumen.cantidad, 0)} u</span>
                </span>
                <span className="w-24 text-right font-mono text-sm font-bold">{usd(it.resumen.ventaTotal)}</span>
                <button type="button" onClick={() => { setError(null); setAbierto({ modo: "editar", tipo: it.tipo, itemId: it.id, form: it.form }); }}
                  aria-label="Editar ítem" title="Editar"
                  className="rounded-sm p-1 text-kraft hover:bg-suave hover:text-tinta"><Pencil size={14} /></button>
                <button type="button" onClick={() => quitarItemDraft(it.id)} aria-label="Quitar ítem" title="Quitar"
                  className="rounded-sm p-1 text-kraft hover:bg-suave hover:text-[#B23A48]"><X size={14} /></button>
              </li>
            ))}
          </ul>
        )}
        {draft.items.length > 0 && (
          <div className="flex items-center justify-between border-t border-regla px-4 py-3">
            <span className="text-sm font-bold">Venta total</span>
            <span className="font-mono text-base font-bold">{usd(total)}</span>
          </div>
        )}
      </div>

      {error ? <div className="mt-3 rounded-sm border border-[#E4B3B3] bg-[#FDECED] px-3 py-2 text-sm text-[#8A1C1C]">{error}</div> : null}

      <button type="button" onClick={guardar} disabled={pendiente || draft.items.length === 0}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-tinta px-3 py-2.5 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-50">
        <Save size={15} /> {pendiente ? "Guardando…" : editando ? "Guardar cambios" : "Guardar cotización"}
      </button>
    </div>
  );
}
