"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Pencil, Copy, Printer, Trash2 } from "lucide-react";
import { cargarDraft } from "@/lib/draft-cotizacion";
import { cargarEnCotizadorAction, eliminarCotizacionAction } from "@/app/actions/cotizaciones";

/**
 * Acciones por fila del listado: Editar, Usar como base, Imprimir, Eliminar.
 * Editar/Usar como base cargan la cotización en el cotizador unificado.
 */
export function AccionesFila({
  id, estado, puedeEditar, puedeEliminar,
}: {
  id: string;
  estado: string;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}) {
  const router = useRouter();
  const [cargando, startTransition] = useTransition();

  function cargar(modo: "editar" | "copia") {
    startTransition(async () => {
      const carga = await cargarEnCotizadorAction(id, modo);
      if (carga) {
        cargarDraft(carga.meta, carga.items);
        router.push("/cotizacion-nueva");
      }
    });
  }

  const btn = "rounded-sm p-1.5 text-kraft hover:bg-suave hover:text-tinta disabled:opacity-40";

  return (
    <div className="flex items-center justify-end gap-0.5">
      {puedeEditar && estado === "BORRADOR" && (
        <button type="button" title="Editar" aria-label="Editar" onClick={() => cargar("editar")} disabled={cargando} className={btn}>
          <Pencil size={15} />
        </button>
      )}
      {puedeEditar && (
        <button type="button" title="Usar como base" aria-label="Usar como base" onClick={() => cargar("copia")} disabled={cargando} className={btn}>
          <Copy size={15} />
        </button>
      )}
      <Link href={`/cotizaciones/${id}/imprimir`} title="Imprimir / PDF" aria-label="Imprimir" className={btn}>
        <Printer size={15} />
      </Link>
      {puedeEliminar && (
        <form
          action={eliminarCotizacionAction}
          onSubmit={(e) => { if (!confirm("¿Eliminar este borrador? No se puede deshacer.")) e.preventDefault(); }}
        >
          <input type="hidden" name="id" value={id} />
          <button type="submit" title="Eliminar" aria-label="Eliminar"
            className="rounded-sm p-1.5 text-kraft hover:bg-suave hover:text-[#B23A48]">
            <Trash2 size={15} />
          </button>
        </form>
      )}
    </div>
  );
}
