import { z } from "zod";

/**
 * Fuente ÚNICA y tipada del entorno. En vez de regar `process.env.X` por el
 * código (donde un typo o una variable faltante se descubre en runtime), todo
 * pasa por aquí.
 *
 * Diseño:
 *  - Los accesos son GETTERS perezosos: solo leen `process.env` cuando se usan,
 *    nunca al importar. Así no rompen el `next build` (que importa los módulos
 *    sin que existan las variables) ni el runtime Edge del middleware.
 *  - No importa `server-only` ni Prisma, para que el middleware (Edge) pueda
 *    usarlo igual que el servidor Node.
 *  - `verificarEnv()` valida TODO de una vez con Zod, para un chequeo explícito
 *    de arranque o de CI.
 */

const TASAS_DEFAULT = "https://ve.dolarapi.com/v1/dolares";

function requerida(nombre: "DATABASE_URL" | "AUTH_SECRET"): string {
  const v = process.env[nombre];
  if (!v || !v.trim()) throw new Error(`Falta ${nombre} en el entorno.`);
  return v;
}

function opcional(nombre: string): string {
  return (process.env[nombre] ?? "").trim();
}

export const env = {
  /** Cadena de conexión PostgreSQL. Obligatoria. */
  get databaseUrl(): string { return requerida("DATABASE_URL"); },
  /** Secreto para firmar los tokens de sesión. Obligatorio. */
  get authSecret(): string { return requerida("AUTH_SECRET"); },
  get esProduccion(): boolean { return process.env.NODE_ENV === "production"; },
  get esDesarrollo(): boolean { return process.env.NODE_ENV === "development"; },

  /** API key de Anthropic (intérprete de IA). "" si no está configurada. */
  get anthropicApiKey(): string { return opcional("ANTHROPIC_API_KEY"); },
  /** Modelo de IA de respaldo (el real se elige en Variables). "" si no está. */
  get anthropicModel(): string { return opcional("ANTHROPIC_MODEL"); },
  /** Token que protege el cron de tasas. "" = endpoint deshabilitado. */
  get cronSecret(): string { return opcional("CRON_SECRET"); },
  /** Fuente externa de tasas; cae al valor por defecto si no se define. */
  get tasasApi(): string { return opcional("TASAS_API") || TASAS_DEFAULT; },
} as const;

/**
 * Valida el entorno completo. Devuelve el resultado de Zod (no lanza) para que
 * quien llame decida: útil en un chequeo de arranque, un script o CI.
 */
export function verificarEnv(): z.SafeParseReturnType<unknown, unknown> {
  const schema = z.object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria."),
    AUTH_SECRET: z.string().min(1, "AUTH_SECRET es obligatoria."),
    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_MODEL: z.string().optional(),
    CRON_SECRET: z.string().optional(),
    TASAS_API: z.string().url("TASAS_API debe ser una URL válida.").optional(),
  });
  return schema.safeParse(process.env);
}
