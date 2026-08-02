"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { eliminarProveedorAction } from "@/app/actions/proveedores";

/**
 * Borra un proveedor con confirmación. La acción devuelve {error} (el server
 * bloquea el predeterminado) → useTransition para mostrar el estado.
 */
export function BorrarProveedor({ id, nombre }: { id: string; nombre: string }) {
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function borrar() {
    if (!confirm(`¿Borrar el proveedor «${nombre}»? No se puede deshacer.`)) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const r = await eliminarProveedorAction(fd);
      if (r.error) setError(r.error);
    });
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={borrar}
        disabled={pendiente}
        title="Borrar"
        aria-label="Borrar"
        className="rounded-sm p-1.5 text-kraft hover:bg-suave hover:text-[#B23A48] disabled:opacity-40"
      >
        <Trash2 size={15} />
      </button>
      {error && <span className="text-[11px] text-[#8A1C1C]">{error}</span>}
    </span>
  );
}
