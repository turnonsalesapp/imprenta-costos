"use client";

import { useRef } from "react";
import type { Rol } from "@prisma/client";
import { cambiarEstructura } from "@/app/actions/usuarios";

/**
 * Permiso por usuario: ver la estructura de costos (costo, margen y desglose) o
 * solo el precio final. Aplica a cualquier rol que vea precios. TALLER nunca ve
 * precios, así que no se configura.
 */
export function SelectorEstructura({
  id, rol, verEstructura,
}: { id: string; rol: Rol; verEstructura: boolean }) {
  const form = useRef<HTMLFormElement>(null);
  if (rol === "TALLER") return <span className="text-[11px] text-kraft">No ve precios</span>;

  return (
    <form ref={form} action={cambiarEstructura}>
      <input type="hidden" name="id" value={id} />
      <label className="inline-flex items-center gap-1 text-[11px] font-medium">
        <input
          type="checkbox" name="ver" defaultChecked={verEstructura}
          onChange={() => form.current?.requestSubmit()}
        />
        Ve estructura de costos
      </label>
    </form>
  );
}
