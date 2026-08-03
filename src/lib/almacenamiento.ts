/**
 * Adaptador de almacenamiento de adjuntos del hilo del trabajo.
 *
 * Dos backends intercambiables, elegidos por el entorno (`ALMACEN_ADJUNTOS`):
 *   - "db"    → guarda los bytes como `bytea` en la columna `Adjunto.datos`.
 *   - "drive" → subiría a Google Drive con una cuenta de servicio. AÚN NO
 *               implementado: lanza si se selecciona sin credenciales.
 *
 * La validación de tamaño y tipo es PURA (sin base ni entorno) para poder
 * probarla y reusarla desde la acción y desde la ruta de subida.
 */

/** Límite por archivo: 8 MB. */
export const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Tipos MIME aceptados: imágenes comunes, PDF y ofimática habitual. Todo lo
 * demás (ejecutables, scripts, etc.) se rechaza.
 */
export const TIPOS_PERMITIDOS: readonly string[] = [
  // imágenes
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  // documentos
  "application/pdf",
  // ofimática
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
];

/** ¿El tipo MIME corresponde a algo que se puede mostrar en línea (inline)? */
export function esInline(tipo: string): boolean {
  return tipo === "application/pdf" || tipo.startsWith("image/");
}

export type ArchivoEntrada = { nombre: string; tipo: string; tamano: number };
export type Validacion = { ok: true } | { ok: false; error: string };

/**
 * Valida un archivo por tamaño y tipo. Pura: no toca base ni entorno. La usan
 * tanto la acción de subida como la propia capa de almacenamiento.
 */
export function validarArchivo(f: ArchivoEntrada): Validacion {
  if (!f.nombre || !f.nombre.trim()) {
    return { ok: false, error: "El archivo no tiene nombre." };
  }
  if (!Number.isFinite(f.tamano) || f.tamano <= 0) {
    return { ok: false, error: "El archivo está vacío." };
  }
  if (f.tamano > MAX_BYTES) {
    return { ok: false, error: "El archivo supera el límite de 8 MB." };
  }
  if (!TIPOS_PERMITIDOS.includes(f.tipo)) {
    return { ok: false, error: "Tipo de archivo no permitido." };
  }
  return { ok: true };
}

/** Nombre de backend válido. */
export type NombreAlmacen = "db" | "drive";

/** Resultado de guardar: lo que se persiste en la fila `Adjunto`. */
export type ResultadoGuardado = {
  almacen: NombreAlmacen;
  datos?: Buffer;
  driveFileId?: string;
  url?: string;
};

export type ArchivoBinario = { nombre: string; tipo: string; bytes: Buffer };

/** Interfaz común de todo backend de almacenamiento. */
export interface Almacen {
  readonly nombre: NombreAlmacen;
  guardar(f: ArchivoBinario): Promise<ResultadoGuardado>;
}

/** Backend "db": guarda los bytes como bytea en la propia fila del adjunto. */
export const almacenDb: Almacen = {
  nombre: "db",
  async guardar(f: ArchivoBinario): Promise<ResultadoGuardado> {
    return { almacen: "db", datos: f.bytes };
  },
};

/**
 * Backend "drive": subiría el archivo a Google Drive con una cuenta de servicio
 * y guardaría solo la referencia (driveFileId + url) en la base.
 *
 * // TODO Drive: service account (GOOGLE_SERVICE_ACCOUNT_JSON + GDRIVE_FOLDER_ID).
 * Aún NO está implementado (no se agregan dependencias pesadas como googleapis
 * por ahora). Si se selecciona sin credenciales, lanza de forma explícita.
 */
export const almacenDrive: Almacen = {
  nombre: "drive",
  async guardar(): Promise<ResultadoGuardado> {
    // TODO Drive: subir con GOOGLE_SERVICE_ACCOUNT_JSON a la carpeta GDRIVE_FOLDER_ID
    // y devolver { almacen: "drive", driveFileId, url }.
    throw new Error(
      "Almacén 'drive' no configurado: faltan GOOGLE_SERVICE_ACCOUNT_JSON y GDRIVE_FOLDER_ID.",
    );
  },
};

/**
 * Elige el backend según `ALMACEN_ADJUNTOS` (default "db"). Acepta un valor
 * explícito para poder probar la selección sin tocar el entorno. Un valor
 * desconocido cae a "db" (comportamiento seguro por defecto).
 */
export function elegirAlmacen(valor?: string): Almacen {
  const nombre = (valor ?? process.env.ALMACEN_ADJUNTOS ?? "db").trim().toLowerCase();
  if (nombre === "drive") return almacenDrive;
  return almacenDb;
}
