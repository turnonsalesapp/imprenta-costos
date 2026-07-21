"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearUsuario, type EstadoCrear } from "@/app/actions/usuarios";
import { DESCRIPCION_ROL, ROLES, ETIQUETA_ROL } from "@/lib/roles";

const INICIAL: EstadoCrear = { error: null, ok: false };

export function CrearUsuarioForm() {
  const [estado, action, pendiente] = useActionState(crearUsuario, INICIAL);
  const form = useRef<HTMLFormElement>(null);

  // Al crear con éxito, limpiamos el formulario.
  useEffect(() => {
    if (estado.ok) form.current?.reset();
  }, [estado.ok]);

  return (
    <form
      ref={form}
      action={action}
      className="rounded-sm border border-regla bg-hoja p-4"
    >
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-kraft">
        Nuevo usuario
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] text-kraft">Nombre</span>
          <input
            name="nombre"
            required
            className="mt-1 w-full rounded-sm border border-regla bg-white px-3 py-2 text-sm outline-none focus:border-cian"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-kraft">Correo</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-sm border border-regla bg-white px-3 py-2 text-sm outline-none focus:border-cian"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-kraft">Clave (mín. 6)</span>
          <input
            name="clave"
            type="password"
            minLength={6}
            required
            className="mt-1 w-full rounded-sm border border-regla bg-white px-3 py-2 text-sm outline-none focus:border-cian"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-kraft">Rol</span>
          <select
            name="rol"
            defaultValue="VENDEDOR"
            className="mt-1 w-full rounded-sm border border-regla bg-white px-3 py-2 text-sm outline-none focus:border-cian"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ETIQUETA_ROL[r]} — {DESCRIPCION_ROL[r]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {estado.error && (
        <p className="mt-3 rounded-sm border border-[#E8B4B4] bg-[#FDEDED] px-3 py-2 text-sm text-[#8A1C1C]">
          {estado.error}
        </p>
      )}
      {estado.ok && (
        <p className="mt-3 rounded-sm border border-[#B4E0C6] bg-[#EDF9F1] px-3 py-2 text-sm text-exito">
          Usuario creado.
        </p>
      )}

      <button
        type="submit"
        disabled={pendiente}
        className="mt-3 rounded-sm bg-tinta px-4 py-2 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-50"
      >
        {pendiente ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}
