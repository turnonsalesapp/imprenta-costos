"use client";

import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { cargarDraft, type DraftResumen } from "@/lib/draft-cotizacion";
import type { TipoCotizacion } from "@prisma/client";

type CargaMixta = {
  meta: { cliente: string; clienteId: string; trabajo: string; editarId: string };
  items: { tipo: TipoCotizacion; form: unknown; resumen: DraftResumen }[];
};

/** Carga una cotización mixta guardada en el carrito y va a la página de armado. */
export function EditarMixtaBtn({ carga }: { carga: CargaMixta }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => { cargarDraft(carga.meta, carga.items); router.push("/cotizacion-nueva"); }}
      className="flex items-center gap-1 rounded-sm border border-regla px-3 py-1.5 text-sm font-medium hover:border-tinta"
    >
      <Pencil size={13} /> Editar
    </button>
  );
}
