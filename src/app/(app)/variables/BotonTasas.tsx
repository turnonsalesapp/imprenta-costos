"use client";

import { useActionState } from "react";
import { actualizarTasasAction, type EstadoVar } from "@/app/actions/variables";

const INICIAL: EstadoVar = { error: null };

export function BotonTasas() {
  const [estado, action, pend] = useActionState(actualizarTasasAction, INICIAL);
  return (
    <form action={action} className="mb-2 flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pend}
        className="rounded-sm border border-cian px-3 py-1.5 text-sm font-bold text-cian hover:bg-[#E6F4F8] disabled:opacity-50"
      >
        {pend ? "Consultando la fuente…" : "Traer tasas de la fuente"}
      </button>
      {estado.error && <span className="text-sm text-[#8A1C1C]">{estado.error}</span>}
      {estado.msg && <span className="text-sm text-exito">{estado.msg}</span>}
    </form>
  );
}
