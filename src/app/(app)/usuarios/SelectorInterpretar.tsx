"use client";

import { useRef } from "react";
import { cambiarInterpretar } from "@/app/actions/usuarios";

/**
 * Override del intérprete de IA por usuario:
 *   null  → "heredar" (sigue el interruptor general del sistema)
 *   true  → "si"      (siempre activo para este usuario)
 *   false → "no"      (siempre apagado para este usuario)
 * `disabled` para el rol TALLER: no cotiza, así que no aplica.
 */
export function SelectorInterpretar({
  id,
  valor,
  disabled,
}: {
  id: string;
  valor: boolean | null;
  disabled?: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  const actual = valor == null ? "heredar" : valor ? "si" : "no";

  return (
    <form ref={form} action={cambiarInterpretar}>
      <input type="hidden" name="id" value={id} />
      <select
        name="valor"
        defaultValue={actual}
        disabled={disabled}
        onChange={() => form.current?.requestSubmit()}
        className="rounded-sm border border-regla bg-white px-2 py-1 text-sm outline-none focus:border-cian disabled:opacity-40"
      >
        <option value="heredar">Según el sistema</option>
        <option value="si">Activado</option>
        <option value="no">Desactivado</option>
      </select>
    </form>
  );
}
