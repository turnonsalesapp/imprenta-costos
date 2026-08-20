"use client";

import { useRef } from "react";
import type { Rol } from "@prisma/client";
import { cambiarRol } from "@/app/actions/usuarios";
import { ETIQUETA_ROL } from "@/lib/roles";

/**
 * Selector de rol que envía el cambio al servidor apenas se elige otra opción.
 * `disabled` se usa para el propio admin (no puede cambiarse su rol y quedarse
 * sin acceso) y para un objetivo SUPERADMIN cuando quien mira no lo es. Las
 * `opciones` que puede ASIGNAR dependen del rol de quien administra: solo un
 * SUPERADMIN ve la opción SUPERADMIN. El servidor vuelve a validar todo.
 */
export function SelectorRol({
  id,
  rol,
  opciones,
  disabled,
}: {
  id: string;
  rol: Rol;
  opciones: Rol[];
  disabled?: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  // El valor actual siempre debe estar en la lista, aunque no sea asignable por
  // quien mira (p. ej. un ADMIN viendo una fila SUPERADMIN, con el select fijo).
  const lista = opciones.includes(rol) ? opciones : [rol, ...opciones];

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
        {lista.map((r) => (
          <option key={r} value={r}>
            {ETIQUETA_ROL[r]}
          </option>
        ))}
      </select>
    </form>
  );
}
