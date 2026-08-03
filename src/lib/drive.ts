import "server-only";
import { SignJWT, importPKCS8 } from "jose";

/**
 * Integración con Google Drive vía CUENTA DE SERVICIO, sin dependencias pesadas
 * (usa `jose` + fetch). Sube adjuntos a una carpeta de una Unidad Compartida y
 * los descarga en streaming desde el servidor, para que cualquier usuario de la
 * app pueda verlos aunque no tenga cuenta de Google.
 *
 * Config por entorno:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  → el JSON de la cuenta de servicio (crudo o base64).
 *   GDRIVE_FOLDER_ID             → ID de la carpeta destino (en Unidad Compartida).
 *
 * La cuenta de servicio debe tener acceso de Editor a esa carpeta/unidad.
 */

type Credenciales = { client_email: string; private_key: string; token_uri?: string };

/** Lee y parsea el JSON de la cuenta de servicio (acepta crudo o base64). */
function credenciales(): Credenciales {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) throw new Error("Falta GOOGLE_SERVICE_ACCOUNT_JSON.");
  let texto = raw;
  if (!raw.startsWith("{")) {
    // Viene en base64.
    texto = Buffer.from(raw, "base64").toString("utf8");
  }
  const c = JSON.parse(texto) as Credenciales;
  if (!c.client_email || !c.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON incompleto (client_email/private_key).");
  }
  // Las claves en variables de entorno suelen traer los saltos escapados.
  c.private_key = c.private_key.replace(/\\n/g, "\n");
  return c;
}

function carpetaId(): string {
  const id = process.env.GDRIVE_FOLDER_ID?.trim();
  if (!id) throw new Error("Falta GDRIVE_FOLDER_ID.");
  return id;
}

// Caché simple del token de acceso en memoria (se renueva ~1 min antes de expirar).
let tokenCache: { token: string; expira: number } | null = null;

async function accessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expira) return tokenCache.token;

  const c = credenciales();
  const tokenUri = c.token_uri || "https://oauth2.googleapis.com/token";
  const key = await importPKCS8(c.private_key, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/drive" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(c.client_email)
    .setAudience(tokenUri)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`Drive: no se pudo obtener token (${res.status}).`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expira: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

/** ¿Está configurado el backend de Drive? (para elegir con seguridad). */
export function driveConfigurado(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON && !!process.env.GDRIVE_FOLDER_ID;
}

/** Sube un archivo a la carpeta configurada. Devuelve el fileId y el enlace web. */
export async function subirADrive(
  f: { nombre: string; tipo: string; bytes: Buffer },
): Promise<{ id: string; webViewLink?: string }> {
  const token = await accessToken();
  const metadata = { name: f.nombre, parents: [carpetaId()] };

  // Subida multipart/related: metadata JSON + el binario, en un solo POST.
  const boundary = "imprenta-" + Math.random().toString(36).slice(2);
  const pre =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: ${f.tipo || "application/octet-stream"}\r\n\r\n`;
  const post = `\r\n--${boundary}--`;
  const cuerpo = Buffer.concat([Buffer.from(pre, "utf8"), f.bytes, Buffer.from(post, "utf8")]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: new Uint8Array(cuerpo),
    },
  );
  if (!res.ok) {
    throw new Error(`Drive: falló la subida (${res.status}).`);
  }
  const data = (await res.json()) as { id: string; webViewLink?: string };
  return { id: data.id, webViewLink: data.webViewLink };
}

/** Descarga un archivo de Drive por su fileId (para servirlo desde la app). */
export async function descargarDeDrive(fileId: string): Promise<Buffer> {
  const token = await accessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Drive: falló la descarga (${res.status}).`);
  }
  return Buffer.from(await res.arrayBuffer());
}
