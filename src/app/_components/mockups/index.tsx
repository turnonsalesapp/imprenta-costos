import type { ReactNode } from "react";

/**
 * Ilustraciones (mockups SVG) de cada paso de los tutoriales. Clave → SVG.
 * Son maquetas on-brand de cómo se ve cada pantalla; están pensadas como
 * "ranuras": se pueden reemplazar por capturas reales cuando se tengan.
 *
 * Un paso cuyo `mockup` no exista aquí simplemente se muestra sin imagen, así
 * que el tutorial funciona aunque falte alguna ilustración.
 */
export const MOCKUPS: Record<string, ReactNode> = {};
