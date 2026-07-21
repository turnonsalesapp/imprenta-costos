"use client";

import { useRef } from "react";
import type { Rol } from "@prisma/client";
import { cambiarRol } from "@/app/actions/usuarios";
import { ROLES, ETIQUETA_ROL } from "@/lib/roles";

/**
 * Selector de rol que envía el cambio al servidor apenas se elige otra opción.
 * `disabled` se usa para el propio admin: no puede cambiarse su rol y quedarse
 * sin acceso (el servidor además lo ignora).
 */
export function SelectorRol({
  id,
  rol,
  disabled,
}: {
  id: string;
  rol: Rol;
  disabled?: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);

  return (
    <form ref={form} action={cambiarRol}>
      <input type="hidden" name="id" value={id} />
      <select
        name="rol"
        defaultValue={rol}
        disabled={disabled}
        onChange={() => form.current?.requestSubmit()}
        className="rounded-sm border border-regla bg-white px-2 py-1 text-sm outline-none focus:border-cian disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ETIQUETA_ROL[r]}
          </option>
        ))}
      </select>
    </form>
  );
}
