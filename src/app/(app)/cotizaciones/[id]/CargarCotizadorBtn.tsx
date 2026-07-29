"use client";

import { useRouter } from "next/navigation";
import { Pencil, Copy } from "lucide-react";
import { cargarDraft, type DraftResumen } from "@/lib/draft-cotizacion";
import type { TipoCotizacion } from "@prisma/client";

type Carga = {
  meta: { cliente: string; clienteId: string; trabajo: string; editarId: string };
  items: { tipo: TipoCotizacion; form: unknown; resumen: DraftResumen }[];
};

/**
 * Carga una cotización guardada (de cualquier tipo) en el cotizador unificado y
 * navega ahí. `accion="editar"` actualiza esa misma cotización al guardar;
 * `accion="copia"` la usa como base para una nueva (sin editarId).
 */
export function CargarCotizadorBtn({ carga, accion }: { carga: Carga; accion: "editar" | "copia" }) {
  const router = useRouter();
  const editar = accion === "editar";
  return (
    <button
      type="button"
      onClick={() => { cargarDraft(carga.meta, carga.items); router.push("/cotizacion-nueva"); }}
      className="flex items-center gap-1 rounded-sm border border-regla px-3 py-1.5 text-sm font-medium hover:border-tinta"
    >
      {editar ? <Pencil size={13} /> : <Copy size={13} />} {editar ? "Editar" : "Usar como base"}
    </button>
  );
}
