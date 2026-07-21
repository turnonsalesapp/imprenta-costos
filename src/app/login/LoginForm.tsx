"use client";

import { useActionState } from "react";
import { loginAction, type EstadoLogin } from "@/app/actions/auth";

const INICIAL: EstadoLogin = { error: null };

export function LoginForm() {
  const [estado, action, pendiente] = useActionState(loginAction, INICIAL);

  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-widest text-kraft">Correo</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          autoFocus
          className="mt-1 w-full rounded-sm border border-regla bg-hoja px-3 py-2 text-sm outline-none focus:border-cian"
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-widest text-kraft">Clave</span>
        <input
          type="password"
          name="clave"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-sm border border-regla bg-hoja px-3 py-2 text-sm outline-none focus:border-cian"
        />
      </label>

      {estado.error && (
        <p className="rounded-sm border border-[#E8B4B4] bg-[#FDEDED] px-3 py-2 text-sm text-[#8A1C1C]">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pendiente}
        className="w-full rounded-sm bg-tinta px-4 py-2.5 text-sm font-bold text-hoja transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pendiente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
