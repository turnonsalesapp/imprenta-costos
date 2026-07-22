import "server-only";

/**
 * Limitador de tasa simple, en memoria del proceso (ventana fija).
 *
 * Alcance: este sistema corre como un solo servicio en Railway, así que un
 * contador en memoria basta para frenar fuerza bruta de login y abuso de costo
 * de la IA. No es un limitador distribuido: se reinicia en cada despliegue y no
 * se comparte entre instancias. Si algún día hay varias instancias, moverlo a
 * Redis. Fail-closed: al alcanzar el tope, se niega.
 */

type Registro = { conteo: number; reinicioEn: number };

const CUBOS = new Map<string, Registro>();
const MAX_CLAVES = 10_000; // cota de memoria: purga si crece demasiado.

export type ResultadoLimite = {
  ok: boolean;
  /** Intentos que quedan en la ventana actual. */
  restantes: number;
  /** Segundos hasta que la ventana se reinicia. */
  enSegundos: number;
};

/**
 * Registra un intento para `clave` y dice si se permite.
 * @param clave  identificador del sujeto (ej. `login:ip:correo`).
 * @param max    intentos permitidos por ventana.
 * @param ventanaMs  duración de la ventana en milisegundos.
 */
export function limitar(clave: string, max: number, ventanaMs: number): ResultadoLimite {
  const ahora = Date.now();
  const r = CUBOS.get(clave);

  if (!r || r.reinicioEn <= ahora) {
    if (CUBOS.size >= MAX_CLAVES) purgarVencidos(ahora);
    CUBOS.set(clave, { conteo: 1, reinicioEn: ahora + ventanaMs });
    return { ok: true, restantes: max - 1, enSegundos: Math.ceil(ventanaMs / 1000) };
  }

  const enSegundos = Math.ceil((r.reinicioEn - ahora) / 1000);
  if (r.conteo >= max) return { ok: false, restantes: 0, enSegundos };

  r.conteo++;
  return { ok: true, restantes: max - r.conteo, enSegundos };
}

/** Limpia el registro de una clave (ej. tras un login exitoso). */
export function reiniciarLimite(clave: string): void {
  CUBOS.delete(clave);
}

function purgarVencidos(ahora: number): void {
  for (const [k, v] of CUBOS) if (v.reinicioEn <= ahora) CUBOS.delete(k);
}
