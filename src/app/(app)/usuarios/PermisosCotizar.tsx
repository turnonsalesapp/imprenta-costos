"use client";

import { useRef } from "react";
import type { Rol } from "@prisma/client";
import { cambiarPermisos } from "@/app/actions/usuarios";

const TIPOS: [string, string][] = [
  ["PROPIA", "Digital"],
  ["OFFSET", "Offset"],
  ["PROVEEDOR", "Proveedor"],
  ["GRAN_FORMATO", "Gran formato"],
  ["PERSONALIZADO", "Personalizado"],
];

/**
 * Permisos de cotización por usuario. ADMIN siempre puede todo (no se configura).
 * TALLER no cotiza. Para VENDEDOR: casillas por tipo + "puede eliminar".
 * Si no marca ningún tipo, el usuario no puede cotizar.
 */
export function PermisosCotizar({
  id, rol, puedeCotizar, tiposCotizar, puedeEliminar,
}: {
  id: string;
  rol: Rol;
  puedeCotizar: boolean;
  tiposCotizar: string[];
  puedeEliminar: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);

  if (rol === "ADMIN" || rol === "SUPERADMIN") return <span className="text-[11px] text-kraft">Todo · puede eliminar</span>;
  if (rol === "TALLER") return <span className="text-[11px] text-kraft">No cotiza</span>;

  // Vacío = todos (usuario recién creado). Con lista, solo esos. Sin permiso, ninguno.
  const marcado = (t: string) => puedeCotizar && (tiposCotizar.length === 0 || tiposCotizar.includes(t));

  return (
    <form ref={form} action={cambiarPermisos} className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <input type="hidden" name="id" value={id} />
      {TIPOS.map(([t, label]) => (
        <label key={t} className="inline-flex items-center gap-1 text-[11px] text-kraft">
          <input type="checkbox" name="tipos" value={t} defaultChecked={marcado(t)}
            onChange={() => form.current?.requestSubmit()} />
          {label}
        </label>
      ))}
      <label className="inline-flex items-center gap-1 text-[11px] font-medium">
        <input type="checkbox" name="eliminar" defaultChecked={puedeEliminar}
          onChange={() => form.current?.requestSubmit()} />
        Eliminar
      </label>
    </form>
  );
}
