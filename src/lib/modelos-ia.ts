/**
 * Modelos de IA disponibles para el intérprete de solicitudes. Puro (sin base
 * ni server-only) para compartirlo entre la pantalla de Variables (cliente) y
 * el servidor. El ADMIN elige uno en Variables; si no, se usa el de por defecto.
 */

export type ModeloIA = { id: string; label: string; nota: string };

/** Por defecto: el más capaz. Se usa si el ADMIN no eligió otro. */
export const MODELO_IA_DEFAULT = "claude-opus-4-8";

export const MODELOS_IA: ModeloIA[] = [
  { id: "claude-opus-4-8", label: "Opus 4.8", nota: "El más capaz · recomendado" },
  { id: "claude-sonnet-5", label: "Sonnet 5", nota: "Equilibrado · más económico" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5", nota: "El más rápido y barato" },
];

/** Devuelve un id de modelo válido: el pedido si existe, o el por defecto. */
export function modeloValido(id: string | null | undefined): string {
  const v = (id ?? "").trim();
  return MODELOS_IA.some((m) => m.id === v) ? v : MODELO_IA_DEFAULT;
}
