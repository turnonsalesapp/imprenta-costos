"use client";

import { useActionState } from "react";
import {
  crearClienteAction, editarClienteAction, type EstadoCliente,
} from "@/app/actions/clientes";

export type ClienteInicial = {
  id?: string;
  nombre?: string;
  rif?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  notas?: string | null;
};

const INICIAL: EstadoCliente = { error: null };

const inputCls =
  "mt-1 w-full rounded-sm border border-regla bg-hoja px-3 py-2 text-sm outline-none focus:border-cian";

export function ClienteForm({
  modo,
  initial,
}: {
  modo: "crear" | "editar";
  initial?: ClienteInicial;
}) {
  const action = modo === "crear" ? crearClienteAction : editarClienteAction;
  const [estado, formAction, pendiente] = useActionState(action, INICIAL);

  return (
    <form action={formAction} className="rounded-sm border border-regla bg-hoja p-4">
      {modo === "editar" && <input type="hidden" name="id" value={initial?.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Nombre *" name="nombre" defaultValue={initial?.nombre} required />
        <Campo label="RIF / Cédula" name="rif" defaultValue={initial?.rif} />
        <Campo label="Contacto" name="contacto" defaultValue={initial?.contacto} />
        <Campo label="Teléfono" name="telefono" defaultValue={initial?.telefono} />
        <Campo label="Correo" name="email" type="email" defaultValue={initial?.email} />
        <Campo label="Dirección" name="direccion" defaultValue={initial?.direccion} />
      </div>
      <label className="mt-3 block">
        <span className="text-[11px] text-kraft">Notas</span>
        <textarea name="notas" rows={2} defaultValue={initial?.notas ?? ""} className={inputCls} />
      </label>

      {estado.error && (
        <p className="mt-3 rounded-sm border border-[#E8B4B4] bg-[#FDEDED] px-3 py-2 text-sm text-[#8A1C1C]">
          {estado.error}
        </p>
      )}
      {estado.ok && (
        <p className="mt-3 rounded-sm border border-[#B4E0C6] bg-[#EDF9F1] px-3 py-2 text-sm text-exito">
          Cambios guardados.
        </p>
      )}

      <button
        type="submit"
        disabled={pendiente}
        className="mt-3 rounded-sm bg-tinta px-4 py-2 text-sm font-bold text-hoja hover:opacity-90 disabled:opacity-50"
      >
        {pendiente ? "Guardando…" : modo === "crear" ? "Crear cliente" : "Guardar cambios"}
      </button>
    </form>
  );
}

function Campo({
  label, name, defaultValue, type, required,
}: {
  label: string; name: string; defaultValue?: string | null; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-kraft">{label}</span>
      <input
        name={name}
        type={type ?? "text"}
        required={required}
        defaultValue={defaultValue ?? ""}
        className={inputCls}
      />
    </label>
  );
}
