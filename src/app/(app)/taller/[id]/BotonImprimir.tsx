"use client";

import { Printer } from "lucide-react";

export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-sm border border-regla px-3 py-1.5 text-sm font-medium hover:border-tinta"
    >
      <Printer size={14} />
      Imprimir
    </button>
  );
}
