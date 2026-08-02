"use client";

import { useTransition } from "react";
import { fijarPreferidoAction } from "@/app/actions/proveedores";

/**
 * Botón "Usar este": fija el proveedor como preferido de un papel y copia su
 * precio al precio efectivo. Acción con args tipados → useTransition (no form).
 */
export function BotonPreferido({
  papelId, proveedorId,
}: {
  papelId: string;
  proveedorId: string;
}) {
  const [pendiente, startTransition] = useTransition();

  function usar() {
    startTransition(async () => {
      await fijarPreferidoAction(papelId, proveedorId);
    });
  }

  return (
    <button
      type="button"
      onClick={usar}
      disabled={pendiente}
      className="rounded-sm border border-regla px-2 py-0.5 text-[11px] font-medium text-kraft hover:border-tinta hover:text-tinta disabled:opacity-40"
    >
      {pendiente ? "…" : "Usar este"}
    </button>
  );
}
